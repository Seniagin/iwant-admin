import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert, Box, Button, CircularProgress, Paper, Table,
    TableBody, TableCell, TableHead, TableRow, Typography,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { getAdminStatistics, type AdminStatisticsResponseDto } from '../service/search.api.service';

const API_URL = process.env.REACT_APP_API_URL;

// ── design tokens ─────────────────────────────────────────────────────────────
const CARD_SHADOW = '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)';

// ── OpenAI types ─────────────────────────────────────────────────────────────
interface MethodStats {
    method:       string;
    model:        string;
    calls:        number;
    inputTokens:  number;
    outputTokens: number;
    totalTokens:  number;
    costUsd:      number;
}
interface OpenAIUsage {
    since:        string;
    totalCalls:   number;
    totalTokens:  number;
    totalCostUsd: number;
    methods:      MethodStats[];
}

async function fetchOpenAIUsage(): Promise<OpenAIUsage> {
    const res = await fetch(`${API_URL}/admin/openai/usage`);
    if (!res.ok) throw new Error('Failed to fetch OpenAI usage');
    return res.json();
}

// ── model badge colours ───────────────────────────────────────────────────────
const MODEL_COLOR: Record<string, { bg: string; text: string }> = {
    'gpt-4o':                 { bg: '#fef3c7', text: '#92400e' },
    'gpt-4o-mini':            { bg: '#eff6ff', text: '#1d4ed8' },
    'whisper-1':              { bg: '#f0fdf4', text: '#15803d' },
    'text-embedding-3-small': { bg: '#fdf4ff', text: '#7e22ce' },
};

function modelChip(model: string) {
    const c = MODEL_COLOR[model] ?? { bg: '#f1f5f9', text: '#475569' };
    return (
        <Box component="span" sx={{
            display: 'inline-block',
            px: 1, py: 0.25, borderRadius: 10,
            bgcolor: c.bg, color: c.text,
            fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
        }}>
            {model}
        </Box>
    );
}

function fmt(n: number, dec = 0) { return n.toLocaleString(undefined, { maximumFractionDigits: dec }); }
function fmtCost(usd: number) {
    if (usd < 0.0001) return '< $0.0001';
    return `$${usd.toFixed(4)}`;
}

// ── mini bar chart ────────────────────────────────────────────────────────────
const CostBar: React.FC<{ value: number; max: number }> = ({ value, max }) => {
    const pct = max > 0 ? (value / max) * 100 : 0;
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{
                width: 80, height: 6, borderRadius: 3,
                bgcolor: '#e2e8f0', overflow: 'hidden', flexShrink: 0,
            }}>
                <Box sx={{ width: `${pct}%`, height: '100%', bgcolor: '#6366f1', borderRadius: 3 }} />
            </Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#6366f1', whiteSpace: 'nowrap' }}>
                {fmtCost(value)}
            </Typography>
        </Box>
    );
};

