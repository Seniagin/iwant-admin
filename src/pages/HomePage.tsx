import React, { useCallback, useEffect, useState } from 'react';
import { Box, Typography, Paper, CircularProgress, Alert, Button } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { getAdminStatistics, type AdminStatisticsResponseDto } from '../service/search.api.service';

export const HomePage: React.FC = () => {
    const [stats, setStats] = useState<AdminStatisticsResponseDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getAdminStatistics();
            setStats(data);
        } catch {
            setError('Failed to load statistics');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    return (
        <Box
            sx={{
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box',
                px: { xs: 2, sm: 2.5, md: 3 },
                py: 3,
            }}
        >
            <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 1 }}>
                Statistics
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
                Aggregate counts from the admin API
            </Typography>

            {loading && !stats ? (
                <Box display="flex" justifyContent="center" py={6}>
                    <CircularProgress />
                </Box>
            ) : error && !stats ? (
                <Alert
                    severity="error"
                    action={
                        <Button color="inherit" size="small" onClick={() => load()} startIcon={<RefreshIcon />}>
                            Retry
                        </Button>
                    }
                    sx={{ width: '100%', maxWidth: 560, mx: 'auto' }}
                >
                    {error}
                </Alert>
            ) : stats ? (
                <>
                    {error && (
                        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setError(null)}>
                            {error} — showing last loaded values
                        </Alert>
                    )}
                    <Box
                        sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 3,
                            justifyContent: 'center',
                        }}
                    >
                        <Paper
                            elevation={2}
                            sx={{
                                p: 3,
                                flex: '1 1 240px',
                                maxWidth: 320,
                                minWidth: 200,
                                textAlign: 'center',
                            }}
                        >
                            <Typography variant="overline" color="text.secondary" display="block">
                                Client users
                            </Typography>
                            <Typography variant="h3" component="p" sx={{ fontWeight: 600, my: 1 }}>
                                {stats.totalUsers}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Users table
                            </Typography>
                        </Paper>
                        <Paper
                            elevation={2}
                            sx={{
                                p: 3,
                                flex: '1 1 240px',
                                maxWidth: 320,
                                minWidth: 200,
                                textAlign: 'center',
                            }}
                        >
                            <Typography variant="overline" color="text.secondary" display="block">
                                Business users
                            </Typography>
                            <Typography variant="h3" component="p" sx={{ fontWeight: 600, my: 1 }}>
                                {stats.totalBusinessUsers}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Business portal accounts
                            </Typography>
                        </Paper>
                        <Paper
                            elevation={2}
                            sx={{
                                p: 3,
                                flex: '1 1 240px',
                                maxWidth: 320,
                                minWidth: 200,
                                textAlign: 'center',
                            }}
                        >
                            <Typography variant="overline" color="text.secondary" display="block">
                                Demands
                            </Typography>
                            <Typography variant="h3" component="p" sx={{ fontWeight: 600, my: 1 }}>
                                {stats.totalDemands}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                All demands in the system
                            </Typography>
                        </Paper>
                        <Paper
                            elevation={2}
                            sx={{
                                p: 3,
                                flex: '1 1 240px',
                                maxWidth: 320,
                                minWidth: 200,
                                textAlign: 'center',
                            }}
                        >
                            <Typography variant="overline" color="text.secondary" display="block">
                                Demands with offers
                            </Typography>
                            <Typography variant="h3" component="p" sx={{ fontWeight: 600, my: 1 }}>
                                {stats.demandsWithOffersPercent}%
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {stats.demandsWithOffers} of {stats.totalDemands} demands received an offer
                            </Typography>
                        </Paper>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                        <Button
                            variant="outlined"
                            startIcon={loading ? <CircularProgress size={18} /> : <RefreshIcon />}
                            onClick={() => load()}
                            disabled={loading}
                        >
                            Refresh
                        </Button>
                    </Box>
                </>
            ) : null}
        </Box>
    );
};
