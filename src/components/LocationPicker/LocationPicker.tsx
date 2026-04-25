import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import type { Location } from '../../types/location';
import '../../setupLeafletDefaultIcons';
import './LocationPicker.css';

function MapClickHandler({ onMapPick }: { onMapPick: (location: Location) => void }) {
    useMapEvents({
        click: (e) => {
            const { lat, lng } = e.latlng;
            onMapPick({
                latitude: lat,
                longitude: lng,
            });
        },
    });
    return null;
}

interface LocationPickerProps {
    initialLocation?: Location | null;
    onLocationSelect: (location: Location | null) => void;
    onClose: () => void;
}

const LocationPicker: React.FC<LocationPickerProps> = ({ initialLocation, onLocationSelect, onClose }) => {
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(initialLocation ?? null);
    const [mapCenter, setMapCenter] = useState<[number, number]>([50.4501, 30.5234]);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setMapCenter([latitude, longitude]);
                    if (!initialLocation) {
                        setSelectedLocation({
                            latitude,
                            longitude,
                        });
                    }
                },
                () => {
                    if (initialLocation) {
                        setMapCenter([initialLocation.latitude, initialLocation.longitude]);
                    }
                }
            );
        } else if (initialLocation) {
            setMapCenter([initialLocation.latitude, initialLocation.longitude]);
        }
    }, [initialLocation]);

    const handleMapPick = (location: Location) => {
        setSelectedLocation(location);
    };

    const handleClear = () => {
        setSelectedLocation(null);
        onLocationSelect(null);
    };

    const handleSet = () => {
        if (!selectedLocation) return;
        onLocationSelect({
            latitude: selectedLocation.latitude,
            longitude: selectedLocation.longitude,
        });
        onClose();
    };

    return (
        <div className="location-picker-overlay">
            <div className="location-picker-modal">
                <div className="location-picker-header">
                    <h3>Select Location</h3>
                    <button type="button" className="close-button" onClick={onClose} aria-label="Close">
                        ×
                    </button>
                </div>

                <div className="location-picker-map-container">
                    <MapContainer
                        center={mapCenter}
                        zoom={13}
                        style={{ height: '100%', width: '100%' }}
                        scrollWheelZoom
                        key={`${mapCenter[0]}-${mapCenter[1]}`}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {selectedLocation && (
                            <Marker position={[selectedLocation.latitude, selectedLocation.longitude]} />
                        )}
                        <MapClickHandler onMapPick={handleMapPick} />
                    </MapContainer>
                </div>

                <div className="location-picker-info">
                    {selectedLocation ? (
                        <div className="location-info">
                            <p>
                                <strong>Latitude:</strong> {selectedLocation.latitude.toFixed(6)}
                            </p>
                            <p>
                                <strong>Longitude:</strong> {selectedLocation.longitude.toFixed(6)}
                            </p>
                        </div>
                    ) : (
                        <p className="location-hint">Tap the map to place a pin</p>
                    )}
                </div>

                <div className="location-picker-actions">
                    <button type="button" className="btn btn-secondary" onClick={handleClear} disabled={!selectedLocation}>
                        Clear
                    </button>
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleSet}
                        disabled={!selectedLocation}
                        style={{
                            opacity: selectedLocation ? 1 : 0.5,
                            cursor: selectedLocation ? 'pointer' : 'not-allowed',
                        }}
                    >
                        Set Location
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LocationPicker;

export function LocationMapPreview({
    location,
    height = 280,
}: {
    location: Location | null;
    height?: number;
}) {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!location) {
        return (
            <Typography variant="body2" color="text.secondary">
                No location
            </Typography>
        );
    }

    const { latitude, longitude } = location;
    if (
        Number.isNaN(latitude) ||
        Number.isNaN(longitude) ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
    ) {
        return (
            <Typography variant="body2" color="error">
                Invalid coordinates
            </Typography>
        );
    }

    if (!isClient) {
        return (
            <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress size={28} />
            </Box>
        );
    }

    return (
        <Box
            sx={{
                height,
                width: '100%',
                borderRadius: 1,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'divider',
            }}
        >
            <MapContainer
                center={[latitude, longitude]}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[latitude, longitude]} />
            </MapContainer>
        </Box>
    );
}
