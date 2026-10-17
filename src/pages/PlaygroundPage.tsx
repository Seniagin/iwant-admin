import React, { useState, useCallback, useEffect } from 'react';
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    Divider,
    FormControlLabel,
    Paper,
    Slider,
    Switch,
    TextField,
    Typography,
    Alert,
} from '@mui/material';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet';
import {
    placeMockBusinesses,
    PlaceMockBusinessesResult,
    removeMockBusinesses,
} from '../service/mock.api.service';
import { getAllCategories, ICategoryWithCount } from '../service/categories.api.service';
import { ReindexPanel } from '../components/common/ReindexPanel';
import { useReindex } from '../utils/hooks/useReindex';
import '../setupLeafletDefaultIcons';

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

const DEFAULT_CENTER: MapCenter = { lat: 39.466667 , lng: -0.375000 }; // Valencia
/** The predefined mock pool (`Backend/src/mock/data/mock-businesses.json`). */
const POOL_SIZE = 2000;

export const PlaygroundPage: React.FC = () => {
    const [center, setCenter] = useState<MapCenter | null>(null);
    const [radiusKm, setRadiusKm] = useState<number>(5);
    const [count, setCount] = useState<number>(POOL_SIZE);
    const [replace, setReplace] = useState(true);
    const [removing, setRemoving] = useState(false);
    const [removedNote, setRemovedNote] = useState<string | null>(null);
    const [allCategories, setAllCategories] = useState<ICategoryWithCount[]>([]);
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(new Set());
    const [useAllCategories, setUseAllCategories] = useState(true);
    const [categorySearch, setCategorySearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [result, setResult] = useState<PlaceMockBusinessesResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const reindex = useReindex();

    useEffect(() => {
        setCategoriesLoading(true);
        getAllCategories()
            .then((items) => setAllCategories([...items].sort((a, b) => a.name.localeCompare(b.name))))
            .catch(() => setError('Failed to load categories'))
            .finally(() => setCategoriesLoading(false));
    }, []);

    const visibleCategories = allCategories.filter((c) =>
        c.name.toLowerCase().includes(categorySearch.trim().toLowerCase()),
    );

    const handleMapClick = useCallback((lat: number, lng: number) => {
        setCenter({ lat, lng });
        setResult(null);
    }, []);

    const toggleCategory = (id: string) => {
        setSelectedCategoryIds((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const handleGenerate = async () => {
        if (!center) return;
        setLoading(true);
        setError(null);
        setResult(null);
        setRemovedNote(null);
        try {
            const res = await placeMockBusinesses({
                centerLat: center.lat,
                centerLng: center.lng,
                radiusKm,
                count,
                categoryIds: useAllCategories ? [] : Array.from(selectedCategoryIds),
                replace,
            });
            setResult(res);
        } catch (e: any) {
            setError(e.message ?? 'Placing failed');
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async () => {
        setRemoving(true);
        setError(null);
        setResult(null);
        try {
            const { removed } = await removeMockBusinesses();
            setRemovedNote(`Removed ${removed} mock businesses`);
        } catch (e: any) {
            setError(e.message ?? 'Removing failed');
        } finally {
            setRemoving(false);
        }
    };

    const canGenerate = !!center && (useAllCategories || selectedCategoryIds.size > 0);

    return (
        <Box sx={{ display: 'flex', gap: 2, p: 3, height: 'calc(100vh - 80px)', overflow: 'hidden' }}>
            {/* ── Left panel: controls ── */}
            <Paper
                elevation={2}
                sx={{
                    width: 340,
                    flexShrink: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    p: 2.5,
                    overflowY: 'auto',
                }}
            >
                <Typography variant="h6" fontWeight={700}>
                    🎮 Playground
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Click the map to set the center point, then place the predefined mock businesses
                    ({POOL_SIZE}, covering most things people ask for) around it.
                </Typography>

                <Divider />

                {/* Center coords */}
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

                {/* Radius */}
                <Box>
                    <Typography variant="subtitle2" gutterBottom>
                        Radius: <strong>{radiusKm} km</strong>
                    </Typography>
                    <Slider
                        min={0.5}
                        max={50}
                        step={0.5}
                        value={radiusKm}
                        onChange={(_, v) => setRadiusKm(v as number)}
                        valueLabelDisplay="auto"
                        valueLabelFormat={(v) => `${v} km`}
                    />
                </Box>

                {/* How many of the pool */}
                <Box>
                    <Typography variant="subtitle2" gutterBottom>
                        How many: <strong>{count}</strong> of {POOL_SIZE}
                    </Typography>
                    <Slider
                        min={50}
                        max={POOL_SIZE}
                        step={50}
                        value={count}
                        onChange={(_, v) => setCount(v as number)}
                        valueLabelDisplay="auto"
                    />
                    <Typography variant="caption" color="text.secondary" display="block">
                        Fewer than all still covers every niche it can: the pool is taken one niche at a time.
                        Descriptions are in Spanish, English, Russian and Ukrainian.
                    </Typography>
                </Box>

                <FormControlLabel
                    control={<Switch checked={replace} onChange={(e) => setReplace(e.target.checked)} />}
                    label="Remove earlier mock businesses first"
                />

                <Divider />

                {/* Categories */}
                <Box>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={useAllCategories}
                                onChange={(e) => setUseAllCategories(e.target.checked)}
                            />
                        }
                        label={`All categories${allCategories.length ? ` (${allCategories.length})` : ''}`}
                    />
                    <Typography variant="caption" color="text.secondary" display="block">
                        Placing costs embeddings only (~$0.01 for the whole pool): the descriptions and their
                        search signals come ready from the pool file.
                    </Typography>

                    {!useAllCategories && (
                        <Box sx={{ mt: 1 }}>
                            <TextField
                                size="small"
                                fullWidth
                                placeholder="Search categories…"
                                value={categorySearch}
                                onChange={(e) => setCategorySearch(e.target.value)}
                                sx={{ mb: 1 }}
                            />

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Typography variant="caption" color="text.secondary">
                                    {selectedCategoryIds.size} selected · {visibleCategories.length} shown
                                </Typography>
                                <Box sx={{ flex: 1 }} />
                                <Button
                                    size="small"
                                    disabled={visibleCategories.length === 0}
                                    onClick={() =>
                                        setSelectedCategoryIds((prev) => {
                                            const next = new Set(prev);
                                            visibleCategories.forEach((c) => next.add(c.id));
                                            return next;
                                        })
                                    }
                                >
                                    Add shown
                                </Button>
                                <Button
                                    size="small"
                                    color="inherit"
                                    disabled={selectedCategoryIds.size === 0}
                                    onClick={() => setSelectedCategoryIds(new Set())}
                                >
                                    Clear
                                </Button>
                            </Box>

                            {categoriesLoading ? (
                                <CircularProgress size={20} />
                            ) : (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, maxHeight: 240, overflowY: 'auto' }}>
                                    {visibleCategories.map((cat) => (
                                        <Chip
                                            key={cat.id}
                                            label={cat.name}
                                            size="small"
                                            onClick={() => toggleCategory(cat.id)}
                                            color={selectedCategoryIds.has(cat.id) ? 'primary' : 'default'}
                                            variant={selectedCategoryIds.has(cat.id) ? 'filled' : 'outlined'}
                                        />
                                    ))}
                                    {visibleCategories.length === 0 && (
                                        <Typography variant="caption" color="text.secondary">
                                            No categories match “{categorySearch}”
                                        </Typography>
                                    )}
                                </Box>
                            )}
                        </Box>
                    )}
                </Box>

                <Divider />

                <Button
                    variant="contained"
                    size="large"
                    onClick={handleGenerate}
                    disabled={!canGenerate || loading}
                    startIcon={loading ? <CircularProgress size={18} color="inherit" /> : undefined}
                >
                    {loading ? 'Placing… (a few minutes for the whole pool)' : 'Place mock businesses'}
                </Button>
                <Button
                    variant="outlined"
                    color="error"
                    onClick={handleRemove}
                    disabled={loading || removing}
                    startIcon={removing ? <CircularProgress size={18} color="inherit" /> : undefined}
                >
                    Remove all mock businesses
                </Button>

                {error && <Alert severity="error">{error}</Alert>}
                {removedNote && <Alert severity="info">{removedNote}</Alert>}

                {result && (
                    <Alert severity={result.failed ? 'warning' : 'success'}>
                        Placed <strong>{result.created}</strong> mock businesses across{' '}
                        <strong>{new Set(result.businesses.map((b) => b.category)).size}</strong> categories
                        {result.removed > 0 && <> (removed {result.removed} earlier ones)</>}
                        {result.failed > 0 && <>; {result.failed} failed — see the server log</>}
                    </Alert>
                )}

                <Divider />

                {/* Reindex — rebuilds derived data after extraction/scoring changes */}
                <Box>
                    <Typography variant="subtitle2" gutterBottom>
                        Maintenance
                    </Typography>
                    <ReindexPanel
                        status={reindex.status}
                        error={reindex.error}
                        onStart={reindex.start}
                        hint="Re-derives translations, categories, matching vectors and parameter values from
                              each description. Run after changing how aspects are extracted or scored."
                    />
                </Box>
            </Paper>

            {/* ── Right panel: map ── */}
            <Box sx={{ flex: 1, borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                <MapContainer
                    center={[DEFAULT_CENTER.lat, DEFAULT_CENTER.lng]}
                    zoom={12}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapClickHandler onPick={handleMapClick} />

                    {/* Center pin + radius circle */}
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

                    {/* Generated business pins */}
                    {result?.businesses.map((b) => (
                        <Marker
                            key={b.id}
                            position={[b.lat, b.lng]}
                            title={`${b.name} (${b.category})`}
                        />
                    ))}
                </MapContainer>
            </Box>
        </Box>
    );
};
