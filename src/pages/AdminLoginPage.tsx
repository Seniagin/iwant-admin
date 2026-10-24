import React, { useState } from 'react';
import { Alert, Box, Button, CircularProgress, Paper, TextField, Typography } from '@mui/material';
import { adminLogin } from '../auth/adminSession';

/** Shown instead of the whole app until there is an admin session. */
export const AdminLoginPage: React.FC<{ onSignedIn: () => void }> = ({ onSignedIn }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setBusy(true);
        setError('');
        try {
            await adminLogin(email.trim(), password);
            onSignedIn();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Sign-in failed');
        } finally {
            setBusy(false);
        }
    };

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2, bgcolor: '#f4f5f4' }}>
            <Paper component="form" onSubmit={submit} variant="outlined" sx={{ p: 4, width: '100%', maxWidth: 380 }}>
                <Typography variant="h5" component="h1" gutterBottom color="text.primary">
                    iWant admin
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Sign in with an admin account.
                </Typography>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    sx={{ mb: 2 }}
                    required
                />
                <TextField
                    fullWidth
                    label="Password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    sx={{ mb: 3 }}
                    required
                />
                <Button type="submit" variant="contained" fullWidth disabled={busy}>
                    {busy ? <CircularProgress size={22} /> : 'Sign in'}
                </Button>
            </Paper>
        </Box>
    );
};
