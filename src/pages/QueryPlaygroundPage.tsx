import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Divider,
    Link,
    MenuItem,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import FlagIcon from '@mui/icons-material/Flag';
import OutlinedFlagIcon from '@mui/icons-material/OutlinedFlag';
import SearchIcon from '@mui/icons-material/Search';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useSnackbar } from '../contexts/SnackbarContext';
import {
    generatePlaygroundQuery,
    runPlaygroundSearch,
    flagMatch,
    listFlags,
    updateFlag,
    deleteFlag,
    IFlaggedMatch,
    IPlaygroundSearch,
    IPlaygroundResult,
    FlagReason,
    FLAG_REASONS,
} from '../service/playground-search.api.service';
import { IconButton } from '@mui/material';

/** Centre of the seeded catalogue, so a fresh page searches where the data is. */
const DEFAULT_LAT = 39.4704;
const DEFAULT_LNG = -0.3932;

const chips = (
    values: Record<string, string[]> | null,
    color: 'error' | 'warning' | 'default',
) => {
    const entries = Object.entries(values ?? {}).filter(([, v]) => v?.length);
    if (entries.length === 0) {
        return <Typography variant="caption" color="text.secondary">—</Typography>;
    }
    return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {entries.map(([k, v]) => (
                <Chip key={k} size="small" color={color} variant="outlined" label={`${k}: ${v.join(', ')}`} />
            ))}
        </Box>
    );
};

/**
 * A compact transcript of the run, for pasting into a conversation about it.
 * The search log id alone is enough to look everything up in the database, but
 * a paste is faster when the question is about one specific ranking.
 */
function asTranscript(search: IPlaygroundSearch): string {
    const lines = [
        `search_logs id: ${search.searchLogId ?? '(not recorded)'}`,
        `query: ${search.query}`,
        `aspects: ${search.aspects.join(' | ') || '(none)'}`,
        `filters: ${JSON.stringify(search.filters)}`,
        `preferences: ${JSON.stringify(search.ranking)}`,
        `${search.results.length} result(s):`,
        ...search.results.map(
            (r, i) =>
                `${i + 1}. ${r.score.toFixed(3)} (rel ${r.relevanceScore.toFixed(3)}) ` +
                `${r.distanceKm}km ${r.name} [${r.matchedAspects.join(', ')}]`,
        ),
    ];
    return lines.join('\n');
}

