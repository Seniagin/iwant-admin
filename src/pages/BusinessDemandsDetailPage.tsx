import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent,
    DialogTitle, FormControl, InputLabel, MenuItem, Paper, Select, TextField,
    Table, TableBody, TableCell, TableHead, TableRow, Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import AddIcon from '@mui/icons-material/Add';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import StorefrontIcon from '@mui/icons-material/Storefront';
import { getBusinessById, getBusinessOffers, getBusinessDemands, createAdminOfferForDemand } from '../service/business.api.service';
import type { BusinessOfferDto } from '../service/business.api.service';
import type { DemandResponseDto } from '../service/search.api.service';
import { OfferTimingEnum } from '../types/offerTiming';

// ── design tokens ─────────────────────────────────────────────────────────────
const HEADER_H    = 60;
const ACCENT      = '#6366f1';
const BG_PAGE     = '#f1f5f9';
const CARD_SHADOW = '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)';

// ── helpers ───────────────────────────────────────────────────────────────────
function demandText(o: BusinessOfferDto): string {
    const d = o.demand;
    if (!d) return `Demand #${o.demandId}`;
    return d.transcription || d.translation || `Demand #${d.id}`;
}

function fmtDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

const TIMING_LABEL: Record<string, string> = {
    TODAY:       '⚡ Today',
    THIS_WEEK:   '📅 This week',
    DISCUSSIBLE: '💬 Discussible',
};

const TIMING_LABELS: Record<OfferTimingEnum, string> = {
    [OfferTimingEnum.TODAY]:       'Today',
    [OfferTimingEnum.THIS_WEEK]:   'This week',
    [OfferTimingEnum.DISCUSSIBLE]: 'Discussible',
};

// ── offer dialog ─────────────────────────────────────────────────────────────
interface OfferState { time: OfferTimingEnum | ''; price: string; comment: string; scheduledDate: string; scheduledTime: string; }
const EMPTY_OFFER: OfferState = { time: '', price: '', comment: '', scheduledDate: '', scheduledTime: '' };

