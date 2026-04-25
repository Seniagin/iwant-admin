import React, { useState } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    FormControlLabel,
    Switch,
    Paper,
    CircularProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MapIcon from '@mui/icons-material/Map';
import { useNavigate } from 'react-router-dom';
import { createUser, type CreateAdminUserDto } from '../service/users.api.service';
import { useSnackbar } from '../contexts/SnackbarContext';
import type { Location } from '../types/location';
import LocationPicker, { LocationMapPreview } from '../components/LocationPicker/LocationPicker';

function buildCreatePayload(params: {
    email: string;
    password: string;
    telegramId: string;
    telegramUsername: string;
    telegramFirstName: string;
    telegramLastName: string;
    telegramLanguageCode: string;
    telegramPhotoUrl: string;
    isActive: boolean;
    pickedLocation: Location | null;
}): CreateAdminUserDto {
    const body: CreateAdminUserDto = {
        isActive: params.isActive,
    };
    const e = params.email.trim();
    if (e) body.email = e;
    if (params.password) body.password = params.password;
    const tid = params.telegramId.trim();
    if (tid) {
        const n = Number.parseInt(tid, 10);
        if (Number.isFinite(n)) body.telegramId = n;
    }
    const tu = params.telegramUsername.trim();
    if (tu) body.telegramUsername = tu;
    const tfn = params.telegramFirstName.trim();
    if (tfn) body.telegramFirstName = tfn;
    const tln = params.telegramLastName.trim();
    if (tln) body.telegramLastName = tln;
    const tlc = params.telegramLanguageCode.trim();
    if (tlc) body.telegramLanguageCode = tlc;
    const tpu = params.telegramPhotoUrl.trim();
    if (tpu) body.telegramPhotoUrl = tpu;
    if (params.pickedLocation) {
        body.latitude = params.pickedLocation.latitude;
        body.longitude = params.pickedLocation.longitude;
    }
    return body;
}

export const UserCreatePage: React.FC = () => {
    const navigate = useNavigate();
    const { showSuccess, showError } = useSnackbar();
    const [submitting, setSubmitting] = useState(false);
    const [locationPickerOpen, setLocationPickerOpen] = useState(false);
    const [pickedLocation, setPickedLocation] = useState<Location | null>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [telegramId, setTelegramId] = useState('');
    const [telegramUsername, setTelegramUsername] = useState('');
    const [telegramFirstName, setTelegramFirstName] = useState('');
    const [telegramLastName, setTelegramLastName] = useState('');
    const [telegramLanguageCode, setTelegramLanguageCode] = useState('');
    const [telegramPhotoUrl, setTelegramPhotoUrl] = useState('');
    const [isActive, setIsActive] = useState(true);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            const body = buildCreatePayload({
                email,
                password,
                telegramId,
                telegramUsername,
                telegramFirstName,
                telegramLastName,
                telegramLanguageCode,
                telegramPhotoUrl,
                isActive,
                pickedLocation,
            });
            const created = await createUser(body);
            showSuccess('User created');
            navigate(`/users/${created.id}`);
        } catch {
            showError('Failed to create user');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Box
            sx={{
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box',
                px: { xs: 2, sm: 2.5, md: 3 },
                py: 3,
            }}
        >
            <Box sx={{ maxWidth: 560, mx: 'auto' }}>
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/users')} sx={{ mb: 2 }}>
                Back to users
            </Button>
            <Typography variant="h4" component="h1" gutterBottom>
                Create user
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Manual client user. All fields optional; location defaults on the server unless set on the map.
            </Typography>

            <Paper component="form" variant="outlined" onSubmit={handleSubmit} sx={{ p: 3 }}>
                <FormControlLabel
                    control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />}
                    label="Active"
                    sx={{ mb: 2, display: 'block' }}
                />
                <TextField
                    fullWidth
                    label="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    size="small"
                    sx={{ mb: 2 }}
                />
                <TextField
                    fullWidth
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    size="small"
                    helperText="Stored hashed when set"
                    sx={{ mb: 2 }}
                />
                <TextField
                    fullWidth
                    label="Telegram ID"
                    value={telegramId}
                    onChange={(e) => setTelegramId(e.target.value)}
                    size="small"
                    sx={{ mb: 2 }}
                />
                <TextField
                    fullWidth
                    label="Telegram username"
                    value={telegramUsername}
                    onChange={(e) => setTelegramUsername(e.target.value)}
                    size="small"
                    sx={{ mb: 2 }}
                />
                <TextField
                    fullWidth
                    label="Telegram first name"
                    value={telegramFirstName}
                    onChange={(e) => setTelegramFirstName(e.target.value)}
                    size="small"
                    sx={{ mb: 2 }}
                />
                <TextField
                    fullWidth
                    label="Telegram last name"
                    value={telegramLastName}
                    onChange={(e) => setTelegramLastName(e.target.value)}
                    size="small"
                    sx={{ mb: 2 }}
                />
                <TextField
                    fullWidth
                    label="Telegram language code"
                    value={telegramLanguageCode}
                    onChange={(e) => setTelegramLanguageCode(e.target.value)}
                    size="small"
                    sx={{ mb: 2 }}
                />
                <TextField
                    fullWidth
                    label="Telegram photo URL"
                    value={telegramPhotoUrl}
                    onChange={(e) => setTelegramPhotoUrl(e.target.value)}
                    size="small"
                    sx={{ mb: 2 }}
                />

                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Location
                </Typography>
                <LocationMapPreview location={pickedLocation} height={220} />
                <Button
                    type="button"
                    variant="outlined"
                    startIcon={<MapIcon />}
                    onClick={() => setLocationPickerOpen(true)}
                    fullWidth
                    sx={{ mt: 1, mb: 2 }}
                >
                    Choose on map
                </Button>

                <Button type="submit" variant="contained" disabled={submitting} fullWidth>
                    {submitting ? <CircularProgress size={24} /> : 'Create user'}
                </Button>
            </Paper>

            {locationPickerOpen && (
                <LocationPicker
                    initialLocation={pickedLocation}
                    onLocationSelect={(loc) => setPickedLocation(loc)}
                    onClose={() => setLocationPickerOpen(false)}
                />
            )}
            </Box>
        </Box>
    );
};