// ── stat mini-card ────────────────────────────────────────────────────────────
const MiniStat: React.FC<{ label: string; value: string; sub?: string; color?: string }> = ({ label, value, sub, color = '#6366f1' }) => (
    <Box sx={{
        flex: 1, minWidth: 120,
        px: 2.5, py: 2,
        bgcolor: '#fafafa',
        border: '1px solid #e2e8f0',
        borderRadius: 2,
        borderLeft: `3px solid ${color}`,
    }}>
        <Typography sx={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', mb: 0.5 }}>
            {label}
        </Typography>
        <Typography sx={{ fontSize: 22, fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>
            {value}
        </Typography>
        {sub && <Typography sx={{ fontSize: 11, color: '#94a3b8', mt: 0.5 }}>{sub}</Typography>}
    </Box>
);

// ── page ──────────────────────────────────────────────────────────────────────
export const HomePage: React.FC = () => {
    const [stats, setStats]     = useState<AdminStatisticsResponseDto | null>(null);
    const [aiUsage, setAiUsage] = useState<OpenAIUsage | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const [s, ai] = await Promise.all([getAdminStatistics(), fetchOpenAIUsage()]);
            setStats(s);
            setAiUsage(ai);
        } catch {
            setError('Failed to load statistics');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const maxCost = aiUsage ? Math.max(...aiUsage.methods.map((m) => m.costUsd), 0.000001) : 1;

    return (
        <Box sx={{ px: { xs: 2, sm: 2.5, md: 3 }, py: 3, maxWidth: 1100, mx: 'auto' }}>

            {/* ── page title ── */}
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b', mb: 0.5 }}>Dashboard</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Live statistics — data refreshes on page load
            </Typography>

            {loading && !stats && (
                <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
            )}
            {error && !stats && (
                <Alert severity="error" action={<Button size="small" onClick={load} startIcon={<RefreshIcon />}>Retry</Button>}>
                    {error}
                </Alert>
            )}

            {stats && (
                <>
                    {/* ── app stats ── */}
                    <Paper elevation={0} sx={{ borderRadius: 2.5, overflow: 'hidden', boxShadow: CARD_SHADOW, mb: 3 }}>
                        <Box sx={{ height: 3, background: 'linear-gradient(90deg,#6366f1,#818cf8)' }} />
                        <Box sx={{ p: 2.5 }}>
                            <Typography sx={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6366f1', mb: 2 }}>
                                Platform overview
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                <MiniStat label="Client users"       value={fmt(stats.totalUsers)}        sub="Registered"             color="#3b82f6" />
                                <MiniStat label="Business users"     value={fmt(stats.totalBusinessUsers)} sub="Business portal accounts" color="#8b5cf6" />
                                <MiniStat label="Demands"            value={fmt(stats.totalDemands)}      sub="All time"               color="#10b981" />
                                <MiniStat label="Demands with offer" value={`${stats.demandsWithOffersPercent}%`} sub={`${stats.demandsWithOffers} of ${stats.totalDemands}`} color="#f59e0b" />
                            </Box>
                        </Box>
                    </Paper>

                    {/* ── OpenAI usage ── */}
                    {aiUsage && (
                        <Paper elevation={0} sx={{ borderRadius: 2.5, overflow: 'hidden', boxShadow: CARD_SHADOW, mb: 3 }}>
                            <Box sx={{ height: 3, background: 'linear-gradient(90deg,#10b981,#34d399)' }} />
                            <Box sx={{ p: 2.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                    <AutoAwesomeIcon sx={{ fontSize: 15, color: '#10b981' }} />
                                    <Typography sx={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#10b981' }}>
                                        OpenAI usage
                                    </Typography>
                                    <Typography sx={{ fontSize: 11, color: '#94a3b8', ml: 'auto' }}>
                                        Since {new Date(aiUsage.since).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </Typography>
                                </Box>

                                {/* summary row */}
                                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
                                    <MiniStat label="API calls"    value={fmt(aiUsage.totalCalls)}   color="#10b981" />
                                    <MiniStat label="Total tokens" value={fmt(aiUsage.totalTokens)}  color="#10b981" />
                                    <MiniStat label="Est. cost"    value={fmtCost(aiUsage.totalCostUsd)} sub="USD, approximate" color="#f59e0b" />
                                </Box>

                                {/* per-method table */}
                                {aiUsage.methods.length === 0 ? (
                                    <Typography variant="body2" color="text.secondary">
                                        No API calls recorded yet.
                                    </Typography>
                                ) : (
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                                {['Method', 'Model', 'Calls', 'Input tokens', 'Output tokens', 'Est. cost'].map((h) => (
                                                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', py: 1 }}>
                                                        {h}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {aiUsage.methods.map((m, i) => (
                                                <TableRow key={m.method} sx={{
                                                    bgcolor: i % 2 === 0 ? '#fff' : '#fafafa',
                                                    '&:last-child td': { borderBottom: 'none' },
                                                    '&:hover': { bgcolor: '#f0f4ff' },
                                                }}>
                                                    <TableCell sx={{ py: 1.25 }}>
                                                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#1e293b', fontFamily: 'monospace' }}>
                                                            {m.method}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell sx={{ py: 1.25 }}>{modelChip(m.model)}</TableCell>
                                                    <TableCell sx={{ py: 1.25 }}>
                                                        <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>{fmt(m.calls)}</Typography>
                                                    </TableCell>
                                                    <TableCell sx={{ py: 1.25 }}>
                                                        <Typography sx={{ fontSize: 12, color: '#64748b' }}>
                                                            {m.inputTokens > 0 ? fmt(m.inputTokens) : '—'}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell sx={{ py: 1.25 }}>
                                                        <Typography sx={{ fontSize: 12, color: '#64748b' }}>
                                                            {m.outputTokens > 0 ? fmt(m.outputTokens) : '—'}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell sx={{ py: 1.25 }}>
                                                        <CostBar value={m.costUsd} max={maxCost} />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </Box>
                        </Paper>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={loading ? <CircularProgress size={14} /> : <RefreshIcon />}
                            onClick={load}
                            disabled={loading}
                            sx={{ borderColor: '#e2e8f0', color: '#64748b' }}
                        >
                            Refresh
                        </Button>
                    </Box>
                </>
            )}
        </Box>
    );
};
