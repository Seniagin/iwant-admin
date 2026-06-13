import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Alert, Box, Button, Chip, CircularProgress,
    Dialog, DialogActions, DialogContent, DialogTitle,
    FormControl, InputLabel, MenuItem, Select, TextField, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { getBusinessDemands, createAdminOfferForDemand } from '../service/business.api.service';
import type { DemandResponseDto } from '../service/search.api.service';
import { OfferTimingEnum } from '../types/offerTiming';

// ── design tokens (mirror EditBusinessPage) ──────────────────────────────────
const ACCENT = '#6366f1';

const STATUS_META: Record<string, { color: string; label: string }> = {
    ACTIVE:         { color: '#10b981', label: 'Active' },
    PENDING_REVIEW: { color: '#f59e0b', label: 'Pending' },
    REJECTED:       { color: '#ef4444', label: 'Rejected' },
    COMPLETED:      { color: '#94a3b8', label: 'Completed' },
};

const TIMING_LABELS: Record<OfferTimingEnum, string> = {
    [OfferTimingEnum.TODAY]:          'Today',
    [OfferTimingEnum.THIS_WEEK]:      'This week',
    [OfferTimingEnum.AFTER_THIS_WEEK]:'Later',
};

// ── helpers ──────────────────────────────────────────────────────────────────
function demandText(d: DemandResponseDto) {
    return d.summarizedTranslation || d.translation || d.transcription || `Demand #${d.id}`;
}

