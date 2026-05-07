import React, { useEffect, useState, useCallback } from 'react';
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
    ToggleButton,
    ToggleButtonGroup,
    Pagination,
} from '@mui/material';
import {
    listRejectedMessages,
    type RejectedMessage,
    type RejectionReason,
} from '../service/rejected-messages.api.service';

const REASON_LABELS: Record<RejectionReason, string> = {
    offering: 'Offering',
    inappropriate: 'Inappropriate',
    unsupported: 'Unsupported',
    spam: 'Spam',
};

const REASON_COLORS: Record<RejectionReason, 'warning' | 'error' | 'default' | 'info'> = {
    offering: 'warning',
    inappropriate: 'error',
    unsupported: 'info',
    spam: 'default',
};

const PAGE_SIZE = 50;

const formatDate = (dateString: string) =>
    new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(dateString));

export const RejectedMessagesPage: React.FC = () => {
    const [items, setItems] = useState<RejectedMessage[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [reasonFilter, setReasonFilter] = useState<RejectionReason | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async (p: number, reason?: RejectionReason) => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await listRejectedMessages({ page: p, limit: PAGE_SIZE, reason });
            setItems(data.items);
            setTotal(data.meta.total);
        } catch {
            setError('Failed to fetch rejected messages');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        load(page, reasonFilter);
    }, [load, page, reasonFilter]);

    const handleReasonChange = (_: React.MouseEvent<HTMLElement>, value: RejectionReason | null) => {
        setReasonFilter(value ?? undefined);
        setPage(1);
    };

    const totalPages = Math.ceil(total / PAGE_SIZE);

    return (
        <Box sx={{ width: '100%', px: { xs: 2, sm: 2.5, md: 3 }, py: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 1 }}>
                <Typography variant="h4" component="h2">Rejected Messages</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
                Messages that didn't pass validation — {total} total
            </Typography>

            {/* Reason filter */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <ToggleButtonGroup
                    value={reasonFilter ?? null}
                    exclusive
                    onChange={handleReasonChange}
                    size="small"
                >
                    {(Object.keys(REASON_LABELS) as RejectionReason[]).map((r) => (
                        <ToggleButton key={r} value={r}>
                            {REASON_LABELS[r]}
                        </ToggleButton>
                    ))}
                </ToggleButtonGroup>
            </Box>

            {isLoading ? (
                <Box display="flex" justifyContent="center" my={4}><CircularProgress /></Box>
            ) : error ? (
                <Alert severity="error" sx={{ maxWidth: 800, mx: 'auto' }}>{error}</Alert>
            ) : items.length === 0 ? (
                <Typography variant="body1" color="text.secondary" align="center" sx={{ my: 4 }}>
                    No rejected messages{reasonFilter ? ` with reason "${REASON_LABELS[reasonFilter]}"` : ''}
                </Typography>
            ) : (
                <>
                    <TableContainer component={Paper} sx={{ width: '100%' }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>ID</TableCell>
                                    <TableCell>Message</TableCell>
                                    <TableCell>Reason</TableCell>
                                    <TableCell>Telegram user</TableCell>
                                    <TableCell>Date</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {items.map((item) => (
                                    <TableRow key={item.id} hover>
                                        <TableCell sx={{ fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                                            {item.id}
                                        </TableCell>
                                        <TableCell sx={{ maxWidth: 480, wordBreak: 'break-word' }}>
                                            {item.text}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={REASON_LABELS[item.reason]}
                                                color={REASON_COLORS[item.reason]}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell sx={{ fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                                            {item.telegramUserId ?? '—'}
                                        </TableCell>
                                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                            {formatDate(item.createdAt)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {totalPages > 1 && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                            <Pagination
                                count={totalPages}
                                page={page}
                                onChange={(_, p) => setPage(p)}
                                color="primary"
                            />
                        </Box>
                    )}
                </>
            )}
        </Box>
    );
};
