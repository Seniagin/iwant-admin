import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
    Box,
    Button,
    Divider,
    Paper,
    Slider,
    Typography,
    Alert,
    CircularProgress,
    Card,
    CardContent,
    Link,
    Chip,
    TextField,
    InputAdornment,
    IconButton,
    ToggleButton,
    ToggleButtonGroup,
} from '@mui/material';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.css';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.Default.css';
import {
    searchBusinessImportArea,
    listBusinessImportCandidates,
    approveBusinessImportCandidate,
    rejectBusinessImportCandidate,
    translateBusinessImportCandidate,
    autoApproveBusinessImportCandidates,
    IImportedBusinessCandidate,
} from '../service/business-import.api.service';
import '../setupLeafletDefaultIcons';
import { ImportSweeps, MapCell } from '../components/ImportSweeps';

/** Case- and accent-insensitive: "clinica" finds "Clínica". */
function normalizeForSearch(s: string): string {
    return s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
}

interface MapCenter {
    lat: number;
    lng: number;
}

function MapClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
    useMapEvents({
        click: (e) => onPick(e.latlng.lat, e.latlng.lng),
    });
    return null;
}

const DEFAULT_CENTER: MapCenter = { lat: 39.466667, lng: -0.375 }; // Valencia

/** Cards mounted at once — the queue runs into the thousands, and MUI cards are heavy. */
const PENDING_PAGE_SIZE = 50;

interface CandidateCardProps {
    candidate: IImportedBusinessCandidate;
    reviewing: boolean;
    translating: boolean;
    onApprove: (candidate: IImportedBusinessCandidate) => void;
    onReject: (candidate: IImportedBusinessCandidate) => void;
    onTranslate: (candidate: IImportedBusinessCandidate) => void;
}

const LinkChip: React.FC<{ href: string; label: string }> = ({ href, label }) => (
    <Chip size="small" component={Link} href={href} target="_blank" rel="noopener" clickable label={label} />
);

const CandidateCard = React.memo<CandidateCardProps>(
    ({ candidate, reviewing, translating, onApprove, onReject, onTranslate }) => (
        <Card variant="outlined">
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="subtitle1" fontWeight={600}>
                    {candidate.name}
                </Typography>
                {candidate.address && (
                    <Typography variant="caption" color="text.secondary">
                        {candidate.address}
                    </Typography>
                )}
                {candidate.description ? (
                    <Typography variant="body2">{candidate.description}</Typography>
                ) : (
                    <Typography variant="body2" color="warning.main">
                        No description — {candidate.website ? 'scrape/summarize failed, ' : 'no website found, '}
                        review manually
                    </Typography>
                )}
                {candidate.descriptionRu && (
                    <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                        🇷🇺 {candidate.descriptionRu}
                    </Typography>
                )}
                {candidate.description && !candidate.descriptionRu && (
                    <Button
                        size="small"
                        variant="text"
                        disabled={translating}
                        startIcon={translating ? <CircularProgress size={14} /> : undefined}
                        onClick={() => onTranslate(candidate)}
                        sx={{ alignSelf: 'flex-start' }}
                    >
                        🇷🇺 Translate
                    </Button>
                )}
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {candidate.website && <LinkChip href={candidate.website} label="website" />}
                    {candidate.instagramUrl && <LinkChip href={candidate.instagramUrl} label="instagram" />}
                    {candidate.facebookUrl && <LinkChip href={candidate.facebookUrl} label="facebook" />}
                    {candidate.googleMapsUrl && <LinkChip href={candidate.googleMapsUrl} label="Google Maps" />}
                    {candidate.googleRating != null && (
                        <Chip
                            size="small"
                            variant="outlined"
                            title="Rating from Google Maps"
                            label={`★ ${candidate.googleRating.toFixed(1)} (${candidate.googleRatingCount ?? 0}) Google Maps`}
                        />
                    )}
                    {candidate.aiConfidence != null && (
                        <Chip
                            size="small"
                            variant="outlined"
                            title="AI judge's confidence that this is a service people hire — below 0.35 it isn't auto-approved"
                            label={`AI ${candidate.aiConfidence.toFixed(2)}`}
                        />
                    )}
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        size="small"
                        variant="contained"
                        color="success"
                        disabled={reviewing}
                        onClick={() => onApprove(candidate)}
                    >
                        Approve
                    </Button>
                    <Button size="small" color="error" disabled={reviewing} onClick={() => onReject(candidate)}>
                        Reject
                    </Button>
                </Box>
            </CardContent>
        </Card>
    ),
);

