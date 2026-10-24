import React, { useEffect, useMemo, useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.css';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.Default.css';
import L from 'leaflet';
import { getBusinessesForMap, type IBusinessMapMarker } from '../service/business.api.service';
import '../setupLeafletDefaultIcons';

const DEFAULT_CENTER: [number, number] = [39.466667, -0.375]; // Valencia

/** Frames all markers once they load, instead of a hard-coded city view. */
const FitToMarkers: React.FC<{ markers: IBusinessMapMarker[] }> = ({ markers }) => {
    const map = useMap();
    useEffect(() => {
        if (markers.length === 0) return;
        const bounds = L.latLngBounds(markers.map((m) => [m.location.latitude, m.location.longitude]));
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
    }, [map, markers]);
    return null;
};

const HoverCard: React.FC<{ b: IBusinessMapMarker }> = ({ b }) => (
    <Box sx={{ width: 260, display: 'flex', flexDirection: 'column', gap: 0.75, whiteSpace: 'normal' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {b.logoUrl && (
                <Box
                    component="img"
                    src={b.logoUrl}
                    alt=""
                    sx={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, bgcolor: '#f1f5f9' }}
                />
            )}
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#0f172a', lineHeight: 1.25 }}>
                {b.name}
            </Typography>
        </Box>
        {b.categories.length > 0 && (
            <Typography sx={{ fontSize: 11, color: '#6366f1', fontWeight: 600 }}>
                {b.categories.slice(0, 3).join(' · ')}
                {b.categories.length > 3 ? ` +${b.categories.length - 3}` : ''}
            </Typography>
        )}
        {b.description && (
            <Typography sx={{ fontSize: 12, color: '#475569', lineHeight: 1.4 }}>
                {b.description.replace(/\*\*/g, '').slice(0, 160)}
                {b.description.length > 160 ? '…' : ''}
            </Typography>
        )}
        <Typography sx={{ fontSize: 11, color: '#94a3b8' }}>
            {b.userId ? 'Claimed' : 'Unclaimed'} · added {new Date(b.createdAt).toLocaleDateString('ru-RU')}
        </Typography>
    </Box>
);

/**
 * Every business with a location, clustered like the import page map. Hover a
 * marker for a summary card; click it to open the business.
 */
export const BusinessesMap: React.FC<{ onOpen(b: IBusinessMapMarker): void; reloadKey?: number }> = ({
    onOpen,
    reloadKey,
}) => {
    const [markers, setMarkers] = useState<IBusinessMapMarker[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getBusinessesForMap()
            .then(setMarkers)
            .catch(() => setError('Failed to load map'));
    }, [reloadKey]);

    const markerEls = useMemo(
        () =>
            (markers ?? []).map((b) => (
                <Marker
                    key={b.id}
                    position={[b.location.latitude, b.location.longitude]}
                    eventHandlers={{ click: () => onOpen(b) }}
                >
                    <Tooltip direction="top" offset={[0, -32]} opacity={1}>
                        <HoverCard b={b} />
                    </Tooltip>
                </Marker>
            )),
        [markers, onOpen],
    );

    return (
        <Box sx={{ position: 'relative', height: 420 }}>
            {!markers && !error && (
                <Box sx={{ position: 'absolute', inset: 0, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(255,255,255,0.6)' }}>
                    <CircularProgress size={28} />
                </Box>
            )}
            {error && (
                <Typography sx={{ position: 'absolute', top: 12, left: 12, zIndex: 500, fontSize: 13, color: '#ef4444', bgcolor: '#fff', px: 1, borderRadius: 1 }}>
                    {error}
                </Typography>
            )}
            <MapContainer center={DEFAULT_CENTER} zoom={12} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <FitToMarkers markers={markers ?? []} />
                <MarkerClusterGroup chunkedLoading maxClusterRadius={50}>
                    {markerEls}
                </MarkerClusterGroup>
            </MapContainer>
        </Box>
    );
};
