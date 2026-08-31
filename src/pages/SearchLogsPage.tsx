import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Collapse,
    IconButton,
    Link,
    Paper,
    Skeleton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    Tooltip,
    Typography,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useSnackbar } from '../contexts/SnackbarContext';
import { getBusinessById } from '../service/business.api.service';
import {
    clearSearchLogs,
    getSearchLogs,
    ISearchLog,
    ISearchLogResult,
    SearchLogSource,
} from '../service/search-logs.api.service';

const SOURCE_LABEL: Record<SearchLogSource, { label: string; hint: string; color: 'primary' | 'info' | 'warning' | 'default' }> = {
    search: { label: 'search', hint: 'Free-text search from the client app', color: 'primary' },
    demand: { label: 'demand', hint: 'Business list shown for an existing demand', color: 'info' },
    demand_created: { label: 'created', hint: 'Specialist count taken at demand creation', color: 'warning' },
    notify: { label: 'notify', hint: 'Choosing which businesses to notify', color: 'default' },
    eval: { label: 'eval', hint: 'Offline tuning run (npm run match-eval), not a real user', color: 'default' },
};

const facetChips = (facets: Record<string, string[] | string | null> | null) => {
    if (!facets) return <Typography variant="caption" color="text.secondary">—</Typography>;
    const entries = Object.entries(facets).filter(
        ([, v]) => v != null && v !== '' && (!Array.isArray(v) || v.length > 0),
    );
    if (entries.length === 0) return <Typography variant="caption" color="text.secondary">—</Typography>;
    return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {entries.map(([k, v]) => (
                <Chip key={k} size="small" variant="outlined"
                    label={`${k}: ${Array.isArray(v) ? v.join(', ') : v}`} />
            ))}
        </Box>
    );
};

/**
 * Descriptions are not part of the log snapshot, so they are fetched per
 * business and kept for as long as the page is open — the same business turns
 * up in many rows, and opening each one should not re-request it.
 */
const descriptionCache = new Map<string, string | null>();

const cachedDescriptions = (results: ISearchLogResult[]): Record<string, string | null> =>
    Object.fromEntries(
        results
            .filter((r) => descriptionCache.has(r.businessId))
            .map((r) => [r.businessId, descriptionCache.get(r.businessId) ?? null]),
    );

