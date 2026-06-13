import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Alert, Box, Button, CircularProgress, Paper, Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import TableChartIcon from '@mui/icons-material/TableChart';
import StorefrontIcon from '@mui/icons-material/Storefront';
import { getBusinessById, getBusinessDemands, getBusinessOffers } from '../service/business.api.service';
import type { BusinessOfferDto, IBusiness } from '../service/business.api.service';

// ── design tokens ─────────────────────────────────────────────────────────────
const HEADER_H    = 60;
const ACCENT      = '#6366f1';
const BG_PAGE     = '#f1f5f9';
const CARD_SHADOW = '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)';

// ── stat palette ──────────────────────────────────────────────────────────────
const STAT_COLORS = {
    received: { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8', dot: '#3b82f6' },
    pending:  { bg: '#fefce8', border: '#fde68a', text: '#92400e', dot: '#f59e0b' },
    accepted: { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d', dot: '#22c55e' },
    rejected: { bg: '#fef2f2', border: '#fecaca', text: '#b91c1c', dot: '#ef4444' },
};

// ── donut chart ───────────────────────────────────────────────────────────────
interface DonutSlice { value: number; color: string; label: string }

const DonutChart: React.FC<{ slices: DonutSlice[]; total: number }> = ({ slices, total }) => {
    const R = 70;
    const STROKE = 18;
    const SIZE = (R + STROKE) * 2;
    const CX = R + STROKE;
    const CY = R + STROKE;
    const CIRC = 2 * Math.PI * R;

    const nonZero = slices.filter((s) => s.value > 0);
    const isEmpty = nonZero.length === 0;

    let cumulative = 0;
    const paths = nonZero.map((s) => {
        const pct  = s.value / total;
        const dash = pct * CIRC;
        const gap  = CIRC - dash;
        // strokeDashoffset: CIRC*0.25 starts at 12-o'clock; subtract accumulated
        const offset = CIRC * 0.25 - cumulative;
        cumulative += dash;
        return (
            <circle
                key={s.label}
                cx={CX} cy={CY} r={R}
                fill="none"
                stroke={s.color}
                strokeWidth={STROKE}
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={offset}
                style={{ transition: 'stroke-dasharray 0.5s' }}
            />
        );
    });

    return (
        <Box sx={{ position: 'relative', width: SIZE, height: SIZE, mx: 'auto' }}>
            <svg width={SIZE} height={SIZE} style={{ transform: 'rotate(-90deg)' }}>
                {isEmpty
                    ? <circle cx={CX} cy={CY} r={R} fill="none" stroke="#e2e8f0" strokeWidth={STROKE} />
                    : paths}
            </svg>
            <Box sx={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
            }}>
                <Typography sx={{ fontSize: 32, fontWeight: 800, lineHeight: 1, color: '#1e293b' }}>
                    {total}
                </Typography>
                <Typography sx={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {total === 1 ? 'demand' : 'demands'}
                </Typography>
            </Box>
        </Box>
    );
};

// ── stat card ─────────────────────────────────────────────────────────────────
interface StatCardProps { label: string; value: number; palette: typeof STAT_COLORS.received; subtitle?: string }

const StatCard: React.FC<StatCardProps> = ({ label, value, palette, subtitle }) => (
    <Paper elevation={0} sx={{
        flex: 1, minWidth: 120,
        p: 2, borderRadius: 2,
        bgcolor: palette.bg,
        border: `1px solid ${palette.border}`,
        boxShadow: 'none',
        display: 'flex', flexDirection: 'column', gap: 0.5,
    }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: palette.dot, flexShrink: 0 }} />
            <Typography sx={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: palette.text }}>
                {label}
            </Typography>
        </Box>
        <Typography sx={{ fontSize: 36, fontWeight: 800, lineHeight: 1, color: palette.text }}>
            {value}
        </Typography>
        {subtitle && (
            <Typography sx={{ fontSize: 11, color: palette.text, opacity: 0.65, mt: 0.25 }}>
                {subtitle}
            </Typography>
        )}
    </Paper>
);

// ── legend row ────────────────────────────────────────────────────────────────
const LegendRow: React.FC<{ color: string; label: string; value: number; total: number }> = ({ color, label, value, total }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
        <Typography sx={{ flex: 1, fontSize: 13, color: '#475569' }}>{label}</Typography>
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#1e293b', minWidth: 24, textAlign: 'right' }}>{value}</Typography>
        <Typography sx={{ fontSize: 12, color: '#94a3b8', minWidth: 36, textAlign: 'right' }}>
            {total > 0 ? `${Math.round((value / total) * 100)}%` : '—'}
        </Typography>
    </Box>
);