export const QueryPlaygroundPage: React.FC = () => {
    const [language, setLanguage] = useState<'ru' | 'uk'>('ru');
    const [hint, setHint] = useState('');
    const [query, setQuery] = useState('');
    const [lat, setLat] = useState(String(DEFAULT_LAT));
    const [lng, setLng] = useState(String(DEFAULT_LNG));
    const [radiusKm, setRadiusKm] = useState('25');

    const [generating, setGenerating] = useState(false);
    const [searching, setSearching] = useState(false);
    const [search, setSearch] = useState<IPlaygroundSearch | null>(null);
    const [error, setError] = useState<string | null>(null);
    // Business ids marked in this session or in an earlier run, so a row shows
    // as flagged the moment it is saved without waiting for another search.
    const [flagged, setFlagged] = useState<Set<string>>(new Set());
    // Flags belonging to the search on screen, so the button can toggle its own
    // mark. Kept apart from `flagged`, which is every business marked in any
    // run: clicking must not delete a judgement made about a different query.
    const [flagsHere, setFlagsHere] = useState<Map<string, number>>(new Map());
    const [savingFlag, setSavingFlag] = useState<string | null>(null);
    const [flagList, setFlagList] = useState<IFlaggedMatch[]>([]);
    const [reasonCounts, setReasonCounts] = useState<{ reason: FlagReason; count: number }[]>([]);
    const { showSuccess, showError } = useSnackbar();

    const generate = async () => {
        try {
            setGenerating(true);
            setError(null);
            setQuery(await generatePlaygroundQuery(language, hint || undefined));
        } catch (e: any) {
            setError(e.message ?? 'Could not generate a query');
        } finally {
            setGenerating(false);
        }
    };

    const runSearch = async () => {
        if (!query.trim()) return;
        try {
            setSearching(true);
            setError(null);
            const result = await runPlaygroundSearch({
                text: query.trim(),
                lat: Number(lat),
                lng: Number(lng),
                radiusKm: Number(radiusKm),
            });
            setSearch(result);
            setFlagsHere(new Map());
            await refreshFlags(result.searchLogId);
        } catch (e: any) {
            setError(e.message ?? 'Search failed');
            setSearch(null);
        } finally {
            setSearching(false);
        }
    };

    /**
     * Reloads the flags. `logId` scopes which of them belong to the search on
     * screen — rebuilt from the server rather than tracked locally, so a flag
     * deleted from the list below stops showing as marked in the results above.
     */
    const refreshFlags = useCallback(async (logId?: number | null) => {
        try {
            const { items, byReason } = await listFlags();
            setFlagList(items);
            setReasonCounts(byReason);
            setFlagged(new Set(items.map((f) => f.businessId)));
            if (logId != null) {
                setFlagsHere(
                    new Map(
                        items
                            .filter((f) => f.searchLogId === logId)
                            .map((f) => [f.businessId, f.id]),
                    ),
                );
            }
        } catch {
            // The list is a review aid; failing to load it must not break the page.
        }
    }, []);

    useEffect(() => { void refreshFlags(); }, [refreshFlags]);

    /**
     * One click marks, another unmarks. No reason is asked for here: marking
     * happens while reading a list, and stopping to classify each row costs
     * more attention than the classification is worth at that moment. The
     * reason is set later, below, when the flags are read together.
     */
    const toggleFlag = async (result: IPlaygroundResult, rank: number) => {
        if (!search) return;
        try {
            setSavingFlag(result.businessId);
            const existingId = flagsHere.get(result.businessId);
            if (existingId !== undefined) {
                await deleteFlag(existingId);
            } else {
                const saved = await flagMatch({
                    searchLogId: search.searchLogId,
                    query: search.query,
                    aspects: search.aspects,
                    demandFacets: search.filters,
                    demandRanking: search.ranking,
                    businessId: result.businessId,
                    businessName: result.name,
                    rank,
                    score: result.score,
                    relevanceScore: result.relevanceScore,
                    distanceKm: result.distanceKm,
                    matchedAspects: result.matchedAspects,
                    businessFacets: result.facets,
                });
                setFlagsHere((prev) => new Map(prev).set(result.businessId, saved.id));
            }
            await refreshFlags(search.searchLogId);
        } catch (e: any) {
            showError(e.message ?? 'Could not save the mark');
        } finally {
            setSavingFlag(null);
        }
    };

    const copyTranscript = async () => {
        if (!search) return;
        try {
            await navigator.clipboard.writeText(asTranscript(search));
            showSuccess('Copied');
        } catch {
            showError('Could not copy to the clipboard');
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" fontWeight={700} gutterBottom>Query playground</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 820, mb: 2 }}>
                Runs one query through the real matcher and shows the whole derivation: what the
                request was reduced to, what gated the search, what merely reordered it, and who
                came back. Every run is written to the search log — quote its number to ask about
                a result later.
            </Typography>

            <Paper sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                    <TextField
                        select size="small" label="Language" value={language} sx={{ width: 140 }}
                        onChange={(e) => setLanguage(e.target.value as 'ru' | 'uk')}
                    >
                        <MenuItem value="ru">Russian</MenuItem>
                        <MenuItem value="uk">Ukrainian</MenuItem>
                    </TextField>
                    <TextField
                        size="small" label="About (optional)" value={hint} sx={{ flex: 1, minWidth: 240 }}
                        placeholder="plumbing, kids, something urgent…"
                        onChange={(e) => setHint(e.target.value)}
                    />
                    <Button
                        variant="outlined" onClick={generate} disabled={generating}
                        startIcon={generating ? <CircularProgress size={16} /> : <AutoAwesomeIcon />}
                    >
                        Generate
                    </Button>
                </Box>

                <TextField
                    fullWidth multiline minRows={2} sx={{ mt: 2 }}
                    label="Query" value={query}
                    placeholder="Type a request, or generate one above"
                    onChange={(e) => setQuery(e.target.value)}
                />

                <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                    <TextField size="small" label="Latitude" value={lat} sx={{ width: 140 }}
                        onChange={(e) => setLat(e.target.value)} />
                    <TextField size="small" label="Longitude" value={lng} sx={{ width: 140 }}
                        onChange={(e) => setLng(e.target.value)} />
                    <TextField size="small" label="Radius, km" value={radiusKm} sx={{ width: 120 }}
                        onChange={(e) => setRadiusKm(e.target.value)} />
                    <Button
                        variant="contained" onClick={runSearch}
                        disabled={searching || !query.trim()}
                        startIcon={searching ? <CircularProgress size={16} /> : <SearchIcon />}
                    >
                        Search
                    </Button>
                </Box>
            </Paper>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {search && (
                <Paper sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                        <Chip
                            color="primary"
                            label={search.searchLogId ? `search log #${search.searchLogId}` : 'not recorded'}
                        />
                        <Typography variant="caption" color="text.secondary">
                            {search.results.length} result(s)
                            {search.durationMs != null && ` · ${search.durationMs}ms`}
                        </Typography>
                        <Button size="small" startIcon={<ContentCopyIcon />} onClick={copyTranscript}>
                            Copy transcript
                        </Button>
                    </Box>

                    <Box sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 1, alignItems: 'center', mb: 2 }}>
                        <Tooltip title="The English service phrases the query was reduced to. These are what actually get embedded and compared — a phrase that lost the fault, like 'pipe repair' for a leak, searches for a trade rather than for the job.">
                            <Typography variant="caption" color="text.secondary">Embedded aspects</Typography>
                        </Tooltip>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {search.aspects.length
                                ? search.aspects.map((a) => <Chip key={a} size="small" color="primary" label={a} />)
                                : <Typography variant="caption" color="text.secondary">—</Typography>}
                        </Box>

                        <Tooltip title="Hard gates. A business that stated a contradicting value was excluded; one that stated nothing was kept. A filter invented from a request that never said it removes businesses the person wanted.">
                            <Typography variant="caption" color="text.secondary">Filters</Typography>
                        </Tooltip>
                        {chips(search.filters, 'error')}

                        <Tooltip title="Preferences. These only reorder businesses that already qualified — they never admit or exclude one, and a business that stated nothing is left where it was.">
                            <Typography variant="caption" color="text.secondary">Preferences</Typography>
                        </Tooltip>
                        {chips(search.ranking, 'warning')}
                    </Box>

                    <Divider sx={{ mb: 1 }} />

                    {search.results.length === 0 ? (
                        <Alert severity="warning">
                            No business matched. With the aspects and filters above, this is the most
                            informative kind of result: it says which of the two turned everyone away.
                        </Alert>
                    ) : (
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell width={44} />
                                    <TableCell width={90}>Score</TableCell>
                                    <TableCell width={70}>Dist</TableCell>
                                    <TableCell>Business</TableCell>
                                    <TableCell>Description</TableCell>
                                    <TableCell>Matched aspects</TableCell>
                                    <TableCell>Business parameters</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {search.results.map((r, i) => {
                                    const adjustment = r.score - r.relevanceScore;
                                    const moved = Math.abs(adjustment) >= 0.0005;
                                    const markedHere = flagsHere.has(r.businessId);
                                    // Marked against some other query. Worth showing — a repeat
                                    // offender is a pattern — but visually distinct, because it
                                    // says nothing about whether it belongs in *this* result set.
                                    const markedElsewhere = !markedHere && flagged.has(r.businessId);
                                    return (
                                        <TableRow
                                            key={`${r.businessId}-${i}`}
                                            sx={markedHere ? { bgcolor: 'action.hover' } : undefined}
                                        >
                                            <TableCell>
                                                <Tooltip
                                                    title={
                                                        markedHere
                                                            ? 'Marked. Click to unmark.'
                                                            : markedElsewhere
                                                              ? 'Marked in an earlier result set, which does not by itself make it wrong here. Click to mark it for this query too.'
                                                              : 'Mark as not belonging in this result set'
                                                    }
                                                >
                                                    <span>
                                                        <IconButton
                                                            size="small"
                                                            disabled={savingFlag === r.businessId}
                                                            color={markedHere ? 'error' : markedElsewhere ? 'warning' : 'default'}
                                                            onClick={() => void toggleFlag(r, i + 1)}
                                                        >
                                                            {markedHere ? <FlagIcon fontSize="small" /> : <OutlinedFlagIcon fontSize="small" />}
                                                        </IconButton>
                                                    </span>
                                                </Tooltip>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={700}>
                                                    {r.score.toFixed(3)}
                                                </Typography>
                                                {moved && (
                                                    <Typography
                                                        variant="caption" display="block"
                                                        color={adjustment > 0 ? 'success.main' : 'error.main'}
                                                    >
                                                        {adjustment > 0 ? '+' : ''}{adjustment.toFixed(3)} pref
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="caption">{r.distanceKm} km</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Link
                                                    component={RouterLink}
                                                    to={`/businesses/${r.businessId}`}
                                                    variant="body2" underline="hover"
                                                >
                                                    {r.name}
                                                </Link>
                                            </TableCell>
                                            <TableCell sx={{ maxWidth: 300 }}>
                                                <Tooltip title={r.description ?? ''}>
                                                    <Typography
                                                        variant="caption" color="text.secondary"
                                                        sx={{
                                                            display: '-webkit-box',
                                                            WebkitLineClamp: 3,
                                                            WebkitBoxOrient: 'vertical',
                                                            overflow: 'hidden',
                                                        }}
                                                    >
                                                        {r.description ?? '—'}
                                                    </Typography>
                                                </Tooltip>
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                    {r.matchedAspects.map((a) => (
                                                        <Chip key={a} size="small" label={a} />
                                                    ))}
                                                </Box>
                                            </TableCell>
                                            <TableCell sx={{ maxWidth: 300 }}>
                                                {chips(
                                                    Object.fromEntries(
                                                        Object.entries(r.facets ?? {})
                                                            .filter(([, v]) => v != null && (!Array.isArray(v) || v.length))
                                                            .map(([k, v]) => [k, Array.isArray(v) ? v : [String(v)]]),
                                                    ),
                                                    'default',
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </Paper>
            )}

            {flagList.length > 0 && (
                <Paper sx={{ p: 2, mt: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                        <Typography variant="subtitle1" fontWeight={700}>
                            Marked as dubious ({flagList.length})
                        </Typography>
                        {reasonCounts.map((c) => (
                            <Chip
                                key={c.reason ?? 'unclassified'} size="small" variant="outlined"
                                color={c.reason ? 'default' : 'warning'}
                                label={`${c.reason ? (FLAG_REASONS.find((r) => r.value === c.reason)?.label ?? c.reason) : 'unclassified'}: ${c.count}`}
                            />
                        ))}
                    </Box>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                        Each row keeps the whole match — the query, what it was reduced to, and how
                        the business looked at the time — so it stays readable after the search log
                        is cleared. Classify them here, once the pattern across several is visible;
                        marking a result up above asks for nothing. Resolve one when its cause is
                        fixed, to keep this a to-do list.
                    </Typography>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Query</TableCell>
                                <TableCell>Business</TableCell>
                                <TableCell width={110}>Reason</TableCell>
                                <TableCell>Matched on</TableCell>
                                <TableCell>Note</TableCell>
                                <TableCell width={120} align="right">Log</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {flagList.map((f) => (
                                <TableRow key={f.id}>
                                    <TableCell sx={{ maxWidth: 220 }}>
                                        <Typography variant="caption">{f.query}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Link
                                            component={RouterLink} to={`/businesses/${f.businessId}`}
                                            variant="body2" underline="hover"
                                        >
                                            {f.businessName}
                                        </Link>
                                        <Typography variant="caption" color="text.secondary" display="block">
                                            rank {f.rank} · {f.score.toFixed(3)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                            select size="small" variant="standard" fullWidth
                                            value={f.reason ?? ''}
                                            onChange={async (e) => {
                                                await updateFlag(f.id, {
                                                    reason: (e.target.value || null) as FlagReason | null,
                                                });
                                                await refreshFlags(search?.searchLogId);
                                            }}
                                        >
                                            <MenuItem value=""><em>unclassified</em></MenuItem>
                                            {FLAG_REASONS.map((r) => (
                                                <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
                                            ))}
                                        </TextField>
                                    </TableCell>
                                    <TableCell sx={{ maxWidth: 200 }}>
                                        <Typography variant="caption">{f.matchedAspects.join(', ') || '—'}</Typography>
                                    </TableCell>
                                    <TableCell sx={{ maxWidth: 200 }}>
                                        <Typography variant="caption" color="text.secondary">{f.note ?? '—'}</Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                                            {f.searchLogId ? `#${f.searchLogId}` : '—'}
                                        </Typography>
                                        <Button size="small" onClick={async () => {
                                            await updateFlag(f.id, { resolved: true });
                                            await refreshFlags(search?.searchLogId);
                                        }}>Resolve</Button>
                                        <Button size="small" color="error" onClick={async () => {
                                            await deleteFlag(f.id);
                                            await refreshFlags(search?.searchLogId);
                                        }}>Delete</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Paper>
            )}

        </Box>
    );
};
