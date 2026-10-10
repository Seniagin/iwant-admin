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
    languageCode: string;
    isActive: boolean;
}): CreateAdminBusinessUserDto {
    const body: CreateAdminBusinessUserDto = { isActive: params.isActive };
    const e = params.email.trim();
    if (e) body.email = e;
    if (params.password) body.password = params.password;
    const lc = params.languageCode.trim();
    if (lc) body.languageCode = lc;
    return body;
}

export const BusinessUserCreatePage: React.FC = () => {
    const navigate = useNavigate();
    const { showSuccess, showError } = useSnackbar();
    const [submitting, setSubmitting] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [languageCode, setLanguageCode] = useState('');
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
                languageCode,
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
                        label="Language code"
                        value={languageCode}
                        onChange={(e) => setLanguageCode(e.target.value)}
                        size="small"
                        helperText="e.g. en, ru, uk"
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
