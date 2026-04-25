import React, { useEffect, useState } from 'react';
import {
    Box,
    Button,
    Checkbox,
    CircularProgress,
    Drawer,
    FormControlLabel,
    IconButton,
    Switch,
    TextField,
    Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import {
    updateBusinessUser,
    type IBusinessUser,
    type UpdateAdminBusinessUserDto,
} from '../service/business.api.service';
import { useSnackbar } from '../contexts/SnackbarContext';

export interface BusinessUserEditDrawerProps {
    open: boolean;
    onClose: () => void;
    user: IBusinessUser | null;
    onSaved: (user: IBusinessUser) => void;
}

export const BusinessUserEditDrawer: React.FC<BusinessUserEditDrawerProps> = ({ open, onClose, user, onSaved }) => {
    const { showSuccess, showError } = useSnackbar();
    const [saving, setSaving] = useState(false);
    const [editEmail, setEditEmail] = useState('');
    const [editPassword, setEditPassword] = useState('');
    const [editTelegramId, setEditTelegramId] = useState('');
    const [editTelegramUsername, setEditTelegramUsername] = useState('');
    const [editTelegramFirstName, setEditTelegramFirstName] = useState('');
    const [editTelegramLastName, setEditTelegramLastName] = useState('');
    const [editTelegramLanguageCode, setEditTelegramLanguageCode] = useState('');
    const [editTelegramPhotoUrl, setEditTelegramPhotoUrl] = useState('');
    const [editIsActive, setEditIsActive] = useState(true);
    const [editClearPassword, setEditClearPassword] = useState(false);
    const [editUnsetTelegramId, setEditUnsetTelegramId] = useState(false);

    useEffect(() => {
        if (!open || !user) return;
        setEditEmail(user.email ?? '');
        setEditPassword('');
        setEditTelegramId(user.telegramId != null ? String(user.telegramId) : '');
        setEditTelegramUsername(user.telegramUsername ?? '');
        setEditTelegramFirstName(user.telegramFirstName ?? '');
        setEditTelegramLastName(user.telegramLastName ?? '');
        setEditTelegramLanguageCode(user.telegramLanguageCode ?? '');
        setEditTelegramPhotoUrl(user.telegramPhotoUrl ?? '');
        setEditIsActive(user.isActive);
        setEditClearPassword(false);
        setEditUnsetTelegramId(false);
    }, [open, user]);

    const handleSave = async () => {
        if (!user) return;

        if (editPassword && editPassword.length < 8) {
            showError('Password must be at least 8 characters');
            return;
        }

        const patch: UpdateAdminBusinessUserDto = {
            email: editEmail.trim() ? editEmail.trim() : null,
            telegramUsername: editTelegramUsername.trim() || null,
            telegramFirstName: editTelegramFirstName.trim() || null,
            telegramLastName: editTelegramLastName.trim() || null,
            telegramLanguageCode: editTelegramLanguageCode.trim() || null,
            telegramPhotoUrl: editTelegramPhotoUrl.trim() || null,
            isActive: editIsActive,
        };

        if (editUnsetTelegramId) {
            patch.unsetTelegramId = true;
        } else {
            const tid = editTelegramId.trim();
            if (tid) {
                const n = Number.parseInt(tid, 10);
                if (Number.isFinite(n)) patch.telegramId = n;
            } else if (user.telegramId != null) {
                patch.telegramId = null;
            }
        }

        if (editPassword) patch.password = editPassword;
        if (editClearPassword) patch.clearPassword = true;

        try {
            setSaving(true);
            const updated = await updateBusinessUser(user.id, patch);
            onSaved(updated);
            onClose();
            showSuccess('Business user updated');
        } catch (e) {
            showError(e instanceof Error ? e.message : 'Failed to update business user');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Drawer anchor="right" open={open} onClose={onClose}>
            <Box sx={{ width: 420, maxWidth: '100vw', p: 3, boxSizing: 'border-box' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Edit business user</Typography>
                    <IconButton onClick={onClose} aria-label="Close">
                        <CloseIcon />
                    </IconButton>
                </Box>
                <FormControlLabel
                    control={<Switch checked={editIsActive} onChange={(e) => setEditIsActive(e.target.checked)} />}
                    label="Active"
                    sx={{ mb: 2, display: 'block' }}
                />
                <TextField
                    fullWidth
                    label="Email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    size="small"
                    sx={{ mb: 2 }}
                />
                <TextField
                    fullWidth
                    label="New password"
                    type="password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    size="small"
                    helperText="Min 8 characters; leave empty to keep"
                    sx={{ mb: 1 }}
                />
                <FormControlLabel
                    control={
                        <Checkbox checked={editClearPassword} onChange={(e) => setEditClearPassword(e.target.checked)} />
                    }
                    label="Clear stored password"
                    sx={{ mb: 2 }}
                />
                <TextField
                    fullWidth
                    label="Telegram ID"
                    value={editTelegramId}
                    onChange={(e) => setEditTelegramId(e.target.value)}
                    size="small"
                    disabled={editUnsetTelegramId}
                    sx={{ mb: 1 }}
                />
                <FormControlLabel
                    control={
                        <Checkbox checked={editUnsetTelegramId} onChange={(e) => setEditUnsetTelegramId(e.target.checked)} />
                    }
                    label="Clear Telegram ID"
                    sx={{ mb: 2 }}
                />
                <TextField
                    fullWidth
                    label="Telegram username"
                    value={editTelegramUsername}
                    onChange={(e) => setEditTelegramUsername(e.target.value)}
                    size="small"
                    sx={{ mb: 2 }}
                />
                <TextField
                    fullWidth
                    label="Telegram first name"
                    value={editTelegramFirstName}
                    onChange={(e) => setEditTelegramFirstName(e.target.value)}
                    size="small"
                    sx={{ mb: 2 }}
                />
                <TextField
                    fullWidth
                    label="Telegram last name"
                    value={editTelegramLastName}
                    onChange={(e) => setEditTelegramLastName(e.target.value)}
                    size="small"
                    sx={{ mb: 2 }}
                />
                <TextField
                    fullWidth
                    label="Telegram language code"
                    value={editTelegramLanguageCode}
                    onChange={(e) => setEditTelegramLanguageCode(e.target.value)}
                    size="small"
                    sx={{ mb: 2 }}
                />
                <TextField
                    fullWidth
                    label="Telegram photo URL"
                    value={editTelegramPhotoUrl}
                    onChange={(e) => setEditTelegramPhotoUrl(e.target.value)}
                    size="small"
                    sx={{ mb: 2 }}
                />
                <Button variant="contained" fullWidth onClick={() => void handleSave()} disabled={saving || !user}>
                    {saving ? <CircularProgress size={22} /> : 'Save changes'}
                </Button>
            </Box>
        </Drawer>
    );
};
