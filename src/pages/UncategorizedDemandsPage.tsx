import React, { useState, useEffect } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Box, Typography, Alert, CircularProgress,
} from '@mui/material';
import { getUncategorizedDemands, type DemandResponseDto } from '../service/search.api.service';
import { DemandTableRow } from '../components/DemandTableRow';
import { DemandEditOutletProvider } from '../contexts/DemandEditOutletContext';

const formatDateTime = (iso: string) => new Date(iso).toLocaleString();

export const UncategorizedDemandsPage: React.FC = () => {
    const [demands, setDemands] = useState<DemandResponseDto[]>([]);
    const [total, setTotal]     = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError]     = useState<string | null>(null);

    const fetchDemands = async (options?: { quiet?: boolean }) => {
        const quiet = options?.quiet === true;
        try {
            if (!quiet) setIsLoading(true);
            setError(null);
            const data = await getUncategorizedDemands({ limit: 200 });
            setDemands(data.items);
            setTotal(data.meta.total);
        } catch {
            setError('Failed to fetch uncategorized demands');
        } finally {
            if (!quiet) setIsLoading(false);
        }
    };

    useEffect(() => { fetchDemands(); }, []);

    return (
        <DemandEditOutletProvider demands={demands} onAfterMutation={() => fetchDemands({ quiet: true })}>
            <Box sx={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', px: { xs: 2, sm: 2.5, md: 3 }, py: 3 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Uncategorized Demands
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Demands where the AI couldn't confidently assign a category. Review and categorize manually.
                    {!isLoading && total > 0 && <> — <strong>{total}</strong> total</>}
                </Typography>

                {isLoading ? (
                    <Box display="flex" justifyContent="center" my={4}><CircularProgress /></Box>
                ) : error ? (
                    <Alert severity="error" sx={{ maxWidth: 800 }}>{error}</Alert>
                ) : demands.length === 0 ? (
                    <Alert severity="success" sx={{ maxWidth: 800 }}>All demands have a category assigned.</Alert>
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
            </Box>
        </DemandEditOutletProvider>
    );
};
