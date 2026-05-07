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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { listUsers, deleteUser, type AdminUserListItemResponseDto } from '../service/users.api.service';

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
    const [userToDelete, setUserToDelete] = useState<AdminUserListItemResponseDto | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
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

    useEffect(() => { load(); }, []);

    const handleDeleteConfirm = async () => {
        if (!userToDelete) return;
        try {
            setIsDeleting(true);
            await deleteUser(userToDelete.id);
            setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
            setUserToDelete(null);
        } catch {
            setError('Failed to delete user. Please try again.');
            setUserToDelete(null);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Box sx={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', px: { xs: 2, sm: 2.5, md: 3 }, py: 3 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 1 }}>
                <Typography variant="h4" component="h2">Users</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/users/new')}>
                    Create user
                </Button>
            </Box>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
                Client accounts
            </Typography>

            {isLoading ? (
                <Box display="flex" justifyContent="center" my={4}><CircularProgress /></Box>
            ) : error ? (
                <Alert severity="error" sx={{ maxWidth: 800, mx: 'auto' }}>{error}</Alert>
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
                                    <TableCell sx={{ fontFamily: 'monospace' }}>{user.telegramId ?? '—'}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={user.isActive ? 'Active' : 'Inactive'}
                                            color={user.isActive ? 'success' : 'default'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                                    <TableCell align="right">
                                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                            <Button
                                                variant="outlined"
                                                color="primary"
                                                size="small"
                                                startIcon={<VisibilityIcon />}
                                                onClick={() => navigate(`/users/${user.id}`)}
                                            >
                                                Details
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                color="error"
                                                size="small"
                                                startIcon={<DeleteIcon />}
                                                onClick={() => setUserToDelete(user)}
                                            >
                                                Delete
                                            </Button>
                                        </Box>
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

            {/* Confirmation dialog */}
            <Dialog open={!!userToDelete} onClose={() => !isDeleting && setUserToDelete(null)}>
                <DialogTitle>Delete user?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        This will permanently delete <strong>{userToDelete ? displayLabel(userToDelete) : ''}</strong> (ID: {userToDelete?.id}) along with all their demands, offers, and contacts. This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setUserToDelete(null)} disabled={isDeleting}>
                        Cancel
                    </Button>
                    <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={isDeleting}>
                        {isDeleting ? 'Deleting…' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
