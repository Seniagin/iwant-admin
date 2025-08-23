import React, { useState, useEffect } from 'react';
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
    DialogActions
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';
import { IBusinessUser, getBusinessUsers, deleteBusinessUser } from '../service/business.api.service';
import { useSnackbar } from '../contexts/SnackbarContext';

export const BusinessUsersPage: React.FC = () => {
    const [businessUsers, setBusinessUsers] = useState<IBusinessUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<IBusinessUser | null>(null);
    const navigate = useNavigate();
    const { showSuccess, showError } = useSnackbar();

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    const fetchBusinessUsers = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await getBusinessUsers();
            setBusinessUsers(data);
        } catch (err) {
            setError('Failed to fetch business users');
        } finally {
            setIsLoading(false);
        }
    };

    const handleViewDetails = (userId: number) => {
        navigate(`/business-users/${userId}`);
    };

    const handleDeleteClick = (user: IBusinessUser) => {
        setUserToDelete(user);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!userToDelete) return;

        try {
            await deleteBusinessUser(userToDelete.id);
            showSuccess('User deleted successfully!');
            setBusinessUsers(prev => prev.filter(user => user.id !== userToDelete.id));
        } catch (err) {
            showError('Failed to delete user. Please try again.');
        } finally {
            setDeleteDialogOpen(false);
            setUserToDelete(null);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
        setUserToDelete(null);
    };

    useEffect(() => {
        console.log('33')
        fetchBusinessUsers();
    }, []);

    return (
        <Box sx={{ width: '100%', boxSizing: 'border-box', mx: 'auto', p: 3 }}>
            <Typography variant="h4" component="h2" gutterBottom align="center">
                Business Users Management
            </Typography>

            {isLoading ? (
                <Box display="flex" justifyContent="center" my={4}>
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Alert severity="error" sx={{ maxWidth: 800, mx: 'auto' }}>{error}</Alert>
            ) : (
                <TableContainer component={Paper} sx={{ width: '100%' }}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Created Date</TableCell>
                                <TableCell>Updated Date</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {businessUsers.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell component="th" scope="row" sx={{ fontFamily: 'monospace' }}>
                                        {user.id}
                                    </TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={user.isActive ? 'Active' : 'Inactive'}
                                            color={user.isActive ? 'success' : 'error'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                                    <TableCell>{formatDate(user.updatedAt)}</TableCell>
                                    <TableCell align="right">
                                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                            <Button
                                                variant="outlined"
                                                color="primary"
                                                size="small"
                                                startIcon={<VisibilityIcon />}
                                                onClick={() => handleViewDetails(user.id)}
                                            >
                                                Details
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                color="error"
                                                size="small"
                                                startIcon={<DeleteIcon />}
                                                onClick={() => handleDeleteClick(user)}
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

            {!isLoading && !error && businessUsers.length === 0 && (
                <Typography variant="body1" color="text.secondary" align="center" sx={{ my: 4 }}>
                    No business users found
                </Typography>
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={handleDeleteCancel}
                aria-labelledby="delete-dialog-title"
                aria-describedby="delete-dialog-description"
            >
                <DialogTitle id="delete-dialog-title">
                    Confirm Delete
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="delete-dialog-description">
                        Are you sure you want to delete user "{userToDelete?.email}"? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteCancel} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleDeleteConfirm} color="error" variant="contained">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}; 