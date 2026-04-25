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
import { useNavigate } from 'react-router-dom';
import { createBusinessUser, type CreateAdminBusinessUserDto } from '../service/business.api.service';
import { useSnackbar } from '../contexts/SnackbarContext';

function buildPayload(params: {
    email: string;
    password: string;
    telegramId: string;
    telegramUsername: string;
    telegramFirstName: string;
    telegramLastName: string;
    telegramLanguageCode: string;
    telegramPhotoUrl: string;
    isActive: boolean;
}): CreateAdminBusinessUserDto {
    const body: CreateAdminBusinessUserDto = { isActive: params.isActive };
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
    return body;
}

export const BusinessUserCreatePage: React.FC = () => {
    const navigate = useNavigate();
    const { showSuccess, showError } = useSnackbar();
    const [submitting, setSubmitting] = useState(false);
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
        if (password && password.length < 8) {
            showError('Password must be at least 8 characters when set');
            return;
        }
        try {
            setSubmitting(true);
            const body = buildPayload({
                email,
                password,
                telegramId,
                telegramUsername,
                telegramFirstName,
                telegramLastName,
                telegramLanguageCode,
                telegramPhotoUrl,
                isActive,
            });
            const created = await createBusinessUser(body);
            showSuccess('Business user created');
            navigate(`/business-users/${created.id}`);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to create business user';
            showError(msg);
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
                <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/business-users')} sx={{ mb: 2 }}>
                    Back to business users
                </Button>
                <Typography variant="h4" component="h1" gutterBottom>
                    Create business user
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Manual business portal account. All fields optional except password must be at least 8 characters
                    when set.
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
                        helperText="Min 8 characters when set"
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
                    <Button type="submit" variant="contained" disabled={submitting} fullWidth>
                        {submitting ? <CircularProgress size={24} /> : 'Create business user'}
                    </Button>
                </Paper>
            </Box>
        </Box>
    );
};
