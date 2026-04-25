import React, { useState, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    TextField,
    Box,
    Typography,
    Alert,
    CircularProgress,
    Drawer,
    IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import { createManualDemand, getDemands, type DemandResponseDto } from '../service/search.api.service';
import { useSnackbar } from '../contexts/SnackbarContext';
import { DemandStatusEnum } from '../types/demandStatus';
import { DemandTableRow } from '../components/DemandTableRow';
import { DemandEditOutletProvider } from '../contexts/DemandEditOutletContext';

export { DemandStatusEnum };

type Demand = DemandResponseDto;

export const DemandsPage: React.FC = () => {
    const [demands, setDemands] = useState<Demand[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [manualDemandText, setManualDemandText] = useState('');
    const [manualUserId, setManualUserId] = useState('');
    const [isCreatingManual, setIsCreatingManual] = useState(false);
    const { showSuccess, showError } = useSnackbar();

    const formatDateTime = (iso: string) => new Date(iso).toLocaleString();

    const fetchDemands = async (options?: { quiet?: boolean }) => {
        const quiet = options?.quiet === true;
        try {
            if (!quiet) {
                setIsLoading(true);
            }
            setError(null);
            const data = await getDemands();
            setDemands(data);
        } catch (err) {
            setError('Failed to fetch demands');
        } finally {
            if (!quiet) {
                setIsLoading(false);
            }
        }
    };

    useEffect(() => {
        fetchDemands();
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
        if (!text) {
            showError('Please enter demand text');
            return;
        }
        const userId = Number.parseInt(manualUserId.trim(), 10);
        if (!Number.isFinite(userId) || userId < 1) {
            showError('Please enter a valid user ID');
            return;
        }

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
            <Box
                sx={{
                    width: '100%',
                    maxWidth: '100%',
                    boxSizing: 'border-box',
                    px: { xs: 2, sm: 2.5, md: 3 },
                    py: 3,
                }}
            >
                <Typography variant="h4" component="h1" gutterBottom>
                    Demands
                </Typography>

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
                    <Box display="flex" justifyContent="center" my={4}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Alert severity="error" sx={{ maxWidth: 800 }}>
                        {error}
                    </Alert>
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
                            <IconButton onClick={closeManualDrawer} aria-label="Close">
                                <CloseIcon />
                            </IconButton>
                        </Box>
                        <Box component="form" onSubmit={handleManualDemandSubmit}>
                            <TextField
                                fullWidth
                                label="User ID"
                                value={manualUserId}
                                onChange={(e) => setManualUserId(e.target.value)}
                                required
                                type="number"
                                inputProps={{ min: 1, step: 1 }}
                                placeholder="e.g. 1"
                                sx={{ mb: 2 }}
                                helperText="The user this demand is created for"
                            />
                            <TextField
                                fullWidth
                                label="Demand text"
                                value={manualDemandText}
                                onChange={(e) => setManualDemandText(e.target.value)}
                                required
                                placeholder="Enter the raw demand wording"
                                multiline
                                rows={4}
                                sx={{ mb: 2 }}
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
