import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Alert, Box, Button, Chip, CircularProgress, Paper,
    Table, TableBody, TableCell, TableHead, TableRow, Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import StorefrontIcon from '@mui/icons-material/Storefront';
import { getBusinessById, getBusinessOffers } from '../service/business.api.service';
import type { BusinessOfferDto } from '../service/business.api.service';

// ── design tokens ─────────────────────────────────────────────────────────────
const HEADER_H    = 60;
const ACCENT      = '#6366f1';
const BG_PAGE     = '#f1f5f9';
const CARD_SHADOW = '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)';

// ── helpers ───────────────────────────────────────────────────────────────────
function demandText(o: BusinessOfferDto): string {
    const d = o.demand;
    if (!d) return `Demand #${o.demandId}`;
    return d.summarizedTranslation || d.translation || d.transcription || `Demand #${d.id}`;
}

function fmtDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

const TIMING_LABEL: Record<string, string> = {
    TODAY:          '⚡ Today',
    THIS_WEEK:      '📅 This week',
    AFTER_THIS_WEEK:'🗓 Later',
};

// ── section table ─────────────────────────────────────────────────────────────
interface TableSectionProps {
    title: string;
    color: string;
    gradientFrom: string;
    gradientTo: string;
    icon: React.ReactNode;
    offers: BusinessOfferDto[];
    emptyText: string;
}

