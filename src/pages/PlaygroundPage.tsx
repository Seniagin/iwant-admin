import React, { useState, useCallback, useEffect } from 'react';
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    Divider,
    FormControlLabel,
    MenuItem,
    Paper,
    Slider,
    Switch,
    TextField,
    Typography,
    Alert,
} from '@mui/material';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet';
import { generateMockBusinesses, MockBusinessResult } from '../service/mock.api.service';
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

export const PlaygroundPage: React.FC = () => {
    const [center, setCenter] = useState<MapCenter | null>(null);
    const [radiusKm, setRadiusKm] = useState<number>(5);
    const [minPerCategory, setMinPerCategory] = useState<number>(1);
    const [maxPerCategory, setMaxPerCategory] = useState<number>(3);
    const [locale, setLocale] = useState<'' | 'en' | 'ru' | 'uk'>('');
    const [allCategories, setAllCategories] = useState<ICategoryWithCount[]>([]);
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(new Set());
    const [useAllCategories, setUseAllCategories] = useState(false);
    const [categorySearch, setCategorySearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [result, setResult] = useState<{ created: number; businesses: MockBusinessResult[] } | null>(null);
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
        try {
            const res = await generateMockBusinesses({
                centerLat: center.lat,
                centerLng: center.lng,
                radiusKm,
                minPerCategory,
                maxPerCategory,
                categoryIds: useAllCategories ? [] : Array.from(selectedCategoryIds),
                locale: locale || undefined,
            });
            setResult(res);
        } catch (e: any) {
            setError(e.message ?? 'Generation failed');
        } finally {
            setLoading(false);
        }
    };

    const canGenerate =
        !!center && minPerCategory <= maxPerCategory && (useAllCategories || selectedCategoryIds.size > 0);

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
                    Click the map to set the center point, configure options, then generate mock businesses.
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

                {/* Businesses per category */}
                <Box>
                    <Typography variant="subtitle2" gutterBottom>
                        Businesses per category
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                        <TextField
                            label="Min"
                            type="number"
                            size="small"
                            value={minPerCategory}
                            onChange={(e) => setMinPerCategory(Math.max(0, Number(e.target.value)))}
                            inputProps={{ min: 0 }}
                            sx={{ width: 80 }}
                        />
                        <TextField
                            label="Max"
                            type="number"
                            size="small"
                            value={maxPerCategory}
                            onChange={(e) => setMaxPerCategory(Math.max(0, Number(e.target.value)))}
                            inputProps={{ min: 0 }}
                            sx={{ width: 80 }}
                        />
                    </Box>
                    {minPerCategory > maxPerCategory && (
                        <Typography variant="caption" color="error">
                            Min must be ≤ max
                        </Typography>
                    )}
                </Box>

                {/* Description language */}
                <Box>
                    <TextField
                        select
                        label="Description language"
                        size="small"
                        fullWidth
                        value={locale}
                        onChange={(e) => setLocale(e.target.value as typeof locale)}
                    >
                        <MenuItem value="">Mixed (random per business)</MenuItem>
                        <MenuItem value="en">English</MenuItem>
                        <MenuItem value="ru">Русский</MenuItem>
                        <MenuItem value="uk">Українська</MenuItem>
                    </TextField>
                </Box>

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
                    {useAllCategories && (
                        <Typography variant="caption" color="warning.main" display="block">
                            Each generated business costs an OpenAI call — pick specific categories to keep it cheap.
                        </Typography>
                    )}

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
                    {loading ? 'Generating…' : 'Generate businesses'}
                </Button>

                {error && <Alert severity="error">{error}</Alert>}

                {result && (
                    <Alert severity="success">
                        Created <strong>{result.created}</strong> mock businesses across{' '}
                        <strong>{new Set(result.businesses.map((b) => b.category)).size}</strong> categories
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
