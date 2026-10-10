// Parked with the switched-off Telegram module (Backend/src/telegram/README.md):
// not routed. Add the /lead-radar route and nav link back to use it.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    IconButton,
    Link,
    MenuItem,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
    Typography,
} from '@mui/material';
import {
    ILeadMessage,
    ILeadSource,
    ILeadStats,
    LeadKind,
    TelegramConnection,
    leadRadarApi,
} from './lead-radar.api.service';

const REFRESH_MS = 20000;
const KIND_COLOR: Record<LeadKind, 'success' | 'info' | 'default'> = {
    request: 'success',
    offer: 'info',
    other: 'default',
};

/** A horizontal bar: label, value, and a fill against the largest value. */
const Bar: React.FC<{ label: string; value: number; max: number; color: string; onClick?: () => void; active?: boolean }> = ({
    label, value, max, color, onClick, active,
}) => (
    <Box
        onClick={onClick}
        sx={{
            display: 'grid', gridTemplateColumns: '200px 1fr 48px', alignItems: 'center', gap: 1, py: 0.25,
            cursor: onClick ? 'pointer' : 'default', borderRadius: 1, px: 0.5,
            bgcolor: active ? 'action.selected' : 'transparent', '&:hover': onClick ? { bgcolor: 'action.hover' } : {},
        }}
    >
        <Typography variant="body2" color="text.primary" noWrap title={label}>{label}</Typography>
        <Box sx={{ height: 10, bgcolor: 'grey.200', borderRadius: 5, overflow: 'hidden' }}>
            <Box sx={{ width: `${max ? (value / max) * 100 : 0}%`, height: '100%', bgcolor: color }} />
        </Box>
        <Typography variant="body2" color="text.primary" textAlign="right">{value}</Typography>
    </Box>
);

