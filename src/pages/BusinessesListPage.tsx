import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    CircularProgress,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    LinearProgress,
} from '@mui/material';
import { getBusinesses, type IBusiness } from '../service/business.api.service';

function scoreColor(score: number): 'success' | 'warning' | 'error' {
    if (score >= 70) return 'success';
    if (score >= 40) return 'warning';
    return 'error';
}

export const BusinessesListPage: React.FC = () => {
    const [businesses, setBusinesses] = useState<IBusiness[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        getBusinesses()
            .then(setBusinesses)
            .catch(() => setError('Failed to load businesses'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 8 }} />;
    if (error) return <Alert severity="error" sx={{ m: 3 }}>{error}</Alert>;

    return (
        <Box sx={{ px: { xs: 2, sm: 3 }, pt: 2, pb: 4 }}>
            <Typography variant="h5" sx={{ mb: 3 }}>Businesses</Typography>

            <TableContainer component={Paper}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Categories</TableCell>
                            <TableCell sx={{ width: 160 }}>Coverage</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {businesses.map((b) => (
                            <TableRow
                                key={b.id}
                                hover
                                sx={{ cursor: b.userId ? 'pointer' : 'default' }}
                                onClick={() => b.userId && navigate(`/business-users/${b.userId}/businesses/${b.id}/edit`)}
                            >
                                <TableCell>
                                    <Typography variant="body2" fontWeight={500}>{b.name}</Typography>
                                </TableCell>

                                <TableCell>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {(b.categories ?? []).length === 0 ? (
                                            <Typography variant="caption" color="text.secondary">—</Typography>
                                        ) : (
                                            (b.categories ?? []).map((c) => (
                                                <Chip key={c.id} label={c.name} size="small" variant="outlined" />
                                            ))
                                        )}
                                    </Box>
                                </TableCell>

                                <TableCell>
                                    {b.coverageScore == null ? (
                                        <Typography variant="caption" color="text.secondary">Not analyzed</Typography>
                                    ) : (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Box sx={{ flex: 1 }}>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={b.coverageScore}
                                                    color={scoreColor(b.coverageScore)}
                                                    sx={{ height: 6, borderRadius: 3 }}
                                                />
                                            </Box>
                                            <Chip
                                                label={`${b.coverageScore}%`}
                                                size="small"
                                                color={scoreColor(b.coverageScore)}
                                                sx={{ minWidth: 52 }}
                                            />
                                        </Box>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};
