import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BusinessesMap } from '../components/BusinessesMap';
import { Alert, Box, CircularProgress, MenuItem, Select, Typography, IconButton } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import StorefrontIcon from '@mui/icons-material/Storefront';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useSnackbar } from '../contexts/SnackbarContext';
import {
    deleteBusiness,
    getBusinessesPaginated,
    type IBusiness,
    type BusinessSortField,
    type SortDir,
} from '../service/business.api.service';

// ── design tokens ─────────────────────────────────────────────────────────────
const BG_PAGE    = '#f1f5f9';
const ACCENT     = '#6366f1';

const AVATAR_PALETTE = [
    '#6366f1', '#10b981', '#f59e0b', '#ef4444',
    '#8b5cf6', '#14b8a6', '#f97316', '#3b82f6',
];

function avatarColor(name: string): string {
    let h = 0;
    for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
    return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}

function coverageMeta(score: number | null | undefined) {
    if (score == null) return { color: '#94a3b8', bg: '#f1f5f9', label: null, gradient: 'none' };
    if (score >= 70)   return { color: '#10b981', bg: '#f0fdf4', label: `${score}%`, gradient: 'linear-gradient(90deg,#10b981,#34d399)' };
    if (score >= 40)   return { color: '#f59e0b', bg: '#fffbeb', label: `${score}%`, gradient: 'linear-gradient(90deg,#f59e0b,#fbbf24)' };
    return              { color: '#ef4444', bg: '#fef2f2', label: `${score}%`, gradient: 'linear-gradient(90deg,#ef4444,#f87171)' };
}