// ── page ──────────────────────────────────────────────────────────────────────
const BusinessDashboardPage: React.FC = () => {
    // userId is optional — when coming from /businesses/:businessId it's absent
    const { userId, businessId } = useParams<{ userId?: string; businessId: string }>();
    const navigate = useNavigate();

    const [business, setBusiness]     = useState<IBusiness | null>(null);
    const [offers, setOffers]         = useState<BusinessOfferDto[]>([]);
    const [demandsCount, setDemandsCount] = useState(0);
    const [loading, setLoading]       = useState(true);
    const [error, setError]           = useState<string | null>(null);

    useEffect(() => {
        if (!businessId) return;
        setLoading(true); setError(null);
        Promise.all([
            getBusinessById(businessId),
            getBusinessOffers(businessId),
            getBusinessDemands(businessId),
        ])
            .then(([biz, ofrs, demands]) => {
                setBusiness(biz);
                setOffers(ofrs);
                setDemandsCount(demands.length);
            })
            .catch(() => setError('Failed to load dashboard data'))
            .finally(() => setLoading(false));
    }, [businessId]);

    // Derive effective userId from URL param or from loaded business
    const effectiveUserId = userId ?? business?.userId?.toString() ?? null;

    const editUrl    = effectiveUserId
        ? `/business-users/${effectiveUserId}/businesses/${businessId}/edit`
        : null;
    const demandsUrl = effectiveUserId
        ? `/business-users/${effectiveUserId}/businesses/${businessId}/demands`
        : `/businesses/${businessId}/demands`;

    const stats = useMemo(() => ({
        pending:  offers.filter((o) => o.status === 'pending').length,
        accepted: offers.filter((o) => o.status === 'accepted').length,
        rejected: offers.filter((o) => o.status === 'rejected').length,
    }), [offers]);

    const donutTotal  = Math.max(demandsCount, offers.length);
    const noOffer     = Math.max(0, demandsCount - offers.length);
    const donutSlices: DonutSlice[] = [
        { value: stats.accepted, color: '#22c55e', label: 'Accepted' },
        { value: stats.pending,  color: '#f59e0b', label: 'Pending'  },
        { value: stats.rejected, color: '#ef4444', label: 'Rejected' },
        { value: noOffer,        color: '#cbd5e1', label: 'No offer' },
    ];

    if (loading) return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 10 }} />;
    if (error || !business) return (
        <Box sx={{ mt: 4, px: 3 }}>
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/businesses')} sx={{ mb: 2 }}>Businesses</Button>
            <Alert severity="error">{error ?? 'Business not found'}</Alert>
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
                    onClick={() => navigate('/businesses')}
                    sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.08)' } }}
                >
                    Businesses
                </Button>

                <StorefrontIcon sx={{ color: 'rgba(255,255,255,0.35)', fontSize: 18 }} />

                <Typography sx={{
                    flex: 1, fontWeight: 700, color: '#fff', fontSize: 16,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                    {business.name}
                </Typography>

                <Button
                    size="small"
                    startIcon={<TableChartIcon />}
                    onClick={() => navigate(demandsUrl)}
                    sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.08)' } }}
                >
                    Demand tables
                </Button>

                {editUrl && (
                    <Button
                        variant="contained"
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => navigate(editUrl)}
                        sx={{
                            bgcolor: ACCENT, '&:hover': { bgcolor: '#4f46e5' },
                            boxShadow: 'none', px: 2.5, fontWeight: 700,
                        }}
                    >
                        Edit
                    </Button>
                )}
            </Box>

            {/* ── body ── */}
            <Box sx={{ maxWidth: 860, mx: 'auto', width: '100%', px: { xs: 2, md: 3 }, pt: 4, pb: 8 }}>

                {/* stat cards */}
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
                    <StatCard label="Received" value={demandsCount} palette={STAT_COLORS.received} subtitle="Demands in categories" />
                    <StatCard label="Pending"  value={stats.pending}  palette={STAT_COLORS.pending}  subtitle="Awaiting client reply" />
                    <StatCard label="Accepted" value={stats.accepted} palette={STAT_COLORS.accepted} subtitle="Client accepted" />
                    <StatCard label="Rejected" value={stats.rejected} palette={STAT_COLORS.rejected} subtitle="Client declined" />
                </Box>

                {/* chart card */}
                <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: CARD_SHADOW }}>
                    <Box sx={{ height: 3, background: `linear-gradient(90deg, ${ACCENT}, #818cf8)` }} />

                    <Box sx={{ p: { xs: 3, md: 4 } }}>
                        <Typography sx={{
                            fontSize: 10, fontWeight: 800, letterSpacing: '0.12em',
                            textTransform: 'uppercase', color: ACCENT, mb: 3,
                        }}>
                            Offer breakdown
                        </Typography>

                        <Box sx={{
                            display: 'flex', flexDirection: { xs: 'column', sm: 'row' },
                            alignItems: 'center', gap: { xs: 3, sm: 5 },
                        }}>
                            <Box sx={{ flexShrink: 0 }}>
                                <DonutChart slices={donutSlices} total={donutTotal} />
                            </Box>

                            <Box sx={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                <LegendRow color="#22c55e" label="Accepted"      value={stats.accepted} total={donutTotal} />
                                <LegendRow color="#f59e0b" label="Pending"       value={stats.pending}  total={donutTotal} />
                                <LegendRow color="#ef4444" label="Rejected"      value={stats.rejected} total={donutTotal} />
                                <LegendRow color="#cbd5e1" label="No offer sent" value={noOffer}        total={donutTotal} />

                                <Box sx={{ mt: 1, pt: 1.5, borderTop: '1px solid #f1f5f9' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Box sx={{ width: 10, flexShrink: 0 }} />
                                        <Typography sx={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
                                            Offers sent
                                        </Typography>
                                        <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#1e293b', minWidth: 24, textAlign: 'right' }}>
                                            {offers.length}
                                        </Typography>
                                        <Typography sx={{ fontSize: 12, color: '#94a3b8', minWidth: 36, textAlign: 'right' }}>
                                            {demandsCount > 0 ? `${Math.round((offers.length / demandsCount) * 100)}%` : '—'}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                </Paper>

                {/* quick action */}
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                        variant="outlined"
                        startIcon={<TableChartIcon />}
                        onClick={() => navigate(demandsUrl)}
                        sx={{ borderColor: ACCENT, color: ACCENT, '&:hover': { bgcolor: `${ACCENT}08`, borderColor: ACCENT } }}
                    >
                        View accepted &amp; rejected tables
                    </Button>
                </Box>
            </Box>
        </Box>
    );
};

export default BusinessDashboardPage;