interface PendingListProps {
    candidates: IImportedBusinessCandidate[];
    reviewingId: string | null;
    translatingId: string | null;
    onApprove: (candidate: IImportedBusinessCandidate) => void;
    onReject: (candidate: IImportedBusinessCandidate) => void;
    onTranslate: (candidate: IImportedBusinessCandidate) => void;
}

/**
 * Memoized so moving the radius slider doesn't re-render the queue, and paged
 * so the first render doesn't mount a thousand cards. Re-keyed by the search
 * query, which puts the page back to the first one.
 */
const PendingList = React.memo<PendingListProps>(({ candidates, reviewingId, translatingId, ...handlers }) => {
    const [limit, setLimit] = useState(PENDING_PAGE_SIZE);
    const hidden = candidates.length - limit;
    return (
        <>
            {candidates.slice(0, limit).map((candidate) => (
                <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    reviewing={reviewingId === candidate.id}
                    translating={translatingId === candidate.id}
                    {...handlers}
                />
            ))}
            {hidden > 0 && (
                <Button variant="outlined" onClick={() => setLimit((n) => n + PENDING_PAGE_SIZE)}>
                    Show {Math.min(hidden, PENDING_PAGE_SIZE)} more ({hidden} hidden)
                </Button>
            )}
        </>
    );
});

/** Memoized: re-reconciling a thousand markers on every slider step is what made the map crawl. */
const CandidateMarkers = React.memo<{ candidates: IImportedBusinessCandidate[] }>(({ candidates }) => (
    // Groups nearby candidates into a count bubble when zoomed out;
    // splits back into individual pins as you zoom in.
    <MarkerClusterGroup chunkedLoading maxClusterRadius={50}>
        {candidates.map((c) => (
            <Marker
                key={c.id}
                position={[c.location.latitude, c.location.longitude]}
                title={`${c.name} (${c.status})`}
            />
        ))}
    </MarkerClusterGroup>
));

const CELL_COLOR: Record<NonNullable<MapCell['status']> | 'plan', string> = {
    plan: '#0d47a1',
    pending: '#9e9e9e',
    running: '#1976d2',
    done: '#2e7d32',
    failed: '#d32f2f',
};

/** Sweep grid: planned cells (dashed) or a sweep's progress by status. */
const SweepCells = React.memo<{ mapCells: { cells: MapCell[]; radiusKm: number } | null }>(({ mapCells }) => (
    <>
        {mapCells?.cells.map((c, i) => (
            <Circle
                key={`${i}-${c.lat}-${c.lng}-${c.status ?? 'plan'}`}
                center={[c.lat, c.lng]}
                radius={mapCells.radiusKm * 1000}
                interactive={false}
                pathOptions={{
                    color: CELL_COLOR[c.status ?? 'plan'],
                    weight: c.status ? 1 : 1.5,
                    opacity: 0.9,
                    dashArray: c.status ? undefined : '4 4',
                    fillOpacity: c.status === 'done' || c.status === 'failed' || c.status === 'running' ? 0.18 : 0.04,
                }}
            />
        ))}
    </>
));

