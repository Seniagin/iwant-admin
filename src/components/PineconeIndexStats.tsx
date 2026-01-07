import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import {
    Box,
    Typography,
    Alert,
    CircularProgress,
    Card,
    CardContent,
    Button
} from '@mui/material';
import StorageIcon from '@mui/icons-material/Storage';
import SyncIcon from '@mui/icons-material/Sync';
import { getIndexStats, syncCategories } from '../service/categories.api.service';
import { useSnackbar } from '../contexts/SnackbarContext';

export interface PineconeIndexStatsRef {
    refresh: () => void;
}

export const PineconeIndexStats = forwardRef<PineconeIndexStatsRef>((props, ref) => {
    const [indexStats, setIndexStats] = useState<any>(null);
    const [isLoadingStats, setIsLoadingStats] = useState(false);
    const [statsError, setStatsError] = useState<string | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const { showSuccess, showError } = useSnackbar();

    const fetchIndexStats = async () => {
        try {
            setIsLoadingStats(true);
            setStatsError(null);
            const stats = await getIndexStats();
            setIndexStats(stats);
        } catch (err) {
            setStatsError('Failed to fetch index stats');
        } finally {
            setIsLoadingStats(false);
        }
    };

    const handleSync = async () => {
        try {
            setIsSyncing(true);
            await syncCategories();
            showSuccess('Categories synced successfully!');
            // Refresh stats after sync
            await fetchIndexStats();
        } catch (err) {
            showError('Failed to sync categories');
        } finally {
            setIsSyncing(false);
        }
    };

    useImperativeHandle(ref, () => ({
        refresh: fetchIndexStats
    }));

    useEffect(() => {
        fetchIndexStats();
    }, []);

    return (
        <Box sx={{ mb: 4, maxWidth: 1200, mx: 'auto' }}>
            <Card>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <StorageIcon sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography variant="h6" component="h3">
                                Pinecone Index Stats
                            </Typography>
                        </Box>
                        <Button
                            variant="outlined"
                            color="primary"
                            startIcon={isSyncing ? <CircularProgress size={16} /> : <SyncIcon />}
                            onClick={handleSync}
                            disabled={isSyncing}
                        >
                            {isSyncing ? 'Syncing...' : 'Sync'}
                        </Button>
                    </Box>
                    {isLoadingStats ? (
                        <Box display="flex" justifyContent="center" py={2}>
                            <CircularProgress size={24} />
                        </Box>
                    ) : statsError ? (
                        <Alert severity="error">{statsError}</Alert>
                    ) : indexStats ? (
                        <Box
                            sx={{
                                p: 2,
                                border: '1px solid #e0e0e0',
                                borderRadius: 1,
                                backgroundColor: '#f8f9fa',
                                display: 'inline-block'
                            }}
                        >
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ textTransform: 'uppercase', fontWeight: 600 }}
                            >
                                Count
                            </Typography>
                            <Typography
                                variant="body1"
                                sx={{
                                    mt: 0.5,
                                    fontFamily: 'monospace',
                                    fontWeight: 600
                                }}
                            >
                                {indexStats.totalRecordCount !== undefined ? indexStats.totalRecordCount : 'N/A'}
                            </Typography>
                        </Box>
                    ) : (
                        <Typography variant="body2" color="text.secondary">
                            No stats available
                        </Typography>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
});