const OfferDialog: React.FC<{
    demand: DemandResponseDto | null;
    businessId: string;
    onClose(): void;
    onDone(): void;
}> = ({ demand, businessId, onClose, onDone }) => {
    const [form, setForm] = useState<OfferState>(EMPTY_OFFER);
    const [busy, setBusy] = useState(false);
    const [err,  setErr]  = useState<string | null>(null);
    useEffect(() => { setForm(EMPTY_OFFER); setErr(null); }, [demand?.id]);

    const submit = async () => {
        if (!demand || !form.time) return;
        setBusy(true); setErr(null);
        try {
            await createAdminOfferForDemand(demand.id, {
                businessId,
                time:          form.time as OfferTimingEnum,
                price:         form.price ? Number(form.price) : undefined,
                comment:       form.comment || undefined,
                scheduledSlots: (form.scheduledDate || form.scheduledTime)
                    ? [{ date: form.scheduledDate || undefined, time: form.scheduledTime || undefined }]
                    : null,
            });
            onDone();
        } catch (e: any) {
            setErr(e?.message ?? 'Failed to create offer');
        } finally {
            setBusy(false);
        }
    };

    const text = demand
        ? demand.transcription || demand.translation || `Demand #${demand.id}`
        : '';

    return (
        <Dialog open={!!demand} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 2.5, overflow: 'hidden' } }}>
            <Box sx={{ height: 3, background: 'linear-gradient(90deg, #6366f1, #818cf8)' }} />
            <DialogTitle sx={{ pt: 2.5, pb: 1 }}>
                Create offer
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 400 }}>
                    Demand #{demand?.id} · {demand?.category?.name ?? '—'}
                </Typography>
            </DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
                <Box sx={{ bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 1.5, px: 1.5, py: 1, fontSize: 13, color: 'text.secondary', fontStyle: 'italic' }}>
                    "{text}"
                </Box>
                {err && <Typography color="error" variant="caption">{err}</Typography>}
                <FormControl fullWidth required size="small">
                    <InputLabel>Timing *</InputLabel>
                    <Select label="Timing *" value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value as OfferTimingEnum }))}>
                        {Object.values(OfferTimingEnum).map((v) => (
                            <MenuItem key={v} value={v}>{TIMING_LABELS[v]}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField label="Date (optional)" type="date" size="small" value={form.scheduledDate}
                        onChange={(e) => setForm((f) => ({ ...f, scheduledDate: e.target.value }))}
                        InputLabelProps={{ shrink: true }} sx={{ flex: 1 }} />
                    <TextField label="Time (optional)" type="time" size="small" value={form.scheduledTime}
                        onChange={(e) => setForm((f) => ({ ...f, scheduledTime: e.target.value }))}
                        InputLabelProps={{ shrink: true }} sx={{ flex: 1 }} />
                </Box>
                <TextField label="Price (optional)" type="number" size="small" value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} inputProps={{ min: 0 }} fullWidth />
                <TextField label="Comment (optional)" multiline rows={2} size="small" value={form.comment}
                    onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))} fullWidth />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                <Button onClick={onClose} disabled={busy} sx={{ color: 'text.secondary' }}>Cancel</Button>
                <Button variant="contained" onClick={submit} disabled={busy || !form.time}
                    startIcon={busy ? <CircularProgress size={13} color="inherit" /> : <AddIcon />}
                    sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }, boxShadow: 'none', px: 2.5 }}>
                    {busy ? 'Sending…' : 'Create offer'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// ── pending demands table ─────────────────────────────────────────────────────
const PendingDemandsSection: React.FC<{
    demands: DemandResponseDto[];
    businessId: string;
    onOfferCreated(): void;
}> = ({ demands, businessId, onOfferCreated }) => {
    const [dialogDemand, setDialogDemand] = useState<DemandResponseDto | null>(null);

    return (
        <>
            <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: CARD_SHADOW }}>
                <Box sx={{ height: 3, background: 'linear-gradient(90deg, #f59e0b, #fcd34d)' }} />
                <Box sx={{ px: 2.5, pt: 2.5, pb: demands.length ? 0 : 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Box sx={{ color: '#d97706', display: 'flex' }}><HourglassEmptyIcon sx={{ fontSize: 16 }} /></Box>
                        <Typography sx={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#d97706' }}>
                            Available — no offer sent
                        </Typography>
                        <Box sx={{ px: 0.9, py: 0.1, borderRadius: 10, bgcolor: '#fef3c718', border: '1px solid #fde68a' }}>
                            <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#d97706' }}>{demands.length}</Typography>
                        </Box>
                    </Box>
                    {demands.length === 0 && (
                        <Typography variant="body2" color="text.secondary" sx={{ pb: 2 }}>
                            All available demands have already received an offer.
                        </Typography>
                    )}
                </Box>
                {demands.length > 0 && (
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#fffbeb' }}>
                                <TableCell sx={{ fontWeight: 700, fontSize: 11, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.06em', py: 1 }}>Demand</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: 11, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.06em', py: 1, width: 130 }}>Category</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: 11, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.06em', py: 1, width: 130 }}>Client timing</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: 11, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.06em', py: 1, width: 100 }}>Date</TableCell>
                                <TableCell sx={{ width: 110 }} />
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {demands.map((d, idx) => {
                                const timing = d.timingPreference && d.timingPreference.urgency !== 'flexible' ? d.timingPreference : null;
                                return (
                                    <TableRow key={d.id} sx={{
                                        bgcolor: idx % 2 === 0 ? '#fff' : '#fafafa',
                                        borderLeft: '3px solid #f59e0b',
                                        '&:hover': { bgcolor: '#fffbeb' },
                                        '&:last-child td': { borderBottom: 'none' },
                                    }}>
                                        <TableCell sx={{ py: 1.25 }}>
                                            <Typography sx={{ fontSize: 13, color: '#334155', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.4 }}>
                                                {d.transcription || d.translation || `Demand #${d.id}`}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ py: 1.25 }}>
                                            {d.category ? (
                                                <Chip label={d.category.name} size="small" sx={{ fontSize: 11, height: 20, bgcolor: '#f1f5f9', color: '#475569', fontWeight: 500 }} />
                                            ) : (
                                                <Typography sx={{ fontSize: 12, color: '#cbd5e1' }}>—</Typography>
                                            )}
                                        </TableCell>
                                        <TableCell sx={{ py: 1.25 }}>
                                            {timing ? (
                                                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, bgcolor: '#eff6ff', px: 1, py: 0.25, borderRadius: 1 }}>
                                                    <AccessTimeIcon sx={{ fontSize: 12, color: '#3b82f6' }} />
                                                    <Typography sx={{ fontSize: 12, color: '#1d4ed8', fontWeight: 600 }}>{timing.raw}</Typography>
                                                </Box>
                                            ) : (
                                                <Typography sx={{ fontSize: 12, color: '#cbd5e1' }}>—</Typography>
                                            )}
                                        </TableCell>
                                        <TableCell sx={{ py: 1.25 }}>
                                            <Typography sx={{ fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>{fmtDate(d.createdAt)}</Typography>
                                        </TableCell>
                                        <TableCell sx={{ py: 1.25, textAlign: 'right', pr: 2 }}>
                                            <Button size="small" onClick={() => setDialogDemand(d)}
                                                startIcon={<AddIcon sx={{ fontSize: '13px !important' }} />}
                                                sx={{ fontSize: 11, fontWeight: 700, color: '#6366f1', border: '1px solid #c7d2fe', bgcolor: '#eef2ff', '&:hover': { bgcolor: '#e0e7ff' }, px: 1.25, py: 0.4, borderRadius: 1.25, whiteSpace: 'nowrap' }}>
                                                Offer
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}
            </Paper>

            <OfferDialog
                demand={dialogDemand}
                businessId={businessId}
                onClose={() => setDialogDemand(null)}
                onDone={() => { setDialogDemand(null); onOfferCreated(); }}
            />
        </>
    );
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
    const [demands, setDemands]    = useState<DemandResponseDto[]>([]);
    const [loading, setLoading]    = useState(true);
    const [error, setError]        = useState<string | null>(null);

    const load = () => {
        if (!businessId) return;
        setLoading(true); setError(null);
        Promise.all([getBusinessById(businessId), getBusinessOffers(businessId), getBusinessDemands(businessId)])
            .then(([biz, ofrs, dmds]) => { setBusiness(biz); setOffers(ofrs); setDemands(dmds); })
            .catch(() => setError('Failed to load data'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, [businessId]);

    const offeredDemandIds = useMemo(() => new Set(offers.map((o) => o.demandId)), [offers]);
    const pendingDemands = useMemo(() => demands.filter((d) => !offeredDemandIds.has(d.id)), [demands, offeredDemandIds]);
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

                <PendingDemandsSection
                    demands={pendingDemands}
                    businessId={businessId!}
                    onOfferCreated={load}
                />

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