function shortDate(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

interface Group { label: string; items: DemandResponseDto[] }

function groupByDate(items: DemandResponseDto[]): Group[] {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart  = new Date(todayStart); weekStart.setDate(todayStart.getDate() - 6);

    const groups: Group[] = [
        { label: 'Today',       items: [] },
        { label: 'Last 7 days', items: [] },
        { label: 'Earlier',     items: [] },
    ];
    for (const d of items) {
        const t = new Date(d.createdAt);
        if (t >= todayStart)   groups[0].items.push(d);
        else if (t >= weekStart) groups[1].items.push(d);
        else                   groups[2].items.push(d);
    }
    return groups.filter((g) => g.items.length > 0);
}

// ── offer dialog ─────────────────────────────────────────────────────────────
interface OfferState { time: OfferTimingEnum | ''; price: string; comment: string }
const EMPTY: OfferState = { time: '', price: '', comment: '' };

interface DialogProps {
    demand: DemandResponseDto | null;
    businessId: string;
    onClose(): void;
    onSuccess(msg: string): void;
    onError(msg: string): void;
}

const OfferDialog: React.FC<DialogProps> = ({ demand, businessId, onClose, onSuccess, onError }) => {
    const [form, setForm]       = useState<OfferState>(EMPTY);
    const [busy, setBusy]       = useState(false);
    const meta = demand ? (STATUS_META[demand.demandStatus] ?? STATUS_META['ACTIVE']) : null;

    useEffect(() => { setForm(EMPTY); }, [demand?.id]);

    const submit = async () => {
        if (!demand || !form.time) return;
        setBusy(true);
        try {
            await createAdminOfferForDemand(demand.id, {
                businessId,
                time:    form.time as OfferTimingEnum,
                price:   form.price ? Number(form.price) : undefined,
                comment: form.comment || undefined,
            });
            onSuccess(`Offer created for demand #${demand.id}`);
            onClose();
        } catch (e: any) {
            onError(e?.message ?? 'Failed');
        } finally {
            setBusy(false);
        }
    };

    return (
        <Dialog open={!!demand} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{
            sx: { borderRadius: 2.5, overflow: 'hidden' },
        }}>
            {/* colored accent bar */}
            <Box sx={{ height: 3, background: `linear-gradient(90deg, ${ACCENT}, #818cf8)` }} />

            <DialogTitle sx={{ pt: 2.5, pb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    Create offer
                    {meta && (
                        <Box sx={{
                            display: 'inline-flex', alignItems: 'center', gap: 0.5,
                            px: 1, py: 0.25, borderRadius: 10,
                            bgcolor: `${meta.color}18`, border: `1px solid ${meta.color}40`,
                        }}>
                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: meta.color }} />
                            <Typography sx={{ fontSize: 11, fontWeight: 700, color: meta.color }}>
                                {meta.label}
                            </Typography>
                        </Box>
                    )}
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 400 }}>
                    Demand #{demand?.id} · {demand?.category?.name ?? '—'}
                </Typography>
            </DialogTitle>

            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
                {demand && (
                    <Box sx={{
                        bgcolor: '#f8fafc', border: '1px solid #e2e8f0',
                        borderRadius: 1.5, px: 1.5, py: 1,
                        fontSize: 13, color: 'text.secondary', lineHeight: 1.6,
                        fontStyle: 'italic',
                    }}>
                        "{demandText(demand)}"
                    </Box>
                )}

                <FormControl fullWidth required size="small">
                    <InputLabel>Timing *</InputLabel>
                    <Select label="Timing *" value={form.time}
                        onChange={(e) => setForm((f) => ({ ...f, time: e.target.value as OfferTimingEnum }))}>
                        {Object.values(OfferTimingEnum).map((v) => (
                            <MenuItem key={v} value={v}>{TIMING_LABELS[v]}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <TextField label="Price (optional)" type="number" size="small"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    inputProps={{ min: 0 }} fullWidth />

                <TextField label="Comment (optional)" multiline rows={2} size="small"
                    value={form.comment}
                    onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
                    fullWidth />
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                <Button onClick={onClose} disabled={busy} sx={{ color: 'text.secondary' }}>Cancel</Button>
                <Button variant="contained" onClick={submit}
                    disabled={busy || !form.time}
                    startIcon={busy ? <CircularProgress size={13} color="inherit" /> : <AddIcon />}
                    sx={{ bgcolor: ACCENT, '&:hover': { bgcolor: '#4f46e5' }, boxShadow: 'none', px: 2.5 }}>
                    {busy ? 'Sending…' : 'Create offer'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// ── demand row ────────────────────────────────────────────────────────────────
const DemandRow: React.FC<{ demand: DemandResponseDto; onOffer(d: DemandResponseDto): void; last: boolean }> =
    ({ demand, onOffer, last }) => {
        const meta = STATUS_META[demand.demandStatus] ?? STATUS_META['ACTIVE'];
        return (
            <Box sx={{
                display: 'flex', alignItems: 'center', gap: 2,
                px: 1.5, py: 1.25,
                borderBottom: last ? 'none' : '1px solid #f1f5f9',
                borderLeft: `3px solid ${meta.color}`,
                transition: 'background 0.1s',
                '&:hover': { bgcolor: '#f8faff' },
                '&:hover .offer-btn': { opacity: 1 },
            }}>
                {/* Status dot */}
                <Box sx={{
                    width: 7, height: 7, borderRadius: '50%',
                    bgcolor: meta.color, flexShrink: 0, ml: 0.5,
                }} />

                {/* Text block */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25, flexWrap: 'wrap' }}>
                        <Typography sx={{ fontSize: 11, fontWeight: 700, fontFamily: 'monospace', color: '#94a3b8' }}>
                            #{demand.id}
                        </Typography>
                        {demand.category && (
                            <Typography sx={{
                                fontSize: 11, color: '#64748b',
                                bgcolor: '#f1f5f9', px: 0.75, py: 0.1, borderRadius: 0.75,
                            }}>
                                {demand.category.name}
                            </Typography>
                        )}
                    </Box>
                    <Typography variant="body2" sx={{
                        overflow: 'hidden', display: '-webkit-box',
                        WebkitLineClamp: 1, WebkitBoxOrient: 'vertical',
                        color: '#334155', fontSize: 13, lineHeight: 1.4,
                    }}>
                        {demandText(demand)}
                    </Typography>
                </Box>

                {/* Right: date + action */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
                    <Typography sx={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                        {shortDate(demand.createdAt)}
                    </Typography>
                    <Button
                        className="offer-btn"
                        size="small"
                        onClick={() => onOffer(demand)}
                        startIcon={<AddIcon sx={{ fontSize: '14px !important' }} />}
                        sx={{
                            opacity: 0,
                            transition: 'opacity 0.15s',
                            fontSize: 12, fontWeight: 700,
                            color: ACCENT, border: `1px solid ${ACCENT}40`,
                            bgcolor: `${ACCENT}08`,
                            '&:hover': { bgcolor: `${ACCENT}15`, border: `1px solid ${ACCENT}80` },
                            px: 1.25, py: 0.4, borderRadius: 1.25,
                            whiteSpace: 'nowrap',
                            minWidth: 90,
                        }}
                    >
                        Offer
                    </Button>
                </Box>
            </Box>
        );
    };

// ── section label for groups ─────────────────────────────────────────────────
const GroupLabel: React.FC<{ label: string; count: number }> = ({ label, count }) => (
    <Box sx={{
        display: 'flex', alignItems: 'center', gap: 1.5,
        px: 1.5, py: 0.75,
        bgcolor: '#f8fafc',
        borderBottom: '1px solid #f1f5f9',
    }}>
        <Typography sx={{
            fontSize: 10, fontWeight: 800, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: '#94a3b8',
        }}>
            {label}
        </Typography>
        <Box sx={{
            px: 0.75, py: 0.1, borderRadius: 10,
            bgcolor: '#e2e8f0',
        }}>
            <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#64748b' }}>
                {count}
            </Typography>
        </Box>
    </Box>
);

// ── main export ───────────────────────────────────────────────────────────────
interface Props {
    businessId: string;
    onSuccess?(msg: string): void;
    onError?(msg: string): void;
}

export const BusinessDemandsSection: React.FC<Props> = ({ businessId, onSuccess, onError }) => {
    const [demands, setDemands]         = useState<DemandResponseDto[]>([]);
    const [loading, setLoading]         = useState(true);
    const [loadError, setLoadError]     = useState<string | null>(null);
    const [dialogDemand, setDialogDemand] = useState<DemandResponseDto | null>(null);

    const load = useCallback(async () => {
        setLoading(true); setLoadError(null);
        try { setDemands(await getBusinessDemands(businessId)); }
        catch { setLoadError('Failed to load demands'); }
        finally { setLoading(false); }
    }, [businessId]);

    useEffect(() => { load(); }, [load]);

    const groups = useMemo(() => groupByDate(demands), [demands]);

    return (
        <>
            {/* Header row */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Typography sx={{
                    fontSize: 10, fontWeight: 800, letterSpacing: '0.12em',
                    textTransform: 'uppercase', color: ACCENT,
                }}>
                    Demands
                </Typography>
                {!loading && (
                    <Box sx={{ px: 0.9, py: 0.1, borderRadius: 10, bgcolor: `${ACCENT}15` }}>
                        <Typography sx={{ fontSize: 11, fontWeight: 700, color: ACCENT }}>
                            {demands.length}
                        </Typography>
                    </Box>
                )}
            </Box>

            {/* States */}
            {loading && <Box sx={{ py: 3, display: 'flex', justifyContent: 'center' }}><CircularProgress size={24} /></Box>}

            {loadError && (
                <Alert severity="error" action={<Button size="small" onClick={load}>Retry</Button>}>
                    {loadError}
                </Alert>
            )}

            {!loading && !loadError && demands.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    No demands in this business's categories yet.
                </Typography>
            )}

            {/* Grouped list */}
            {!loading && !loadError && groups.map((group) => (
                <Box key={group.label} sx={{ mb: 1.5 }}>
                    <Box sx={{
                        border: '1px solid #e2e8f0', borderRadius: 1.5, overflow: 'hidden',
                    }}>
                        <GroupLabel label={group.label} count={group.items.length} />
                        {group.items.map((d, i) => (
                            <DemandRow
                                key={d.id}
                                demand={d}
                                onOffer={setDialogDemand}
                                last={i === group.items.length - 1}
                            />
                        ))}
                    </Box>
                </Box>
            ))}

            <OfferDialog
                demand={dialogDemand}
                businessId={businessId}
                onClose={() => setDialogDemand(null)}
                onSuccess={(msg) => onSuccess?.(msg)}
                onError={(msg) => onError?.(msg)}
            />
        </>
    );
};