const ResultsTable: React.FC<{ results: ISearchLogResult[] }> = ({ results }) => {
    // Absent key = still loading; a resolved-but-empty description is null.
    const [descriptions, setDescriptions] = useState<Record<string, string | null>>(
        () => cachedDescriptions(results),
    );

    useEffect(() => {
        const missing = Array.from(new Set(results.map((r) => r.businessId))).filter(
            (id) => !descriptionCache.has(id),
        );
        if (missing.length === 0) return;

        let cancelled = false;
        void Promise.all(
            missing.map(async (id) => {
                try {
                    const business = await getBusinessById(id);
                    return { id, description: business?.description ?? null, ok: true };
                } catch {
                    return { id, description: null, ok: false };
                }
            }),
        ).then((fetched) => {
            // Only successes are remembered: a request that failed should be
            // retried the next time the row is opened, not cached as "no
            // description" for the rest of the session.
            fetched
                .filter((f) => f.ok)
                .forEach((f) => descriptionCache.set(f.id, f.description));
            if (cancelled) return;
            setDescriptions((prev) => ({
                ...prev,
                ...Object.fromEntries(fetched.map((f) => [f.id, f.description])),
            }));
        });

        return () => { cancelled = true; };
    }, [results]);

    if (results.length === 0) {
        // The interesting case: the query was understood, nothing matched it.
        return <Alert severity="warning" sx={{ my: 1 }}>No business matched this query.</Alert>;
    }
    return (
        <Table size="small" sx={{ my: 1 }}>
            <TableHead>
                <TableRow>
                    <TableCell width={70}>Score</TableCell>
                    <TableCell width={70}>Dist</TableCell>
                    <TableCell>Business</TableCell>
                    <TableCell>
                        <Tooltip title="The business's description as it reads now — unlike the scores and parameters, this is not a snapshot from the moment of the search.">
                            <span>Description (current)</span>
                        </Tooltip>
                    </TableCell>
                    <TableCell>Matched aspects</TableCell>
                    <TableCell>Business parameters</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {results.map((r, i) => {
                    const description = descriptions[r.businessId];
                    const isLoading = !(r.businessId in descriptions);
                    // Null rather than 0 when nothing moved, so an untouched
                    // ranking stays as quiet as it was before preferences
                    // existed. Rows logged before the field was added have no
                    // relevanceScore at all.
                    const rawAdjustment =
                        r.relevanceScore == null ? 0 : r.score - r.relevanceScore;
                    const adjustment = Math.abs(rawAdjustment) < 0.0005 ? null : rawAdjustment;
                    return (
                        <TableRow key={`${r.businessId}-${i}`}>
                            <TableCell>
                                <Typography variant="body2" fontWeight={700}>{r.score.toFixed(3)}</Typography>
                                {adjustment !== null && (
                                    <Tooltip title="How much the query's stated preferences moved this business, relative to relevance alone. Preferences reorder results; they never admit or exclude one.">
                                        <Typography
                                            variant="caption"
                                            display="block"
                                            color={adjustment > 0 ? 'success.main' : 'error.main'}
                                        >
                                            {adjustment > 0 ? '+' : ''}{adjustment.toFixed(3)}
                                        </Typography>
                                    </Tooltip>
                                )}
                            </TableCell>
                            <TableCell>
                                <Typography variant="caption">{r.distanceKm} km</Typography>
                            </TableCell>
                            <TableCell>
                                <Link
                                    component={RouterLink}
                                    to={`/businesses/${r.businessId}`}
                                    variant="body2"
                                    underline="hover"
                                >
                                    {r.name}
                                </Link>
                            </TableCell>
                            <TableCell sx={{ maxWidth: 320 }}>
                                {isLoading ? (
                                    <Skeleton variant="text" width={200} />
                                ) : description ? (
                                    <Tooltip title={description}>
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            sx={{
                                                display: '-webkit-box',
                                                WebkitLineClamp: 3,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden',
                                            }}
                                        >
                                            {description}
                                        </Typography>
                                    </Tooltip>
                                ) : (
                                    <Typography variant="caption" color="text.secondary">—</Typography>
                                )}
                            </TableCell>
                            <TableCell>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {r.matchedAspects.map((a) => (
                                        <Chip key={a} size="small" label={a} />
                                    ))}
                                </Box>
                            </TableCell>
                            <TableCell sx={{ maxWidth: 340 }}>{facetChips(r.facets)}</TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
};

const LogRow: React.FC<{ log: ISearchLog }> = ({ log }) => {
    const [open, setOpen] = useState(false);
    const source = SOURCE_LABEL[log.source] ?? SOURCE_LABEL.search;

    return (
        <>
            <TableRow hover sx={{ '& > *': { borderBottom: 'unset' } }}>
                <TableCell width={40}>
                    <IconButton size="small" onClick={() => setOpen((v) => !v)}>
                        {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                </TableCell>
                <TableCell width={60}>
                    <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                        {log.id}
                    </Typography>
                </TableCell>
                <TableCell width={150}>
                    <Typography variant="caption">{new Date(log.createdAt).toLocaleString()}</Typography>
                </TableCell>
                <TableCell width={90}>
                    <Chip size="small" label={source.label} color={source.color} title={source.hint} />
                </TableCell>
                <TableCell>
                    <Typography variant="body2" fontWeight={600}>{log.query}</Typography>
                </TableCell>
                <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {log.aspects.map((a) => <Chip key={a} size="small" label={a} color="primary" variant="outlined" />)}
                    </Box>
                </TableCell>
                <TableCell sx={{ maxWidth: 300 }}>{facetChips(log.demandFacets)}</TableCell>
                <TableCell sx={{ maxWidth: 220 }}>{facetChips(log.demandRanking ?? null)}</TableCell>
                <TableCell align="center" width={80}>
                    <Chip size="small" label={log.resultCount}
                        color={log.resultCount === 0 ? 'error' : 'default'} />
                </TableCell>
                <TableCell width={80}>
                    <Typography variant="caption" color="text.secondary">
                        {log.durationMs != null ? `${log.durationMs}ms` : '—'}
                    </Typography>
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell colSpan={10} sx={{ py: 0 }}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ px: 2, pb: 2 }}>
                            <ResultsTable results={log.results} />
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </>
    );
};

export const SearchLogsPage: React.FC = () => {
    const [data, setData] = useState<ISearchLog[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [limit, setLimit] = useState(50);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { showSuccess, showError } = useSnackbar();

    const fetchLogs = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const res = await getSearchLogs(page + 1, limit);
            setData(res.items);
            setTotal(res.total);
        } catch (e: any) {
            setError(e.message ?? 'Failed to fetch search logs');
        } finally {
            setIsLoading(false);
        }
    }, [page, limit]);

    useEffect(() => { fetchLogs(); }, [fetchLogs]);

    const handleClear = async () => {
        if (!window.confirm('Delete every search log entry? This cannot be undone.')) return;
        try {
            await clearSearchLogs();
            showSuccess('Search log cleared');
            await fetchLogs();
        } catch (e: any) {
            showError(e.message ?? 'Failed to clear search logs');
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2, gap: 2 }}>
                <Box>
                    <Typography variant="h5" fontWeight={700} gutterBottom>Search log</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 780 }}>
                        Every run of the matcher, with what the query was reduced to and who came back.
                        Scores and parameters are snapshots from the moment of the search — they do not
                        follow later edits to a business. Rows with <strong>0</strong> results are usually
                        the ones worth opening.
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                    <Button size="small" startIcon={<RefreshIcon />} onClick={fetchLogs}>Refresh</Button>
                    <Button size="small" color="error" variant="outlined" onClick={handleClear}>Clear</Button>
                </Box>
            </Box>

            {isLoading ? (
                <Box display="flex" justifyContent="center" my={4}><CircularProgress /></Box>
            ) : error ? (
                <Alert severity="error">{error}</Alert>
            ) : data.length === 0 ? (
                <Alert severity="info">No searches recorded yet.</Alert>
            ) : (
                <Paper>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell />
                                    <TableCell>ID</TableCell>
                                    <TableCell>When</TableCell>
                                    <TableCell>Source</TableCell>
                                    <TableCell>Query</TableCell>
                                    <TableCell>Embedded aspects</TableCell>
                                    <TableCell>Filters from query</TableCell>
                                    <TableCell>Preferences</TableCell>
                                    <TableCell align="center">Results</TableCell>
                                    <TableCell>Time</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {data.map((log) => <LogRow key={log.id} log={log} />)}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        component="div"
                        count={total}
                        page={page}
                        onPageChange={(_, p) => setPage(p)}
                        rowsPerPage={limit}
                        onRowsPerPageChange={(e) => { setLimit(Number(e.target.value)); setPage(0); }}
                        rowsPerPageOptions={[25, 50, 100, 200]}
                    />
                </Paper>
            )}
        </Box>
    );
};