const TableSection: React.FC<TableSectionProps> = ({
    title, color, gradientFrom, gradientTo, icon, offers, emptyText,
}) => (
    <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: CARD_SHADOW }}>
        {/* colored accent bar */}
        <Box sx={{ height: 3, background: `linear-gradient(90deg, ${gradientFrom}, ${gradientTo})` }} />

        <Box sx={{ px: 2.5, pt: 2.5, pb: offers.length ? 0 : 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Box sx={{ color, display: 'flex' }}>{icon}</Box>
                <Typography sx={{
                    fontSize: 10, fontWeight: 800, letterSpacing: '0.12em',
                    textTransform: 'uppercase', color,
                }}>
                    {title}
                </Typography>
                <Box sx={{ px: 0.9, py: 0.1, borderRadius: 10, bgcolor: `${color}18`, border: `1px solid ${color}40` }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 700, color }}>{offers.length}</Typography>
                </Box>
            </Box>

            {offers.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ pb: 2 }}>
                    {emptyText}
                </Typography>
            )}
        </Box>

        {offers.length > 0 && (
            <Table size="small">
                <TableHead>
                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                        <TableCell sx={{ fontWeight: 700, fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', py: 1 }}>
                            Demand
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', py: 1, width: 120 }}>
                            Category
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', py: 1, width: 90 }}>
                            Price
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', py: 1, width: 110 }}>
                            Timing
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', py: 1, width: 110 }}>
                            Date
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {offers.map((o, idx) => (
                        <TableRow
                            key={o.id}
                            sx={{
                                bgcolor: idx % 2 === 0 ? '#fff' : '#fafafa',
                                borderLeft: `3px solid ${color}`,
                                '&:hover': { bgcolor: '#f0f4ff' },
                                '&:last-child td': { borderBottom: 'none' },
                            }}
                        >
                            <TableCell sx={{ py: 1.25 }}>
                                <Typography sx={{
                                    fontSize: 13, color: '#334155',
                                    overflow: 'hidden', display: '-webkit-box',
                                    WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                                    lineHeight: 1.4,
                                }}>
                                    {demandText(o)}
                                </Typography>
                                {o.comment && (
                                    <Typography sx={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic', mt: 0.25 }}>
                                        "{o.comment}"
                                    </Typography>
                                )}
                            </TableCell>
                            <TableCell sx={{ py: 1.25 }}>
                                {o.demand?.category ? (
                                    <Chip
                                        label={o.demand.category.name}
                                        size="small"
                                        sx={{ fontSize: 11, height: 20, bgcolor: '#f1f5f9', color: '#475569', fontWeight: 500 }}
                                    />
                                ) : (
                                    <Typography sx={{ fontSize: 12, color: '#cbd5e1' }}>—</Typography>
                                )}
                            </TableCell>
                            <TableCell sx={{ py: 1.25 }}>
                                <Typography sx={{ fontSize: 13, fontWeight: 600, color: o.price != null ? '#1e293b' : '#cbd5e1' }}>
                                    {o.price != null ? o.price : '—'}
                                </Typography>
                            </TableCell>
                            <TableCell sx={{ py: 1.25 }}>
                                <Typography sx={{ fontSize: 12, color: '#64748b' }}>
                                    {o.time ? (TIMING_LABEL[o.time] ?? o.time) : '—'}
                                </Typography>
                            </TableCell>
                            <TableCell sx={{ py: 1.25 }}>
                                <Typography sx={{ fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                                    {fmtDate(o.createdAt)}
                                </Typography>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        )}
    </Paper>
);

// ── page ──────────────────────────────────────────────────────────────────────
const BusinessDemandsDetailPage: React.FC = () => {
    const { userId, businessId } = useParams<{ userId?: string; businessId: string }>();
    const navigate = useNavigate();

    const [business, setBusiness]  = useState<{ name: string; userId?: number | null } | null>(null);
    const [offers, setOffers]      = useState<BusinessOfferDto[]>([]);
    const [loading, setLoading]    = useState(true);
    const [error, setError]        = useState<string | null>(null);

    useEffect(() => {
        if (!businessId) return;
        setLoading(true); setError(null);
        Promise.all([getBusinessById(businessId), getBusinessOffers(businessId)])
            .then(([biz, ofrs]) => { setBusiness(biz); setOffers(ofrs); })
            .catch(() => setError('Failed to load data'))
            .finally(() => setLoading(false));
    }, [businessId]);

    const accepted = offers.filter((o) => o.status === 'accepted');
    const rejected = offers.filter((o) => o.status === 'rejected');

    const effectiveUserId = userId ?? business?.userId?.toString() ?? null;
    const dashUrl = effectiveUserId
        ? `/business-users/${effectiveUserId}/businesses/${businessId}`
        : `/businesses/${businessId}`;

    if (loading) return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 10 }} />;
    if (error)   return (
        <Box sx={{ mt: 4, px: 3 }}>
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>Back</Button>
            <Alert severity="error">{error}</Alert>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: BG_PAGE }}>

            {/* ── header ── */}
            <Box sx={{
                position: 'sticky', top: 0, zIndex: 200,
                height: HEADER_H,
                display: 'flex', alignItems: 'center', gap: 2,
                px: { xs: 2, md: 3 },
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
            }}>
                <Button
                    size="small"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate(dashUrl)}
                    sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.08)' } }}
                >
                    Dashboard
                </Button>

                <StorefrontIcon sx={{ color: 'rgba(255,255,255,0.35)', fontSize: 18 }} />

                <Typography sx={{
                    flex: 1, fontWeight: 700, color: '#fff', fontSize: 16,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                    {business?.name ?? ''} — Demand history
                </Typography>

                <Button
                    size="small"
                    startIcon={<DashboardIcon />}
                    onClick={() => navigate(dashUrl)}
                    sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.08)' } }}
                >
                    Back to dashboard
                </Button>
            </Box>

            {/* ── tables ── */}
            <Box sx={{ maxWidth: 1100, mx: 'auto', width: '100%', px: { xs: 2, md: 3 }, pt: 4, pb: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>

                <TableSection
                    title="Accepted demands"
                    color="#22c55e"
                    gradientFrom="#22c55e"
                    gradientTo="#86efac"
                    icon={<CheckCircleOutlineIcon sx={{ fontSize: 16 }} />}
                    offers={accepted}
                    emptyText="No accepted offers yet."
                />

                <TableSection
                    title="Rejected demands"
                    color="#ef4444"
                    gradientFrom="#ef4444"
                    gradientTo="#fca5a5"
                    icon={<CancelOutlinedIcon sx={{ fontSize: 16 }} />}
                    offers={rejected}
                    emptyText="No rejected offers yet."
                />
            </Box>
        </Box>
    );
};

export default BusinessDemandsDetailPage;