const Kpi: React.FC<{ label: string; value: string | number; hint?: string }> = ({ label, value, hint }) => (
    <Card variant="outlined" sx={{ minWidth: 150, flex: 1 }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Typography variant="caption" color="text.secondary">{label}</Typography>
            <Typography variant="h5" fontWeight={700}>{value}</Typography>
            {hint && <Typography variant="caption" color="text.secondary">{hint}</Typography>}
        </CardContent>
    </Card>
);

// ── Telegram account ──

const TelegramCard: React.FC<{ connection: TelegramConnection | null; onChange: (c: TelegramConnection) => void }> = ({
    connection, onChange,
}) => {
    const [value, setValue] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const run = async (action: () => Promise<TelegramConnection>) => {
        setBusy(true);
        setError(null);
        try {
            onChange(await action());
            setValue('');
        } catch (e: any) {
            setError(e.message);
        } finally {
            setBusy(false);
        }
    };

    let body: React.ReactNode = <CircularProgress size={18} />;
    if (connection?.status === 'not-configured') {
        body = (
            <Alert severity="warning">
                Add <code>TELEGRAM_API_ID</code> and <code>TELEGRAM_API_HASH</code> to the backend <code>.env</code> (my.telegram.org →
                API development tools), then restart the backend.
            </Alert>
        );
    } else if (connection?.status === 'connected') {
        body = (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Chip color="success" label={`Connected as ${connection.account}`} />
                <Button size="small" onClick={() => run(leadRadarApi.logout)} disabled={busy}>Log out</Button>
            </Box>
        );
    } else if (connection) {
        const step =
            connection.status === 'code-sent'
                ? { label: `Code sent to ${connection.phone}`, placeholder: 'Code from Telegram', action: () => leadRadarApi.signIn(value), button: 'Sign in' }
                : connection.status === 'password-needed'
                ? { label: 'Two-step verification password', placeholder: 'Password', action: () => leadRadarApi.password(value), button: 'Confirm' }
                : { label: 'Phone of the Telegram account to read with (a dedicated one, not personal)', placeholder: '+34…', action: () => leadRadarApi.sendCode(value), button: 'Send code' };
        body = (
            <Box component="form" onSubmit={(e) => { e.preventDefault(); void run(step.action); }} sx={{ display: 'flex', gap: 1, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <TextField
                    size="small"
                    label={step.label}
                    placeholder={step.placeholder}
                    type={connection.status === 'password-needed' ? 'password' : 'text'}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    sx={{ minWidth: 380 }}
                />
                <Button type="submit" variant="contained" disabled={busy || !value.trim()}>{step.button}</Button>
            </Box>
        );
    }

    return (
        <Card variant="outlined">
            <CardContent>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>Telegram account</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    Public groups are read as a regular Telegram account — bots only see chats they were added to.
                </Typography>
                {body}
                {error && <Alert severity="error" sx={{ mt: 1.5 }}>{error}</Alert>}
            </CardContent>
        </Card>
    );
};

// ── Page ──

export const LeadRadarPage: React.FC = () => {
    const [connection, setConnection] = useState<TelegramConnection | null>(null);
    const [sources, setSources] = useState<ILeadSource[]>([]);
    const [stats, setStats] = useState<ILeadStats | null>(null);
    const [messages, setMessages] = useState<ILeadMessage[]>([]);
    const [days, setDays] = useState(14);
    const [sourceFilter, setSourceFilter] = useState('');
    const [kindFilter, setKindFilter] = useState<LeadKind | ''>('request');
    const [tradeFilter, setTradeFilter] = useState('');
    const [handle, setHandle] = useState('');
    const [city, setCity] = useState('');
    const [backfillDays, setBackfillDays] = useState(14);
    const [adding, setAdding] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        try {
            const [c, s, st, m] = await Promise.all([
                leadRadarApi.telegram(),
                leadRadarApi.sources(),
                leadRadarApi.stats(days, sourceFilter || undefined),
                leadRadarApi.messages({
                    kind: kindFilter || undefined,
                    trade: tradeFilter || undefined,
                    sourceId: sourceFilter || undefined,
                    limit: 200,
                }),
            ]);
            setConnection(c);
            setSources(s);
            setStats(st);
            setMessages(m);
        } catch (e: any) {
            setError(e.message);
        }
    }, [days, sourceFilter, kindFilter, tradeFilter]);

    useEffect(() => {
        void load();
        const timer = setInterval(() => void load(), REFRESH_MS);
        return () => clearInterval(timer);
    }, [load]);

    const sourceById = useMemo(() => new Map(sources.map((s) => [s.id, s])), [sources]);
    const sourceStats = useMemo(() => new Map((stats?.perSource ?? []).map((s) => [s.sourceId, s])), [stats]);

    const addSource = async (e: React.FormEvent) => {
        e.preventDefault();
        setAdding(true);
        setError(null);
        try {
            await leadRadarApi.addSource(handle, city, backfillDays);
            setHandle('');
            await load();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setAdding(false);
        }
    };

    const act = async (action: () => Promise<unknown>) => {
        setError(null);
        try {
            await action();
            await load();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const totals = stats?.totals;
    const activeDays = stats?.perDay.length || 1;
    const maxTrade = Math.max(1, ...(stats?.perTrade ?? []).map((t) => Math.max(t.requests, t.offers)));
    const maxDay = Math.max(1, ...(stats?.perDay ?? []).map((d) => d.requests));

    return (
        <Box sx={{ p: 3, pt: 8, display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 1300 }}>
            <Box>
                <Typography variant="h6" color="text.primary" fontWeight={700}>📡 Lead radar</Typography>
                <Typography variant="body2" color="text.secondary">
                    Prototype: reads public community chats, finds people asking for a local service, and counts them by
                    trade and day — to see whether there are enough leads to sell. Authors are not stored.
                </Typography>
            </Box>

            {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}

            <TelegramCard connection={connection} onChange={(c) => { setConnection(c); void load(); }} />

            {/* ── Sources ── */}
            <Card variant="outlined">
                <CardContent>
                    <Typography variant="subtitle1" fontWeight={700} gutterBottom>Sources</Typography>
                    <Box component="form" onSubmit={addSource} sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                        <TextField size="small" label="Public group or channel" placeholder="@valencia_chat or t.me/…" value={handle} onChange={(e) => setHandle(e.target.value)} sx={{ minWidth: 280 }} />
                        <TextField size="small" label="City" placeholder="Valencia" value={city} onChange={(e) => setCity(e.target.value)} />
                        <TextField size="small" label="Read history, days" type="number" value={backfillDays} onChange={(e) => setBackfillDays(Math.min(60, Math.max(1, Number(e.target.value) || 14)))} sx={{ width: 160 }} />
                        <Button type="submit" variant="contained" disabled={adding || !handle.trim() || connection?.status !== 'connected'} startIcon={adding ? <CircularProgress size={16} color="inherit" /> : undefined}>
                            Add
                        </Button>
                    </Box>
                    {sources.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">No sources yet. Add a public expat group to start.</Typography>
                    ) : (
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Source</TableCell>
                                    <TableCell>City</TableCell>
                                    <TableCell align="right">Messages</TableCell>
                                    <TableCell align="right">Requests</TableCell>
                                    <TableCell align="right">Offers</TableCell>
                                    <TableCell>Last read</TableCell>
                                    <TableCell>On</TableCell>
                                    <TableCell />
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {sources.map((s) => {
                                    const st = sourceStats.get(s.id);
                                    return (
                                        <TableRow key={s.id} selected={sourceFilter === s.id}>
                                            <TableCell>
                                                <Link href={`https://t.me/${s.handle}`} target="_blank" rel="noopener">{s.title ?? s.handle}</Link>
                                                <Typography variant="caption" display="block" color="text.secondary">@{s.handle}</Typography>
                                                {s.lastError && <Typography variant="caption" color="error">{s.lastError}</Typography>}
                                            </TableCell>
                                            <TableCell>{s.city ?? '—'}</TableCell>
                                            <TableCell align="right">{st?.messages ?? 0}</TableCell>
                                            <TableCell align="right">{st?.requests ?? 0}</TableCell>
                                            <TableCell align="right">{st?.offers ?? 0}</TableCell>
                                            <TableCell>{s.lastPolledAt ? new Date(s.lastPolledAt).toLocaleString() : 'reading…'}</TableCell>
                                            <TableCell>
                                                <Switch size="small" checked={s.enabled} onChange={(e) => act(() => leadRadarApi.updateSource(s.id, { enabled: e.target.checked }))} />
                                            </TableCell>
                                            <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                                <Button size="small" onClick={() => setSourceFilter(sourceFilter === s.id ? '' : s.id)}>
                                                    {sourceFilter === s.id ? 'All sources' : 'Only this'}
                                                </Button>
                                                <Button size="small" onClick={() => act(() => leadRadarApi.poll(s.id))}>Read now</Button>
                                                <Tooltip title="Remove the source and its messages">
                                                    <IconButton size="small" onClick={() => window.confirm(`Remove @${s.handle} and its messages?`) && act(() => leadRadarApi.removeSource(s.id))}>✕</IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* ── Volume ── */}
            <Card variant="outlined">
                <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                        <Typography variant="subtitle1" fontWeight={700} sx={{ flex: 1 }}>
                            Volume {sourceFilter && `· ${sourceById.get(sourceFilter)?.title ?? ''}`}
                        </Typography>
                        <ToggleButtonGroup size="small" exclusive value={days} onChange={(_, v) => v && setDays(v)}>
                            <ToggleButton value={7}>7 days</ToggleButton>
                            <ToggleButton value={14}>14 days</ToggleButton>
                            <ToggleButton value={30}>30 days</ToggleButton>
                        </ToggleButtonGroup>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                        <Kpi label="Messages read" value={totals?.messages ?? 0} hint={totals?.unclassified ? `${totals.unclassified} still classifying` : undefined} />
                        <Kpi label="Requests (leads)" value={totals?.requests ?? 0} hint={totals?.messages ? `${((totals.requests / totals.messages) * 100).toFixed(1)}% of messages` : undefined} />
                        <Kpi label="Requests per day" value={((totals?.requests ?? 0) / activeDays).toFixed(1)} hint={`over ${activeDays} day(s) with messages`} />
                        <Kpi label="Providers advertising" value={totals?.offers ?? 0} hint="businesses that might buy leads" />
                    </Box>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                        <Box>
                            <Typography variant="subtitle2" gutterBottom>By trade — requests <Box component="span" sx={{ color: 'success.main' }}>■</Box> and offers <Box component="span" sx={{ color: 'info.main' }}>■</Box> (click to filter)</Typography>
                            {(stats?.perTrade ?? []).length === 0 && <Typography variant="body2" color="text.secondary">Nothing yet.</Typography>}
                            {(stats?.perTrade ?? []).map((t) => (
                                <Box key={t.trade}>
                                    <Bar label={t.trade} value={t.requests} max={maxTrade} color="success.main" active={tradeFilter === t.trade} onClick={() => setTradeFilter(tradeFilter === t.trade ? '' : t.trade)} />
                                    {t.offers > 0 && <Bar label="" value={t.offers} max={maxTrade} color="info.main" />}
                                </Box>
                            ))}
                        </Box>
                        <Box>
                            <Typography variant="subtitle2" gutterBottom>Requests by day</Typography>
                            {(stats?.perDay ?? []).map((d) => (
                                <Bar key={d.day} label={`${d.day} · ${d.messages} msgs`} value={d.requests} max={maxDay} color="success.main" />
                            ))}
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            {/* ── Messages ── */}
            <Card variant="outlined">
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5, flexWrap: 'wrap' }}>
                        <Typography variant="subtitle1" fontWeight={700} sx={{ flex: 1 }}>
                            Messages {tradeFilter && <Chip size="small" label={tradeFilter} onDelete={() => setTradeFilter('')} sx={{ ml: 1 }} />}
                        </Typography>
                        <TextField select size="small" label="Kind" value={kindFilter} onChange={(e) => setKindFilter(e.target.value as LeadKind | '')} sx={{ width: 160 }}>
                            <MenuItem value="">All</MenuItem>
                            <MenuItem value="request">Requests</MenuItem>
                            <MenuItem value="offer">Offers</MenuItem>
                            <MenuItem value="other">Other</MenuItem>
                        </TextField>
                    </Box>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>When</TableCell>
                                <TableCell>Kind</TableCell>
                                <TableCell>Trade · place · urgency</TableCell>
                                <TableCell>Message</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {messages.map((m) => (
                                <TableRow key={m.id} hover>
                                    <TableCell sx={{ whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                                        <Link href={m.link} target="_blank" rel="noopener">{new Date(m.postedAt).toLocaleString()}</Link>
                                        <Typography variant="caption" display="block" color="text.secondary">
                                            {sourceById.get(m.sourceId)?.title ?? ''}
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={{ verticalAlign: 'top' }}>
                                        {m.kind ? <Chip size="small" color={KIND_COLOR[m.kind]} label={m.kind} /> : <Chip size="small" label="…" />}
                                    </TableCell>
                                    <TableCell sx={{ verticalAlign: 'top', minWidth: 200 }}>
                                        <Typography variant="body2" color="text.primary">{m.trade ?? '—'}</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {[m.place, m.urgency].filter(Boolean).join(' · ')}
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={{ verticalAlign: 'top' }}>
                                        {m.summary && <Typography variant="body2" color="text.primary" fontWeight={600}>{m.summary}</Typography>}
                                        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', maxHeight: 96, overflow: 'hidden' }}>
                                            {m.text}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {messages.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4}>
                                        <Typography variant="body2" color="text.secondary">Nothing here yet.</Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </Box>
    );
};
