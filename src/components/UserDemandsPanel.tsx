import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Drawer,
    IconButton,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import {
    createManualDemandForUser,
    getUserDemandsPaginated,
    type DemandResponseDto,
    type PaginationMetaDto,
} from '../service/search.api.service';
import { useSnackbar } from '../contexts/SnackbarContext';
import { DemandEditOutletProvider } from '../contexts/DemandEditOutletContext';
import { DemandTableRow } from './DemandTableRow';

export interface UserDemandsPanelProps {
    userId: number;
    /** Shown in the create-demand drawer (e.g. display name). */
    userDisplayLabel: string;
    /** Reload user profile when demands change (e.g. `demandsCount`). */
    onUserProfileRefresh: () => void | Promise<void>;
}

function formatDemandDate(iso: string) {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(iso));
}

export const UserDemandsPanel: React.FC<UserDemandsPanelProps> = ({
    userId,
    userDisplayLabel,
    onUserProfileRefresh,
}) => {
    const { showSuccess, showError } = useSnackbar();
    const [demands, setDemands] = useState<DemandResponseDto[]>([]);
    const [demandsMeta, setDemandsMeta] = useState<PaginationMetaDto | null>(null);
    const [demandsPage, setDemandsPage] = useState(0);
    const [demandsRowsPerPage, setDemandsRowsPerPage] = useState(10);
    const [demandsLoading, setDemandsLoading] = useState(false);
    const [demandsError, setDemandsError] = useState<string | null>(null);
    const [demandDrawerOpen, setDemandDrawerOpen] = useState(false);
    const [manualDemandText, setManualDemandText] = useState('');
    const [creatingDemand, setCreatingDemand] = useState(false);

    const loadDemands = useCallback(async (id: number, page: number, limit: number) => {
        try {
            setDemandsLoading(true);
            setDemandsError(null);
            const data = await getUserDemandsPaginated(id, {
                page: page + 1,
                limit,
            });
            setDemands(data.items ?? []);
            setDemandsMeta(data.meta);
        } catch {
            setDemandsError('Failed to load demands');
            setDemands([]);
            setDemandsMeta(null);
        } finally {
            setDemandsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadDemands(userId, demandsPage, demandsRowsPerPage);
    }, [userId, demandsPage, demandsRowsPerPage, loadDemands]);

    const refreshDemandsAndUser = useCallback(async () => {
        await Promise.all([loadDemands(userId, demandsPage, demandsRowsPerPage), onUserProfileRefresh()]);
    }, [userId, demandsPage, demandsRowsPerPage, loadDemands, onUserProfileRefresh]);

    const closeDemandDrawer = () => {
        setDemandDrawerOpen(false);
        setManualDemandText('');
        setCreatingDemand(false);
    };

    const handleCreateDemand = async (e: React.FormEvent) => {
        e.preventDefault();
        const text = manualDemandText.trim();
        if (!text) {
            showError('Please enter demand text');
            return;
        }
        try {
            setCreatingDemand(true);
            await createManualDemandForUser(userId, { text });
            await refreshDemandsAndUser();
            closeDemandDrawer();
            showSuccess('Demand created');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to create demand';
            showError(message);
            setCreatingDemand(false);
        }
    };

    return (
        <DemandEditOutletProvider demands={demands} onAfterMutation={refreshDemandsAndUser}>
            <Paper variant="outlined" sx={{ p: 2, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <Box
                    sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1,
                        mb: 2,
                    }}
                >
                    <Typography variant="subtitle1" fontWeight={600}>
                        Demands
                    </Typography>
                    <Button
                        size="small"
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setDemandDrawerOpen(true)}
                    >
                        Create demand
                    </Button>
                </Box>
                {demandsError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {demandsError}
                    </Alert>
                )}
                {demandsLoading ? (
                    <Box display="flex" justifyContent="center" py={4}>
                        <CircularProgress size={32} />
                    </Box>
                ) : (
                    <>
                        <TableContainer sx={{ maxHeight: 480, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell width={72}>ID</TableCell>
                                        <TableCell>Text</TableCell>
                                        <TableCell width={120}>Category</TableCell>
                                        <TableCell width={130}>Status</TableCell>
                                        <TableCell width={160}>Created</TableCell>
                                        <TableCell align="right" width={132}>
                                            Actions
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {demands.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6}>
                                                <Typography color="text.secondary" align="center" py={2}>
                                                    No demands on this page
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        demands.map((d) => (
                                            <DemandTableRow
                                                key={d.id}
                                                demand={d}
                                                variant="userProfile"
                                                size="small"
                                                onListChanged={refreshDemandsAndUser}
                                                formatDateTime={formatDemandDate}
                                            />
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        {demandsMeta && (
                            <TablePagination
                                component="div"
                                count={demandsMeta.total}
                                page={demandsPage}
                                onPageChange={(_, p) => setDemandsPage(p)}
                                rowsPerPage={demandsRowsPerPage}
                                onRowsPerPageChange={(e) => {
                                    setDemandsRowsPerPage(Number.parseInt(e.target.value, 10));
                                    setDemandsPage(0);
                                }}
                                rowsPerPageOptions={[5, 10, 25, 50]}
                            />
                        )}
                    </>
                )}
            </Paper>

            <Drawer anchor="right" open={demandDrawerOpen} onClose={closeDemandDrawer}>
                <Box sx={{ width: 400, maxWidth: '100vw', p: 3, boxSizing: 'border-box' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">Create demand</Typography>
                        <IconButton onClick={closeDemandDrawer} aria-label="Close">
                            <CloseIcon />
                        </IconButton>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        This demand is created for <strong>{userDisplayLabel}</strong> (user ID {userId}).
                    </Typography>
                    <Box component="form" onSubmit={handleCreateDemand}>
                        <TextField
                            fullWidth
                            label="Demand text"
                            value={manualDemandText}
                            onChange={(e) => setManualDemandText(e.target.value)}
                            required
                            multiline
                            minRows={4}
                            placeholder="Raw demand wording"
                            helperText="Stored as transcription; the server translates and summarizes."
                            sx={{ mb: 2 }}
                        />
                        <Button type="submit" variant="contained" fullWidth disabled={creatingDemand}>
                            {creatingDemand ? <CircularProgress size={24} /> : 'Create demand'}
                        </Button>
                    </Box>
                </Box>
            </Drawer>
        </DemandEditOutletProvider>
    );
};
