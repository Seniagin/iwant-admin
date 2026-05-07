import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Alert,
    CircularProgress,
    IconButton,
    Tooltip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import { MapContainer, TileLayer, Marker, Circle, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { getBusinessesByCategoryAndLocation, type IBusiness } from '../service/business.api.service';
import '../setupLeafletDefaultIcons';

// Blue icon for the center pin, distinct from the orange business markers
const centerIcon = new L.Icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

const businessIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
    iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

function MapClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
    useMapEvents({
        click: (e) => onPick(e.latlng.lat, e.latlng.lng),
    });
    return null;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const DEFAULT_LAT = 50.4501;
const DEFAULT_LNG = 30.5234;
const DEFAULT_RADIUS_KM = 10;

export const CategoryBusinessesPage: React.FC = () => {
    const { categoryId } = useParams<{ categoryId: string }>();
    const routerLocation = useLocation();
    const navigate = useNavigate();

    type RouteState = { categoryName?: string; latitude?: number; longitude?: number } | null;
    const routeState = routerLocation.state as RouteState;
    const categoryName: string = routeState?.categoryName ?? categoryId ?? '';
    const demandLat = routeState?.latitude;
    const demandLng = routeState?.longitude;

    const [center, setCenter] = useState<{ lat: number; lng: number }>({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
    const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM);
    const [radiusInput, setRadiusInput] = useState(String(DEFAULT_RADIUS_KM));
    const [businesses, setBusinesses] = useState<IBusiness[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [locationReady, setLocationReady] = useState(false);

    // If demand location was passed, use it directly; otherwise fall back to browser geolocation
    useEffect(() => {
        if (demandLat != null && demandLng != null && !isNaN(demandLat) && !isNaN(demandLng)) {
            setCenter({ lat: demandLat, lng: demandLng });
            setLocationReady(true);
            return;
        }
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                    setLocationReady(true);
                },
                () => setLocationReady(true),
            );
        } else {
            setLocationReady(true);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchRef = useRef(0);

    const fetchBusinesses = useCallback(async () => {
        if (!categoryId) return;
        const token = ++fetchRef.current;
        setIsLoading(true);
        setError(null);
        try {
            const data = await getBusinessesByCategoryAndLocation(categoryId, center.lat, center.lng, radiusKm);
            if (token === fetchRef.current) setBusinesses(data);
        } catch {
            if (token === fetchRef.current) setError('Failed to fetch businesses');
        } finally {
            if (token === fetchRef.current) setIsLoading(false);
        }
    }, [categoryId, center, radiusKm]);

    useEffect(() => {
        if (locationReady) fetchBusinesses();
    }, [fetchBusinesses, locationReady]);

    const handleMapClick = useCallback((lat: number, lng: number) => {
        setCenter({ lat, lng });
    }, []);

    const handleRadiusBlur = () => {
        const v = parseFloat(radiusInput);
        if (Number.isFinite(v) && v > 0) {
            setRadiusKm(v);
        } else {
            setRadiusInput(String(radiusKm));
        }
    };

    const handleLocateMe = () => {
        navigator.geolocation?.getCurrentPosition((pos) => {
            setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        });
    };

    return (
        <Box sx={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', px: { xs: 2, sm: 2.5, md: 3 }, py: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <IconButton onClick={() => navigate('/categories')} size="small">
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h5" component="h1">
                    Businesses — <strong>{categoryName}</strong>
                </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Click on the map to set the search center. Adjust the radius to change the coverage area.
            </Typography>

            {/* Controls */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                <TextField
                    label="Radius (km)"
                    type="number"
                    size="small"
                    value={radiusInput}
                    onChange={(e) => setRadiusInput(e.target.value)}
                    onBlur={handleRadiusBlur}
                    onKeyDown={(e) => e.key === 'Enter' && handleRadiusBlur()}
                    inputProps={{ min: 0.1, step: 1 }}
                    sx={{ width: 140 }}
                />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                        Center: {center.lat.toFixed(5)}, {center.lng.toFixed(5)}
                    </Typography>
                    <Tooltip title="Use my location">
                        <IconButton size="small" onClick={handleLocateMe}>
                            <MyLocationIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
                {!isLoading && (
                    <Chip
                        label={`${businesses.length} business${businesses.length !== 1 ? 'es' : ''}`}
                        color={businesses.length === 0 ? 'default' : 'primary'}
                        size="small"
                        sx={{ alignSelf: 'center' }}
                    />
                )}
                {isLoading && <CircularProgress size={20} sx={{ alignSelf: 'center' }} />}
            </Box>

            {/* Map */}
            {locationReady && (
                <Box
                    sx={{
                        height: 450,
                        width: '100%',
                        borderRadius: 1,
                        overflow: 'hidden',
                        border: '1px solid',
                        borderColor: 'divider',
                        mb: 3,
                    }}
                >
                    <MapContainer
                        center={[center.lat, center.lng]}
                        zoom={11}
                        style={{ height: '100%', width: '100%' }}
                        scrollWheelZoom
                        key={`${DEFAULT_LAT}-${DEFAULT_LNG}`}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <MapClickHandler onPick={handleMapClick} />

                        {/* Search area circle */}
                        <Circle
                            center={[center.lat, center.lng]}
                            radius={radiusKm * 1000}
                            pathOptions={{ color: '#1976d2', fillColor: '#1976d2', fillOpacity: 0.08, weight: 2 }}
                        />

                        {/* Center pin */}
                        <Marker position={[center.lat, center.lng]} icon={centerIcon}>
                            <Popup>Search center</Popup>
                        </Marker>

                        {/* Business markers */}
                        {businesses.map((b) =>
                            b.location ? (
                                <Marker
                                    key={b.id}
                                    position={[b.location.latitude, b.location.longitude]}
                                    icon={businessIcon}
                                >
                                    <Popup>
                                        <strong>{b.name}</strong>
                                        {b.contacts?.address && (
                                            <><br />{b.contacts.address}</>
                                        )}
                                        <br />
                                        {haversineKm(center.lat, center.lng, b.location.latitude, b.location.longitude).toFixed(1)} km away
                                    </Popup>
                                </Marker>
                            ) : null,
                        )}
                    </MapContainer>
                </Box>
            )}

            {/* Error */}
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {/* Results table */}
            {!error && businesses.length > 0 && (
                <TableContainer component={Paper}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Name</TableCell>
                                <TableCell>Address</TableCell>
                                <TableCell align="right">Distance</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {businesses
                                .map((b) => ({
                                    b,
                                    dist: b.location
                                        ? haversineKm(center.lat, center.lng, b.location.latitude, b.location.longitude)
                                        : Infinity,
                                }))
                                .sort((a, z) => a.dist - z.dist)
                                .map(({ b, dist }) => (
                                    <TableRow key={b.id} hover>
                                        <TableCell>{b.name}</TableCell>
                                        <TableCell sx={{ color: 'text.secondary' }}>
                                            {b.contacts?.address ?? '—'}
                                        </TableCell>
                                        <TableCell align="right">
                                            {dist < Infinity ? `${dist.toFixed(1)} km` : '—'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {!error && !isLoading && businesses.length === 0 && locationReady && (
                <Alert severity="info">No businesses found in this category within {radiusKm} km of the selected point.</Alert>
            )}
        </Box>
    );
};
