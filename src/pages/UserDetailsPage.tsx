import React, { useCallback, useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Alert,
    CircularProgress,
    Chip,
    Button,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import { useParams, useNavigate } from 'react-router-dom';
import { getUserDetail, type AdminUserDetailResponseDto } from '../service/users.api.service';
import { UserEditDrawer } from '../components/UserEditDrawer';
import { UserProfileDetailsSection } from '../components/UserProfileDetailsSection';
import { UserDemandsPanel } from '../components/UserDemandsPanel';

function displayName(user: AdminUserDetailResponseDto): string {
    const name = [user.telegramFirstName, user.telegramLastName].filter(Boolean).join(' ').trim();
    if (name) return name;
    if (user.telegramUsername) return `@${user.telegramUsername}`;
    if (user.email) return user.email;
    return `User #${user.id}`;
}

export const UserDetailsPage: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const [user, setUser] = useState<AdminUserDetailResponseDto | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editOpen, setEditOpen] = useState(false);

    const loadUser = async (id: number) => {
        const data = await getUserDetail(id);
        setUser(data);
    };

    useEffect(() => {
        const id = userId ? Number.parseInt(userId, 10) : NaN;
        if (!Number.isFinite(id)) {
            setError('Invalid user id');
            setIsLoading(false);
            return;
        }

        const run = async () => {
            try {
                setIsLoading(true);
                setError(null);
                await loadUser(id);
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Failed to load user');
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };
        run();
    }, [userId]);

    const refreshUser = useCallback(async () => {
        const id = userId ? Number.parseInt(userId, 10) : NaN;
        if (Number.isFinite(id)) await loadUser(id);
    }, [userId]);

    const handleBack = () => navigate('/users');

    if (isLoading) {
        return (
            <Box sx={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', px: { xs: 2, sm: 2.5, md: 3 }, py: 3 }}>
                <Box display="flex" justifyContent="center" my={4}>
                    <CircularProgress />
                </Box>
            </Box>
        );
    }

    if (error || !user) {
        return (
            <Box sx={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', px: { xs: 2, sm: 2.5, md: 3 }, py: 3 }}>
                <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mb: 2 }}>
                    Back to users
                </Button>
                <Alert severity={error === 'User not found' ? 'warning' : 'error'}>
                    {error || 'User not found'}
                </Alert>
            </Box>
        );
    }

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
            <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mb: 2 }}>
                Back to users
            </Button>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, mb: 1 }}>
                <Typography variant="h4" component="h1">
                    {displayName(user)}
                </Typography>
                <Chip label={user.isActive ? 'Active' : 'Inactive'} color={user.isActive ? 'success' : 'default'} />
                <Chip label={`${user.demandsCount} demands`} variant="outlined" />
                <Button variant="contained" startIcon={<EditIcon />} onClick={() => setEditOpen(true)}>
                    Edit user
                </Button>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                User ID {user.id}
            </Typography>

            <Box
                sx={{
                    display: 'grid',
                    gap: 3,
                    alignItems: 'start',
                    gridTemplateColumns: { xs: '1fr', lg: 'minmax(280px, 400px) minmax(0, 1fr)' },
                }}
            >
                <UserProfileDetailsSection user={user} />
                <UserDemandsPanel
                    key={user.id}
                    userId={user.id}
                    userDisplayLabel={displayName(user)}
                    onUserProfileRefresh={refreshUser}
                />
            </Box>

            <UserEditDrawer
                open={editOpen}
                onClose={() => setEditOpen(false)}
                user={user}
                onSaved={setUser}
            />
        </Box>
    );
};
