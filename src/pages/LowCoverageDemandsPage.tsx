import React, { useState, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Box,
    Typography,
    Alert,
    CircularProgress,
    Chip,
    TextField,
} from '@mui/material';
import { getLowCoverageDemands, type DemandResponseDto } from '../service/search.api.service';
import { DemandTableRow } from '../components/DemandTableRow';
import { DemandEditOutletProvider } from '../contexts/DemandEditOutletContext';

const formatDateTime = (iso: string) => new Date(iso).toLocaleString();

export const LowCoverageDemandsPage: React.FC = () => {
    const [demands, setDemands] = useState<DemandResponseDto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [threshold, setThreshold] = useState(5);

    const fetchDemands = async (options?: { quiet?: boolean }) => {
        const quiet = options?.quiet === true;
        try {
            if (!quiet) setIsLoading(true);
            setError(null);
            const data = await getLowCoverageDemands({ threshold });
            setDemands(data.items);
        } catch {
            setError('Failed to fetch low-coverage demands');
        } finally {
            if (!quiet) setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDemands();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [threshold]);

    return (
        <DemandEditOutletProvider demands={demands} onAfterMutation={() => fetchDemands({ quiet: true })}>
            <Box sx={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', px: { xs: 2, sm: 2.5, md: 3 }, py: 3 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Low Coverage Demands
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Demands where fewer than <strong>{threshold}</strong> businesses in the area match. These may need
                    attention to improve coverage.
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <TextField
                        label="Threshold"
                        type="number"
                        size="small"
                        value={threshold}
                        onChange={(e) => {
                            const v = parseInt(e.target.value, 10);
                            if (Number.isFinite(v) && v >= 0) setThreshold(v);
                        }}
                        inputProps={{ min: 0, step: 1 }}
                        sx={{ width: 130 }}
                        helperText="Max businesses"
                    />
                    {!isLoading && (
                        <Chip
                            label={`${demands.length} demand${demands.length !== 1 ? 's' : ''}`}
                            color={demands.length === 0 ? 'success' : 'warning'}
                            size="small"
                        />
                    )}
                </Box>

                {isLoading ? (
                    <Box display="flex" justifyContent="center" my={4}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Alert severity="error" sx={{ maxWidth: 800 }}>{error}</Alert>
                ) : demands.length === 0 ? (
                    <Alert severity="success" sx={{ maxWidth: 800 }}>
                        No demands with fewer than {threshold} matching businesses.
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
                                    <TableCell align="center">Businesses</TableCell>
                                    <TableCell>Created</TableCell>
                                    <TableCell>Updated</TableCell>
                                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>Actions</TableCell>
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
                                        extraCell={(d) => (
                                            <Chip
                                                label={d.availableBusinessCount ?? '—'}
                                                size="small"
                                                color={d.availableBusinessCount === 0 ? 'error' : 'warning'}
                                                title="Matching businesses in area"
                                            />
                                        )}
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
