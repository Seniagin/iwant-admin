import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Box, CircularProgress, Typography } from '@mui/material';
import StorefrontIcon from '@mui/icons-material/Storefront';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { getBusinesses, type IBusiness } from '../service/business.api.service';

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
const TH: React.FC<{ children: React.ReactNode; width?: number | string; align?: 'left' | 'right' }> =
    ({ children, width, align = 'left' }) => (
        <Box component="th" sx={{
            width,
            textAlign: align,
            px: 2, py: 1.25,
            fontSize: 10, fontWeight: 800,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: '#94a3b8',
            borderBottom: '1px solid #e2e8f0',
            bgcolor: '#f8fafc',
            whiteSpace: 'nowrap',
        }}>
            {children}
        </Box>
    );

// ── table row ────────────────────────────────────────────────────────────────
const BusinessRow: React.FC<{ business: IBusiness; onClick(): void; even: boolean }> =
    ({ business, onClick, even }) => {
        const color = avatarColor(business.name ?? '?');
        const meta  = coverageMeta(business.coverageScore);
        const cats  = business.categories ?? [];
        const score = business.coverageScore;
        const visible = cats.slice(0, 3);
        const extra   = cats.length - visible.length;
        const clickable = !!business.userId;

        return (
            <Box
                component="tr"
                onClick={clickable ? onClick : undefined}
                sx={{
                    bgcolor: even ? '#fff' : '#fafbfc',
                    cursor: clickable ? 'pointer' : 'default',
                    transition: 'background 0.12s',
                    '&:hover': clickable ? { bgcolor: '#f0f4ff' } : {},
                    '&:hover .row-arrow': { opacity: 1 },
                    '&:hover td': { borderColor: 'transparent' },
                }}
            >
                {/* ── Name ── */}
                <Box component="td" sx={{ px: 2, py: 1.5, borderBottom: '1px solid #f1f5f9' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{
                            width: 32, height: 32, borderRadius: 1.25, flexShrink: 0,
                            bgcolor: color,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Typography sx={{ fontSize: 13, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                                {(business.name ?? '?')[0].toUpperCase()}
                            </Typography>
                        </Box>
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

                {/* ── Arrow ── */}
                <Box component="td" sx={{ px: 1.5, py: 1.5, borderBottom: '1px solid #f1f5f9', width: 32 }}>
                    {clickable && (
                        <ChevronRightIcon
                            className="row-arrow"
                            sx={{ fontSize: 18, color: '#94a3b8', opacity: 0, transition: 'opacity 0.15s', display: 'block' }}
                        />
                    )}
                </Box>
            </Box>
        );
    };

// ── page ──────────────────────────────────────────────────────────────────────
export const BusinessesListPage: React.FC = () => {
    const [businesses, setBusinesses] = useState<IBusiness[]>([]);
    const [loading, setLoading]       = useState(true);
    const [error, setError]           = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        getBusinesses()
            .then(setBusinesses)
            .catch(() => setError('Failed to load businesses'))
            .finally(() => setLoading(false));
    }, []);

    const stats = useMemo(() => ({
        total:        businesses.length,
        analyzed:     businesses.filter((b) => b.coverageScore != null).length,
        highCoverage: businesses.filter((b) => (b.coverageScore ?? 0) >= 70).length,
        noCats:       businesses.filter((b) => !b.categories?.length).length,
    }), [businesses]);

    if (loading) return (
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
                                <TH>Name</TH>
                                <TH>Categories</TH>
                                <TH width={200}>Coverage</TH>
                                <TH width={32}> </TH>
                            </Box>
                        </Box>
                        <Box component="tbody">
                            {businesses.map((b, i) => (
                                <BusinessRow
                                    key={b.id}
                                    business={b}
                                    even={i % 2 === 0}
                                    onClick={() => navigate(b.userId ? `/business-users/${b.userId}/businesses/${b.id}` : `/businesses/${b.id}`)}
                                />
                            ))}
                        </Box>
                    </Box>
                )}
            </Box>
        </Box>
    );
};