export const BusinessImportPage: React.FC = () => {
    const [center, setCenter] = useState<MapCenter | null>(null);
    const [radiusKm, setRadiusKm] = useState<number>(1);
    const [maxCalls, setMaxCalls] = useState<number>(100);
    const [candidates, setCandidates] = useState<IImportedBusinessCandidate[]>([]);
    const [searching, setSearching] = useState(false);
    const [reviewingId, setReviewingId] = useState<string | null>(null);
    const [translatingId, setTranslatingId] = useState<string | null>(null);
    const [autoApproving, setAutoApproving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [pendingQuery, setPendingQuery] = useState('');
    const [mode, setMode] = useState<'single' | 'sweep'>('single');
    const [mapCells, setMapCells] = useState<{ cells: MapCell[]; radiusKm: number } | null>(null);

    useEffect(() => {
        listBusinessImportCandidates('pending')
            .then(setCandidates)
            .catch(() => {
                /* first load of an empty table is fine to ignore */
            });
    }, []);

    const handleMapClick = useCallback((lat: number, lng: number) => {
        setCenter({ lat, lng });
    }, []);

    const handleMapCells = useCallback((cells: MapCell[] | null, cellRadiusKm: number) => {
        setMapCells(cells ? { cells, radiusKm: cellRadiusKm } : null);
    }, []);

    /** Merge the server's pending queue in — a running sweep keeps adding to it. */
    const reloadPending = useCallback(() => {
        listBusinessImportCandidates('pending')
            .then((fresh) =>
                setCandidates((prev) => {
                    const byId = new Map(prev.map((c) => [c.id, c]));
                    fresh.forEach((c) => byId.set(c.id, c));
                    return Array.from(byId.values());
                }),
            )
            .catch(() => { /* the next sweep tick tries again */ });
    }, []);

    const handleSearch = async () => {
        if (!center) return;
        setSearching(true);
        setError(null);
        try {
            const { candidates: found, search } = await searchBusinessImportArea({
                centerLat: center.lat,
                centerLng: center.lng,
                radiusKm,
                maxCalls,
            });
            setCandidates((prev) => {
                const byId = new Map(prev.map((c) => [c.id, c]));
                found.forEach((c) => byId.set(c.id, c));
                return Array.from(byId.values());
            });
            const gaps = [
                search.unexploredCells > 0 &&
                    `call cap reached — ${search.unexploredCells} dense area(s) not searched further, raise the cap to go deeper`,
                search.saturatedAtMinSize > 0 &&
                    `${search.saturatedAtMinSize} tiny area(s) still at Google's 20-place limit`,
            ].filter(Boolean);
            setNotice(
                `Google returned ${search.places} place(s) from ${search.calls} call(s) (~$${search.estimatedCostUsd.toFixed(2)})` +
                    (gaps.length ? `; ${gaps.join('; ')}` : ' — area fully covered'),
            );
        } catch (e: any) {
            setError(e.message ?? 'Search failed');
        } finally {
            setSearching(false);
        }
    };

    const handleApprove = useCallback(async (candidate: IImportedBusinessCandidate) => {
        setReviewingId(candidate.id);
        setError(null);
        try {
            const { categories, duplicateOf } = await approveBusinessImportCandidate(candidate.id);
            setCandidates((prev) => prev.filter((c) => c.id !== candidate.id));
            setNotice(
                duplicateOf
                    ? `${candidate.name} is already in the catalogue as "${duplicateOf}" — linked, no duplicate created`
                    : `${candidate.name} approved — category: ${categories.length ? categories.join(', ') : '(none matched)'}`,
            );
        } catch (e: any) {
            setError(e.message ?? 'Approve failed');
        } finally {
            setReviewingId(null);
        }
    }, []);

    const handleReject = useCallback(async (candidate: IImportedBusinessCandidate) => {
        setReviewingId(candidate.id);
        setError(null);
        try {
            await rejectBusinessImportCandidate(candidate.id);
            setCandidates((prev) => prev.filter((c) => c.id !== candidate.id));
        } catch (e: any) {
            setError(e.message ?? 'Reject failed');
        } finally {
            setReviewingId(null);
        }
    }, []);

    const handleTranslate = useCallback(async (candidate: IImportedBusinessCandidate) => {
        setTranslatingId(candidate.id);
        setError(null);
        try {
            const { descriptionRu } = await translateBusinessImportCandidate(candidate.id);
            setCandidates((prev) =>
                prev.map((c) => (c.id === candidate.id ? { ...c, descriptionRu } : c)),
            );
        } catch (e: any) {
            setError(e.message ?? 'Translate failed');
        } finally {
            setTranslatingId(null);
        }
    }, []);

    /** `all` = regress: re-judge candidates the AI has already scored too. */
    const handleAutoApprove = async (all: boolean) => {
        const count = all ? judgeableCount : unjudgedCount;
        if (!window.confirm(
            `AI will review ${count} ${all ? '' : 'not yet reviewed '}pending candidate(s) with a description ` +
            'and publish the ones it is confident are services people hire. Continue?',
        )) return;
        setAutoApproving(true);
        setError(null);
        try {
            const { approved, linkedToExisting, leftPending } = await autoApproveBusinessImportCandidates(all);
            const doneIds = new Set([...approved, ...linkedToExisting].map((a) => a.id));
            setCandidates((prev) => prev.filter((c) => !doneIds.has(c.id)));
            // Pick up the scores just stored on the ones left in the queue.
            listBusinessImportCandidates('pending')
                .then((fresh) => {
                    const byId = new Map(fresh.map((c) => [c.id, c]));
                    setCandidates((prev) => prev.map((c) => byId.get(c.id) ?? c));
                })
                .catch(() => { /* scores just won't show until reload */ });
            setNotice(
                `AI approved ${approved.length}` +
                (approved.length ? `: ${approved.map((a) => a.name).join(', ')}` : '') +
                (linkedToExisting.length
                    ? `. ${linkedToExisting.length} already in the catalogue — linked, not duplicated`
                    : '') +
                `. ${leftPending.length} left for manual review.`,
            );
        } catch (e: any) {
            setError(e.message ?? 'AI approve failed');
        } finally {
            setAutoApproving(false);
        }
    };

    const pending = useMemo(() => candidates.filter((c) => c.status === 'pending'), [candidates]);
    const judgeableCount = pending.filter((c) => c.description).length;
    const unjudgedCount = pending.filter((c) => c.description && !c.aiJudgedAt).length;
    const query = normalizeForSearch(pendingQuery);
    const visiblePending = useMemo(
        () =>
            query
                ? pending.filter((c) => normalizeForSearch(`${c.name} ${c.address ?? ''}`).includes(query))
                : pending,
        [pending, query],
    );

    return (
        <Box sx={{ display: 'flex', gap: 2, p: 3, height: 'calc(100vh - 80px)', overflow: 'hidden' }}>
            {/* ── Left panel: search + review queue ── */}
            <Paper
                elevation={2}
                sx={{
                    width: 420,
                    flexShrink: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    p: 2.5,
                    overflowY: 'auto',
                }}
            >
                <Typography variant="h6" fontWeight={700}>
                    📍 Business import
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Click the map to set the center point, set a radius, then search — every
                    business Google Places finds there lands below as a pending candidate with a
                    scraped-and-summarized description, waiting for review.
                </Typography>

                <Divider />

                <Box>
                    <Typography variant="subtitle2" gutterBottom>
                        Center point
                    </Typography>
                    {center ? (
                        <Typography variant="body2" color="text.secondary">
                            {center.lat.toFixed(5)}, {center.lng.toFixed(5)}
                        </Typography>
                    ) : (
                        <Typography variant="body2" color="warning.main">
                            Click the map to select a point
                        </Typography>
                    )}
                </Box>

                <Box>
                    <Typography variant="subtitle2" gutterBottom>
                        Radius: <strong>{radiusKm} km</strong>
                    </Typography>
                    <Slider
                        min={0.2}
                        max={50}
                        step={0.1}
                        value={radiusKm}
                        onChange={(_, v) => setRadiusKm(v as number)}
                        valueLabelDisplay="auto"
                        valueLabelFormat={(v) => `${v} km`}
                    />
                </Box>

                <ToggleButtonGroup
                    exclusive
                    size="small"
                    fullWidth
                    value={mode}
                    onChange={(_, v) => v && setMode(v)}
                >
                    <ToggleButton value="single">One search</ToggleButton>
                    <ToggleButton value="sweep">Sweep in small circles</ToggleButton>
                </ToggleButtonGroup>

                {mode === 'single' && (
                    <>
                        <Box>
                            <TextField
                                label="Max Google calls"
                                type="number"
                                size="small"
                                fullWidth
                                value={maxCalls}
                                onChange={(e) => setMaxCalls(Math.min(1000, Math.max(1, Number(e.target.value) || 1)))}
                                inputProps={{ min: 1, max: 1000 }}
                                helperText={
                                    `Up to ~$${(maxCalls * 0.04).toFixed(2)}. Google returns at most 20 places per call, ` +
                                    'so dense areas are split into smaller squares until each returns fewer than 20. ' +
                                    'Big radius in a city → needs more calls.'
                                }
                            />
                        </Box>

                        <Button
                            variant="contained"
                            size="large"
                            onClick={handleSearch}
                            disabled={!center || searching}
                            startIcon={searching ? <CircularProgress size={18} color="inherit" /> : undefined}
                        >
                            {searching ? 'Searching…' : 'Search this area'}
                        </Button>
                    </>
                )}

                <ImportSweeps
                    showForm={mode === 'sweep'}
                    center={center}
                    radiusKm={radiusKm}
                    onMapCells={handleMapCells}
                    onNewCandidates={reloadPending}
                />

                {error && <Alert severity="error">{error}</Alert>}
                {notice && (
                    <Alert severity="success" onClose={() => setNotice(null)}>
                        {notice}
                    </Alert>
                )}

                <Divider />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle2" sx={{ flex: 1 }}>
                        Pending review ({query ? `${visiblePending.length} of ${pending.length}` : pending.length})
                    </Typography>
                    <Button
                        size="small"
                        variant="outlined"
                        color="secondary"
                        title="Judge only candidates the AI hasn't scored yet"
                        disabled={autoApproving || searching || unjudgedCount === 0}
                        startIcon={autoApproving ? <CircularProgress size={14} color="inherit" /> : undefined}
                        onClick={() => handleAutoApprove(false)}
                    >
                        {autoApproving ? 'AI reviewing…' : `🤖 AI review (${unjudgedCount})`}
                    </Button>
                    <Button
                        size="small"
                        variant="text"
                        color="secondary"
                        title="Re-judge every pending candidate with a description, including ones already scored"
                        disabled={autoApproving || searching || judgeableCount === 0}
                        onClick={() => handleAutoApprove(true)}
                    >
                        Regress ({judgeableCount})
                    </Button>
                </Box>

                {pending.length > 0 && (
                    <TextField
                        size="small"
                        placeholder="Search by name or address"
                        value={pendingQuery}
                        onChange={(e) => setPendingQuery(e.target.value)}
                        InputProps={{
                            endAdornment: pendingQuery ? (
                                <InputAdornment position="end">
                                    <IconButton size="small" aria-label="Clear search" onClick={() => setPendingQuery('')}>
                                        ✕
                                    </IconButton>
                                </InputAdornment>
                            ) : undefined,
                        }}
                    />
                )}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <PendingList
                        key={query}
                        candidates={visiblePending}
                        reviewingId={reviewingId}
                        translatingId={translatingId}
                        onApprove={handleApprove}
                        onReject={handleReject}
                        onTranslate={handleTranslate}
                    />
                    {pending.length === 0 && (
                        <Typography variant="caption" color="text.secondary">
                            Nothing pending — search an area to find candidates.
                        </Typography>
                    )}
                    {pending.length > 0 && visiblePending.length === 0 && (
                        <Typography variant="caption" color="text.secondary">
                            No pending candidate matches “{pendingQuery}”.
                        </Typography>
                    )}
                </Box>
            </Paper>

            {/* ── Right panel: map ── */}
            <Box sx={{ flex: 1, borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                <MapContainer
                    center={[DEFAULT_CENTER.lat, DEFAULT_CENTER.lng]}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapClickHandler onPick={handleMapClick} />

                    {center && (
                        <>
                            <Marker position={[center.lat, center.lng]} />
                            <Circle
                                center={[center.lat, center.lng]}
                                radius={radiusKm * 1000}
                                pathOptions={{ color: '#1976d2', fillOpacity: 0.08 }}
                            />
                        </>
                    )}

                    <SweepCells mapCells={mapCells} />
                    <CandidateMarkers candidates={candidates} />
                </MapContainer>
            </Box>
        </Box>
    );
};
