import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Button, TextField, Box, Typography, Alert, CircularProgress,
    Drawer, IconButton, Card, CardActionArea, CardContent,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import LabelOffIcon from '@mui/icons-material/LabelOff';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import BlockIcon from '@mui/icons-material/Block';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { createManualDemand, getDemands, getUncategorizedDemands, type DemandResponseDto } from '../service/search.api.service';
import { listRejectedMessages } from '../service/rejected-messages.api.service';
import { useSnackbar } from '../contexts/SnackbarContext';
import { DemandStatusEnum } from '../types/demandStatus';
import { DemandTableRow } from '../components/DemandTableRow';
import { DemandEditOutletProvider } from '../contexts/DemandEditOutletContext';

export { DemandStatusEnum };

type Demand = DemandResponseDto;

interface StatCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    color: string;
    bg: string;
    count?: number | null;
    onClick: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, description, color, bg, count, onClick }) => (
    <Card
        elevation={0}
        sx={{
            flex: 1, minWidth: 200,
            border: '1px solid',
            borderColor: `${color}30`,
            borderRadius: 2,
            overflow: 'hidden',
        }}
    >
        <CardActionArea onClick={onClick} sx={{ height: '100%' }}>
            <Box sx={{ height: 3, bgcolor: color }} />
            <CardContent sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, p: 2.5 }}>
                <Box sx={{
                    width: 40, height: 40, borderRadius: 1.5, flexShrink: 0,
                    bgcolor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <Box sx={{ color, display: 'flex' }}>{icon}</Box>
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>
                            {title}
                        </Typography>
                        {count != null && (
                            <Box sx={{
                                px: 0.9, py: 0.1, borderRadius: 10,
                                bgcolor: color, minWidth: 22, textAlign: 'center',
                            }}>
                                <Typography sx={{ fontSize: 11, fontWeight: 800, color: '#fff', lineHeight: 1.6 }}>
                                    {count}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                    <Typography sx={{ fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>
                        {description}
                    </Typography>
                </Box>
                <ChevronRightIcon sx={{ color: '#94a3b8', fontSize: 20, flexShrink: 0, mt: 0.5 }} />
            </CardContent>
        </CardActionArea>
    </Card>
);

export const DemandsPage: React.FC = () => {
    const [demands, setDemands] = useState<Demand[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [manualDemandText, setManualDemandText] = useState('');
    const [manualUserId, setManualUserId] = useState('');
    const [isCreatingManual, setIsCreatingManual] = useState(false);
    const [uncategorizedCount, setUncategorizedCount] = useState<number | null>(null);
    const [rejectedCount, setRejectedCount]           = useState<number | null>(null);
    const { showSuccess, showError } = useSnackbar();
    const navigate = useNavigate();

    const formatDateTime = (iso: string) => new Date(iso).toLocaleString();

    const fetchDemands = async (options?: { quiet?: boolean }) => {
        const quiet = options?.quiet === true;
        try {
            if (!quiet) setIsLoading(true);
            setError(null);
            const data = await getDemands();
            setDemands(data);
        } catch {
            setError('Failed to fetch demands');
        } finally {
            if (!quiet) setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDemands();
        getUncategorizedDemands({ page: 1, limit: 1 })
            .then((r) => setUncategorizedCount(r.meta.total))
            .catch(() => null);
        listRejectedMessages({ page: 1, limit: 1 })
            .then((r) => setRejectedCount(r.meta.total))
            .catch(() => null);
    }, []);

    const closeManualDrawer = () => {
        setIsDrawerOpen(false);
        setManualDemandText('');
        setManualUserId('');
        setIsCreatingManual(false);
    };

    const handleManualDemandSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const text = manualDemandText.trim();
        if (!text) { showError('Please enter demand text'); return; }
        const userId = Number.parseInt(manualUserId.trim(), 10);
        if (!Number.isFinite(userId) || userId < 1) { showError('Please enter a valid user ID'); return; }
        try {
            setIsCreatingManual(true);
            await createManualDemand({ text, userId });
            await fetchDemands({ quiet: true });
            closeManualDrawer();
            showSuccess('Manual demand created successfully!');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to create demand';
            showError(message);
            setIsCreatingManual(false);
        }
    };

    return (
        <DemandEditOutletProvider demands={demands} onAfterMutation={() => fetchDemands({ quiet: true })}>
            <Box sx={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', px: { xs: 2, sm: 2.5, md: 3 }, py: 3 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Demands
                </Typography>

                {/* ── Quick-access cards ── */}
                <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
                    <StatCard
                        icon={<LabelOffIcon fontSize="small" />}
                        title="Without category"
                        description="Demands the AI couldn't categorize — need manual review"
                        color="#f59e0b"
                        bg="#fffbeb"
                        count={uncategorizedCount}
                        onClick={() => navigate('/demands/uncategorized')}
                    />
                    <StatCard
                        icon={<SearchOffIcon fontSize="small" />}
                        title="Low coverage"
                        description="Demands with fewer than 5 matching businesses nearby"
                        color="#ef4444"
                        bg="#fef2f2"
                        onClick={() => navigate('/demands/low-coverage')}
                    />
                    <StatCard
                        icon={<BlockIcon fontSize="small" />}
                        title="Rejected requests"
                        description="Messages that didn't pass validation, with AI analysis"
                        color="#8b5cf6"
                        bg="#f5f3ff"
                        count={rejectedCount}
                        onClick={() => navigate('/demands/rejected')}
                    />
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={() => setIsDrawerOpen(true)}
                    >
                        Create manual demand
                    </Button>
                </Box>

                {isLoading ? (
                    <Box display="flex" justifyContent="center" my={4}><CircularProgress /></Box>
                ) : error ? (
                    <Alert severity="error" sx={{ maxWidth: 800 }}>{error}</Alert>
                ) : (
                    <TableContainer component={Paper} sx={{ width: '100%' }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>ID</TableCell>
                                    <TableCell>User ID</TableCell>
                                    <TableCell>Transcription</TableCell>
                                    <TableCell>Translation</TableCell>
                                    <TableCell>Category</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Created</TableCell>
                                    <TableCell>Updated</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {demands.map((demand) => (
                                    <DemandTableRow
                                        key={demand.id}
                                        demand={demand}
                                        variant="admin"
                                        size="small"
                                        onListChanged={() => fetchDemands({ quiet: true })}
                                        formatDateTime={formatDateTime}
                                    />
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                <Drawer anchor="right" open={isDrawerOpen} onClose={closeManualDrawer}>
                    <Box sx={{ width: 400, maxWidth: '100vw', p: 3, boxSizing: 'border-box' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Typography variant="h6">Create manual demand</Typography>
                            <IconButton onClick={closeManualDrawer} aria-label="Close"><CloseIcon /></IconButton>
                        </Box>
                        <Box component="form" onSubmit={handleManualDemandSubmit}>
                            <TextField
                                fullWidth label="User ID" value={manualUserId}
                                onChange={(e) => setManualUserId(e.target.value)}
                                required type="number" inputProps={{ min: 1, step: 1 }}
                                placeholder="e.g. 1" sx={{ mb: 2 }}
                                helperText="The user this demand is created for"
                            />
                            <TextField
                                fullWidth label="Demand text" value={manualDemandText}
                                onChange={(e) => setManualDemandText(e.target.value)}
                                required placeholder="Enter the raw demand wording"
                                multiline rows={4} sx={{ mb: 2 }}
                                helperText="Stored as transcription; the server translates and summarizes"
                            />
                            <Button type="submit" variant="contained" color="primary" fullWidth disabled={isCreatingManual}>
                                {isCreatingManual ? <CircularProgress size={24} /> : 'Create manual demand'}
                            </Button>
                        </Box>
                    </Box>
                </Drawer>
            </Box>
        </DemandEditOutletProvider>
    );
};
