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
    const [editLanguageCode, setEditLanguageCode] = useState('');
    const [editIsActive, setEditIsActive] = useState(true);
    const [editClearPassword, setEditClearPassword] = useState(false);

    useEffect(() => {
        if (!open || !user) return;
        setEditEmail(user.email ?? '');
        setEditPassword('');
        setEditLanguageCode(user.languageCode ?? '');
        setEditIsActive(user.isActive);
        setEditClearPassword(false);
    }, [open, user]);

    const handleSave = async () => {
        if (!user) return;

        if (editPassword && editPassword.length < 8) {
            showError('Password must be at least 8 characters');
            return;
        }

        const patch: UpdateAdminBusinessUserDto = {
            email: editEmail.trim() ? editEmail.trim() : null,
            languageCode: editLanguageCode.trim() || null,
            isActive: editIsActive,
        };

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
                    label="Language code"
                    value={editLanguageCode}
                    onChange={(e) => setEditLanguageCode(e.target.value)}
                    size="small"
                    helperText="e.g. en, ru, uk"
                    sx={{ mb: 2 }}
                />
                <Button variant="contained" fullWidth onClick={() => void handleSave()} disabled={saving || !user}>
                    {saving ? <CircularProgress size={22} /> : 'Save changes'}
                </Button>
            </Box>
        </Drawer>
    );
};
