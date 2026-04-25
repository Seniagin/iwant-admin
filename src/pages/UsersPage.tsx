import React, { useEffect, useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Box,
    Typography,
    Alert,
    CircularProgress,
    Chip,
    Button,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { listUsers, type AdminUserListItemResponseDto } from '../service/users.api.service';

function displayLabel(user: AdminUserListItemResponseDto): string {
    const name = [user.telegramFirstName, user.telegramLastName].filter(Boolean).join(' ').trim();
    if (name) return name;
    if (user.telegramUsername) return `@${user.telegramUsername}`;
    if (user.email) return user.email;
    return '—';
}

export const UsersPage: React.FC = () => {
    const [users, setUsers] = useState<AdminUserListItemResponseDto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const formatDate = (dateString: string) => {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(dateString));
    };

    useEffect(() => {
        const load = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const data = await listUsers();
                setUsers(data);
            } catch {
                setError('Failed to fetch users');
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

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
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 1 }}>
                <Typography variant="h4" component="h2">
                    Users
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/users/new')}>
                    Create user
                </Button>
            </Box>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
                Client accounts
            </Typography>

            {isLoading ? (
                <Box display="flex" justifyContent="center" my={4}>
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Alert severity="error" sx={{ maxWidth: 800, mx: 'auto' }}>
                    {error}
                </Alert>
            ) : (
                <TableContainer component={Paper} sx={{ width: '100%' }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Display</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Telegram ID</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Created</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id} hover>
                                    <TableCell component="th" scope="row" sx={{ fontFamily: 'monospace' }}>
                                        {user.id}
                                    </TableCell>
                                    <TableCell>{displayLabel(user)}</TableCell>
                                    <TableCell>{user.email ?? '—'}</TableCell>
                                    <TableCell sx={{ fontFamily: 'monospace' }}>
                                        {user.telegramId ?? '—'}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={user.isActive ? 'Active' : 'Inactive'}
                                            color={user.isActive ? 'success' : 'default'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                                    <TableCell align="right">
                                        <Button
                                            variant="outlined"
                                            color="primary"
                                            size="small"
                                            startIcon={<VisibilityIcon />}
                                            onClick={() => navigate(`/users/${user.id}`)}
                                        >
                                            Details
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {!isLoading && !error && users.length === 0 && (
                <Typography variant="body1" color="text.secondary" align="center" sx={{ my: 4 }}>
                    No users found
                </Typography>
            )}
        </Box>
    );
};
