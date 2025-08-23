import React, { useState, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    TextField,
    Box,
    Typography,
    Alert,
    CircularProgress,
    Drawer,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useNavigate } from 'react-router-dom';
import { IBusiness, getBusinesses, createBusiness, deleteBusiness, addCategoryToBusiness, removeCategoryFromBusiness, getBusinessCategories, getBusinessDemands } from '../service/business.api.service';
import { useSnackbar } from '../contexts/SnackbarContext';

export const BusinessPage: React.FC = () => {
    const [business, setBusiness] = useState<Partial<IBusiness>>({});
    const [businesses, setBusinesses] = useState<IBusiness[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [businessToDelete, setBusinessToDelete] = useState<IBusiness | null>(null);
    const { showSuccess, showError } = useSnackbar();
    const navigate = useNavigate();

    const fetchBusinesses = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await getBusinesses();
            setBusinesses(data);
        } catch (err) {
            setError('Failed to fetch businesses');
        } finally {
            setIsLoading(false);
        }
    };



    useEffect(() => {
        fetchBusinesses();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createBusiness(business);
            showSuccess('Business created successfully!');
            setBusiness({});
            setIsDrawerOpen(false);
            fetchBusinesses();
        } catch (error) {
            showError('Failed to create business. Please try again.');
        }
    };

    const handleInputChange = (field: keyof IBusiness) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setBusiness(prev => ({ ...prev, [field]: e.target.value }));
    };

    const handleDeleteClick = (business: IBusiness) => {
        setBusinessToDelete(business);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!businessToDelete) return;

        try {
            await deleteBusiness(businessToDelete.id);
            showSuccess('Business deleted successfully!');
            setBusinesses(prev => prev.filter(business => business.id !== businessToDelete.id));
        } catch (err) {
            showError('Failed to delete business. Please try again.');
        } finally {
            setDeleteDialogOpen(false);
            setBusinessToDelete(null);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
        setBusinessToDelete(null);
    };

    return (
        <Box sx={{ width: '100%', boxSizing: 'border-box', mx: 'auto', p: 3 }}>
            <Typography variant="h4" component="h2" gutterBottom align="center">
                Business Management
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
                                <TableCell>Name</TableCell>
                                <TableCell>Description</TableCell>
                                <TableCell align="right">
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        startIcon={<AddIcon />}
                                        onClick={() => setIsDrawerOpen(true)}
                                    >
                                        Add Business
                                    </Button>
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {businesses.map((business) => (
                                <TableRow key={business.id}>
                                    <TableCell component="th" scope="row" sx={{ fontFamily: 'monospace' }}>
                                        {business.id}
                                    </TableCell>
                                    <TableCell>{business.name}</TableCell>
                                    <TableCell>{business.description}</TableCell>
                                    <TableCell align="right">
                                        <Button
                                            variant="outlined"
                                            color="secondary"
                                            size="small"
                                            startIcon={<EditIcon />}
                                            onClick={() => navigate(`/business/${business.id}/edit`)}
                                            sx={{ mr: 1 }}
                                        >
                                            Manage
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            color="error"
                                            size="small"
                                            startIcon={<DeleteIcon />}
                                            onClick={() => handleDeleteClick(business)}
                                        >
                                            Delete
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
            <Drawer
                anchor="right"
                open={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
            >
                <Box sx={{ width: 400, p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h6">Add New Business</Typography>
                        <IconButton onClick={() => setIsDrawerOpen(false)}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                    <Box component="form" onSubmit={handleSubmit}>
                        <TextField
                            fullWidth
                            label="Business Name"
                            value={business.name || ''}
                            onChange={handleInputChange('name')}
                            required
                            placeholder="Enter business name"
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            fullWidth
                            label="Description"
                            value={business.description || ''}
                            onChange={handleInputChange('description')}
                            placeholder="Enter business description"
                            multiline
                            rows={3}
                            sx={{ mb: 2 }}
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            fullWidth
                        >
                            Add Business
                        </Button>
                    </Box>
                </Box>
            </Drawer>
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
                    Are you sure you want to delete business "{businessToDelete?.name}"? This action cannot be undone.
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