// ── stat chip ─────────────────────────────────────────────────────────────────
const StatChip: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
    <Box sx={{
        display: 'flex', alignItems: 'center', gap: 0.75,
        px: 1.25, py: 0.5, borderRadius: 10,
        bgcolor: '#fff', border: '1px solid #e2e8f0',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
    }}>
        <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: color }} />
        <Typography sx={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{label}</Typography>
        <Typography sx={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{value}</Typography>
    </Box>
);

// ── table header cell ────────────────────────────────────────────────────────
interface SortState { field: BusinessSortField; dir: SortDir }

const TH: React.FC<{
    children: React.ReactNode;
    width?: number | string;
    align?: 'left' | 'right';
    sortField?: BusinessSortField;
    sort?: SortState;
    onSort?(field: BusinessSortField): void;
}> = ({ children, width, align = 'left', sortField, sort, onSort }) => {
    const sortable = !!sortField && !!onSort;
    const active = sortable && sort?.field === sortField;
    const Arrow = sort?.dir === 'DESC' ? ArrowDownwardIcon : ArrowUpwardIcon;
    return (
        <Box
            component="th"
            onClick={sortable ? () => onSort!(sortField!) : undefined}
            sx={{
                width,
                textAlign: align,
                px: 2, py: 1.25,
                fontSize: 10, fontWeight: 800,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: active ? ACCENT : '#94a3b8',
                borderBottom: '1px solid #e2e8f0',
                bgcolor: '#f8fafc',
                whiteSpace: 'nowrap',
                cursor: sortable ? 'pointer' : 'default',
                userSelect: 'none',
                '&:hover': sortable ? { color: active ? ACCENT : '#475569' } : {},
            }}
        >
            <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                {children}
                {active && <Arrow sx={{ fontSize: 12 }} />}
            </Box>
        </Box>
    );
};

function formatCreatedAt(iso?: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
        ' ' + d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

// ── table row ────────────────────────────────────────────────────────────────
const BusinessRow: React.FC<{
    business: IBusiness;
    onClick(): void;
    onDelete(): void;
    deleting: boolean;
    even: boolean;
}> =
    ({ business, onClick, onDelete, deleting, even }) => {
        const color = avatarColor(business.name ?? '?');
        const meta  = coverageMeta(business.coverageScore);
        const cats  = business.categories ?? [];
        const score = business.coverageScore;
        const visible = cats.slice(0, 3);
        const extra   = cats.length - visible.length;

        return (
            <Box
                component="tr"
                onClick={onClick}
                sx={{
                    bgcolor: even ? '#fff' : '#fafbfc',
                    cursor: 'pointer',
                    transition: 'background 0.12s',
                    '&:hover': { bgcolor: '#f0f4ff' },
                    '&:hover .row-arrow': { opacity: 1 },
                    '&:hover td': { borderColor: 'transparent' },
                }}
            >
                {/* ── Name ── */}
                <Box component="td" sx={{ px: 2, py: 1.5, borderBottom: '1px solid #f1f5f9' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        {business.logoUrl ? (
                            <Box
                                component="img"
                                src={business.logoUrl}
                                alt=""
                                loading="lazy"
                                sx={{ width: 32, height: 32, borderRadius: 1.25, flexShrink: 0, objectFit: 'cover', bgcolor: '#f1f5f9' }}
                            />
                        ) : (
                            <Box sx={{
                                width: 32, height: 32, borderRadius: 1.25, flexShrink: 0,
                                bgcolor: color,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Typography sx={{ fontSize: 13, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                                    {(business.name ?? '?')[0].toUpperCase()}
                                </Typography>
                            </Box>
                        )}
                        <Box sx={{ minWidth: 0 }}>
                            <Typography sx={{
                                fontSize: 13, fontWeight: 700, color: '#0f172a',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                maxWidth: 260,
                            }}>
                                {business.name}
                            </Typography>
                            {business.description && (
                                <Typography sx={{
                                    fontSize: 11, color: '#94a3b8', mt: 0.1,
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                    maxWidth: 260,
                                }}>
                                    {business.description}
                                </Typography>
                            )}
                        </Box>
                    </Box>
                </Box>

                {/* ── Categories ── */}
                <Box component="td" sx={{ px: 2, py: 1.5, borderBottom: '1px solid #f1f5f9' }}>
                    {cats.length === 0 ? (
                        <Typography sx={{ fontSize: 12, color: '#cbd5e1', fontStyle: 'italic' }}>—</Typography>
                    ) : (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {visible.map((c) => (
                                <Box key={c.id} sx={{
                                    px: 0.9, py: 0.25, borderRadius: 1,
                                    bgcolor: '#f1f5f9', border: '1px solid #e2e8f0',
                                }}>
                                    <Typography sx={{ fontSize: 11, color: '#475569', fontWeight: 500, lineHeight: 1.2 }}>
                                        {c.name}
                                    </Typography>
                                </Box>
                            ))}
                            {extra > 0 && (
                                <Box sx={{
                                    px: 0.9, py: 0.25, borderRadius: 1,
                                    bgcolor: '#ede9fe', border: '1px solid #c4b5fd',
                                }}>
                                    <Typography sx={{ fontSize: 11, color: ACCENT, fontWeight: 700, lineHeight: 1.2 }}>
                                        +{extra}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    )}
                </Box>

                {/* ── Coverage ── */}
                <Box component="td" sx={{ px: 2, py: 1.5, borderBottom: '1px solid #f1f5f9', width: 200 }}>
                    {score == null ? (
                        <Typography sx={{ fontSize: 11, color: '#cbd5e1', fontStyle: 'italic' }}>
                            Not analyzed
                        </Typography>
                    ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                            <Box sx={{ flex: 1, height: 5, borderRadius: 10, bgcolor: '#f1f5f9', overflow: 'hidden' }}>
                                <Box sx={{
                                    height: '100%', width: `${score}%`,
                                    background: meta.gradient, borderRadius: 10,
                                }} />
                            </Box>
                            <Box sx={{
                                px: 0.75, py: 0.15, borderRadius: 10,
                                bgcolor: meta.bg, border: `1px solid ${meta.color}40`,
                                minWidth: 40, textAlign: 'center',
                            }}>
                                <Typography sx={{ fontSize: 11, fontWeight: 800, color: meta.color, lineHeight: 1 }}>
                                    {meta.label}
                                </Typography>
                            </Box>
                        </Box>
                    )}
                </Box>

                {/* ── Created ── */}
                <Box component="td" sx={{ px: 2, py: 1.5, borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }}>
                    <Typography sx={{ fontSize: 12, color: '#64748b' }}>
                        {formatCreatedAt(business.createdAt)}
                    </Typography>
                </Box>

                {/* ── Delete ── */}
                <Box component="td" sx={{ px: 0.5, py: 1.5, borderBottom: '1px solid #f1f5f9', width: 40 }}>
                    <IconButton
                        size="small"
                        title="Delete business"
                        disabled={deleting}
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        sx={{ color: '#cbd5e1', '&:hover': { color: '#ef4444', bgcolor: '#fef2f2' } }}
                    >
                        {deleting
                            ? <CircularProgress size={16} sx={{ color: '#ef4444' }} />
                            : <DeleteOutlineIcon sx={{ fontSize: 18 }} />}
                    </IconButton>
                </Box>

                {/* ── Arrow ── */}
                <Box component="td" sx={{ px: 1.5, py: 1.5, borderBottom: '1px solid #f1f5f9', width: 32 }}>
                    <ChevronRightIcon
                        className="row-arrow"
                        sx={{ fontSize: 18, color: '#94a3b8', opacity: 0, transition: 'opacity 0.15s', display: 'block' }}
                    />
                </Box>
            </Box>
        );
    };

const PAGE_SIZES = [25, 50, 100];

// ── page ──────────────────────────────────────────────────────────────────────
export const BusinessesListPage: React.FC = () => {
    const [businesses, setBusinesses] = useState<IBusiness[]>([]);
    const [total, setTotal]           = useState(0);
    const [loading, setLoading]       = useState(true);
    const [error, setError]           = useState<string | null>(null);
    const [page, setPage]             = useState(1);
    const [pageSize, setPageSize]     = useState(25);
    const [sort, setSort]             = useState<SortState>({ field: 'createdAt', dir: 'DESC' });
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [reloadKey, setReloadKey]   = useState(0);
    const navigate = useNavigate();
    const { showSuccess, showError } = useSnackbar();

    useEffect(() => {
        setLoading(true);
        getBusinessesPaginated(page, pageSize, sort.field, sort.dir)
            .then((res) => {
                // Deleting the last row of the last page leaves it empty — step back.
                if (res.data.length === 0 && page > 1) { setPage((p) => p - 1); return; }
                setBusinesses(res.data);
                setTotal(res.total);
            })
            .catch(() => setError('Failed to load businesses'))
            .finally(() => setLoading(false));
    }, [page, pageSize, sort, reloadKey]);

    // Shared by table rows and map markers.
    const openBusiness = useCallback(
        (b: { id: string; userId?: number | null }) =>
            navigate(b.userId ? `/business-users/${b.userId}/businesses/${b.id}` : `/businesses/${b.id}`),
        [navigate],
    );

    const handleDelete = async (business: IBusiness) => {
        if (!window.confirm(`Delete "${business.name}"? This also removes its offers and cannot be undone.`)) return;
        setDeletingId(business.id);
        try {
            await deleteBusiness(business.id);
            showSuccess(`"${business.name}" deleted`);
            setReloadKey((k) => k + 1);
        } catch {
            showError(`Failed to delete "${business.name}"`);
        } finally {
            setDeletingId(null);
        }
    };

    // Same column clicked again flips direction; a new column starts on its
    // natural direction (newest / highest first for dates and coverage, A→Z for name).
    const handleSort = (field: BusinessSortField) => {
        setSort((prev) =>
            prev.field === field
                ? { field, dir: prev.dir === 'ASC' ? 'DESC' : 'ASC' }
                : { field, dir: field === 'name' ? 'ASC' : 'DESC' },
        );
        setPage(1);
    };

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const stats = useMemo(() => ({
        total,
        analyzed:     businesses.filter((b) => b.coverageScore != null).length,
        highCoverage: businesses.filter((b) => (b.coverageScore ?? 0) >= 70).length,
        noCats:       businesses.filter((b) => !b.categories?.length).length,
    }), [businesses, total]);

    if (loading && businesses.length === 0) return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
            <CircularProgress sx={{ color: ACCENT }} />
        </Box>
    );

    if (error) return <Alert severity="error" sx={{ m: 3 }}>{error}</Alert>;

    return (
        <Box sx={{ bgcolor: BG_PAGE, minHeight: '100vh', px: { xs: 2, md: 3 }, pt: 3, pb: 8 }}>

            {/* ── Header ── */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <Box sx={{
                    width: 40, height: 40, borderRadius: 2, flexShrink: 0,
                    background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(99,102,241,0.35)',
                }}>
                    <StorefrontIcon sx={{ color: '#fff', fontSize: 20 }} />
                </Box>
                <Box>
                    <Typography sx={{ fontWeight: 800, fontSize: 20, color: '#0f172a', lineHeight: 1 }}>
                        Businesses
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: '#94a3b8', mt: 0.3 }}>
                        {stats.total} total
                    </Typography>
                </Box>
                <Box sx={{ ml: 'auto', display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <StatChip label="Analyzed"      value={stats.analyzed}     color="#10b981" />
                    <StatChip label="High coverage"  value={stats.highCoverage} color={ACCENT} />
                    <StatChip label="No categories"  value={stats.noCats}       color="#f59e0b" />
                </Box>
            </Box>

            {/* ── Map ── */}
            <Box sx={{
                bgcolor: '#fff',
                borderRadius: 2.5,
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.05)',
                border: '1px solid #e2e8f0',
                mb: 3,
            }}>
                <BusinessesMap onOpen={openBusiness} reloadKey={reloadKey} />
            </Box>

            {/* ── Table ── */}
            <Box sx={{
                bgcolor: '#fff',
                borderRadius: 2.5,
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.05)',
                border: '1px solid #e2e8f0',
            }}>
                {/* colored top accent */}
                <Box sx={{ height: 3, background: 'linear-gradient(90deg, #6366f1, #818cf8)' }} />

                {businesses.length === 0 ? (
                    <Box sx={{ py: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
                        <StorefrontIcon sx={{ fontSize: 40, color: '#e2e8f0' }} />
                        <Typography sx={{ color: '#94a3b8', fontSize: 14 }}>No businesses yet</Typography>
                    </Box>
                ) : (
                    <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
                        <Box component="thead">
                            <Box component="tr">
                                <TH sortField="name" sort={sort} onSort={handleSort}>Name</TH>
                                <TH>Categories</TH>
                                <TH width={200} sortField="coverageScore" sort={sort} onSort={handleSort}>Coverage</TH>
                                <TH width={140} sortField="createdAt" sort={sort} onSort={handleSort}>Created</TH>
                                <TH width={40}> </TH>
                                <TH width={32}> </TH>
                            </Box>
                        </Box>
                        <Box component="tbody">
                            {businesses.map((b, i) => (
                                <BusinessRow
                                    key={b.id}
                                    business={b}
                                    even={i % 2 === 0}
                                    deleting={deletingId === b.id}
                                    onDelete={() => handleDelete(b)}
                                    onClick={() => openBusiness(b)}
                                />
                            ))}
                        </Box>
                    </Box>
                )}

                {/* ── Pagination footer ── */}
                {total > 0 && (
                    <Box sx={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        px: 2, py: 1.25, borderTop: '1px solid #f1f5f9', bgcolor: '#f8fafc',
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography sx={{ fontSize: 12, color: '#94a3b8' }}>Rows per page:</Typography>
                            <Select
                                size="small"
                                value={pageSize}
                                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                                sx={{ fontSize: 12, height: 28, '.MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' } }}
                            >
                                {PAGE_SIZES.map((s) => (
                                    <MenuItem key={s} value={s} sx={{ fontSize: 12 }}>{s}</MenuItem>
                                ))}
                            </Select>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography sx={{ fontSize: 12, color: '#64748b', mr: 1 }}>
                                {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
                            </Typography>
                            <IconButton
                                size="small"
                                disabled={page <= 1 || loading}
                                onClick={() => setPage((p) => p - 1)}
                                sx={{ color: '#475569', '&:disabled': { color: '#cbd5e1' } }}
                            >
                                <ChevronLeftIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                            <IconButton
                                size="small"
                                disabled={page >= totalPages || loading}
                                onClick={() => setPage((p) => p + 1)}
                                sx={{ color: '#475569', '&:disabled': { color: '#cbd5e1' } }}
                            >
                                <ChevronRightIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                        </Box>
                    </Box>
                )}
            </Box>
        </Box>
    );
};
