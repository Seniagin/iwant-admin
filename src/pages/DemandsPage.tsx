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
    Chip,
    Select,
    MenuItem,
    FormControl
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import EditIcon from '@mui/icons-material/Edit';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { createDemand, deleteDemand, updateDemandCategory, acceptDemand, rejectDemand, getCategories, notifyBusinesses } from '../service/search.api.service';
import { useSnackbar } from '../contexts/SnackbarContext';

export enum DemandStatusEnum {
    PENDING_REVIEW = 'PENDING_REVIEW',
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    DECLINED = 'DECLINED',
}

interface Category {
    id: string;
    name: string;
}

interface Demand {
    id: string;
    transcription: string;
    translation: string;
    status: DemandStatusEnum;
    createdAt: string;
    updatedAt: string;
    category: {
        id?: string;
        name: string;
    };
}

export const DemandsPage: React.FC = () => {
    const [demands, setDemands] = useState<Demand[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingCategories, setIsLoadingCategories] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
    const [editingDemand, setEditingDemand] = useState<Demand | null>(null);
    const [newDemandText, setNewDemandText] = useState('');
    const [updatingDemandId, setUpdatingDemandId] = useState<string | null>(null);
    const [notifyingDemandId, setNotifyingDemandId] = useState<string | null>(null);
    const { showSuccess, showError } = useSnackbar();

    const fetchDemands = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const API_URL = process.env.REACT_APP_API_URL;
            const response = await fetch(`${API_URL}/demands`);
            const data = await response.json();
            setDemands(data);
            // Update editing demand if drawer is open
            if (editingDemand) {
                const updatedDemand = data.find((d: Demand) => d.id === editingDemand.id);
                if (updatedDemand) {
                    setEditingDemand(updatedDemand);
                }
            }
        } catch (err) {
            setError('Failed to fetch demands');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            setIsLoadingCategories(true);
            const data = await getCategories();
            setCategories(data);
        } catch (err) {
            console.error('Failed to fetch categories', err);
        } finally {
            setIsLoadingCategories(false);
        }
    };

    useEffect(() => {
        fetchDemands();
        fetchCategories();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDemandText.trim()) {
            showError('Please enter demand text');
            return;
        }

        try {
            const newDemand = await createDemand(newDemandText);
            setDemands(prev => [...prev, newDemand]);
            setNewDemandText('');
            setIsDrawerOpen(false);
            showSuccess('Demand created successfully!');
        } catch (error) {
            showError('Failed to create demand. Please try again.');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteDemand(id);
            setDemands(prev => prev.filter(demand => demand.id !== id));
            showSuccess('Demand deleted successfully!');
        } catch (error) {
            showError('Failed to delete demand. Please try again.');
        }
    };

    const getStatusColor = (status: DemandStatusEnum): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
        switch (status) {
            case DemandStatusEnum.ACTIVE:
                return 'success';
            case DemandStatusEnum.PENDING_REVIEW:
                return 'warning';
            case DemandStatusEnum.DECLINED:
                return 'error';
            case DemandStatusEnum.INACTIVE:
                return 'default';
            default:
                return 'default';
        }
    };

    const formatStatus = (status: DemandStatusEnum): string => {
        return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    };

    const handleAcceptDemand = async (id: string) => {
        try {
            setUpdatingDemandId(id);
            await acceptDemand(id);
            await fetchDemands();
            showSuccess('Demand accepted successfully!');
            // Update the editing demand state
            if (editingDemand && editingDemand.id === id) {
                setEditingDemand({ ...editingDemand, status: DemandStatusEnum.ACTIVE });
            }
        } catch (error) {
            showError('Failed to accept demand. Please try again.');
        } finally {
            setUpdatingDemandId(null);
        }
    };

    const handleRejectDemand = async (id: string) => {
        try {
            setUpdatingDemandId(id);
            await rejectDemand(id);
            await fetchDemands();
            showSuccess('Demand rejected successfully!');
            // Update the editing demand state
            if (editingDemand && editingDemand.id === id) {
                setEditingDemand({ ...editingDemand, status: DemandStatusEnum.DECLINED });
            }
        } catch (error) {
            showError('Failed to reject demand. Please try again.');
        } finally {
            setUpdatingDemandId(null);
        }
    };

    const handleCategoryChange = async (demandId: string, categoryId: string) => {
        try {
            setUpdatingDemandId(demandId);
            await updateDemandCategory(demandId, categoryId);
            await fetchDemands();
            showSuccess('Demand category updated successfully!');
            // Update the editing demand state
            if (editingDemand) {
                const updatedCategory = categories.find(c => c.id === categoryId);
                setEditingDemand({
                    ...editingDemand,
                    category: updatedCategory ? { id: updatedCategory.id, name: updatedCategory.name } : editingDemand.category
                });
            }
        } catch (error) {
            showError('Failed to update demand category. Please try again.');
        } finally {
            setUpdatingDemandId(null);
        }
    };

    const handleEditClick = (demand: Demand) => {
        setEditingDemand(demand);
        setIsEditDrawerOpen(true);
    };

    const handleCloseEditDrawer = () => {
        setIsEditDrawerOpen(false);
        setEditingDemand(null);
        setUpdatingDemandId(null);
    };

    const handleNotify = async (demandId: string) => {
        try {
            setNotifyingDemandId(demandId);
            await notifyBusinesses(demandId);
            showSuccess('Businesses notified successfully!');
        } catch (error) {
            showError('Failed to notify businesses. Please try again.');
        } finally {
            setNotifyingDemandId(null);
        }
    };

    return (
        <Box sx={{ width: '100%', boxSizing: 'border-box', mx: 'auto', p: 3 }}>
            <Typography variant="h4" component="h2" gutterBottom align="center">
                Demands Management
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
                                <TableCell>Transcription</TableCell>
                                <TableCell>Translation</TableCell>
                                <TableCell>Category</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Created At</TableCell>
                                <TableCell>Updated At</TableCell>
                                <TableCell align="right">
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        startIcon={<AddIcon />}
                                        onClick={() => setIsDrawerOpen(true)}
                                    >
                                        Add Demand
                                    </Button>
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {demands.map((demand) => (
                                <TableRow key={demand.id}>
                                    <TableCell component="th" scope="row" sx={{ fontFamily: 'monospace' }}>
                                        {demand.id}
                                    </TableCell>
                                    <TableCell>{demand.transcription}</TableCell>
                                    <TableCell>{demand.translation}</TableCell>
                                    <TableCell>{demand.category?.name || 'No category'}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={formatStatus(demand.status)}
                                            color={getStatusColor(demand.status)}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>{new Date(demand.createdAt).toLocaleString()}</TableCell>
                                    <TableCell>{new Date(demand.updatedAt).toLocaleString()}</TableCell>
                                    <TableCell align="right">
                                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                            <IconButton
                                                color="info"
                                                onClick={() => handleNotify(demand.id)}
                                                disabled={notifyingDemandId === demand.id}
                                                size="small"
                                                title="Notify Businesses"
                                            >
                                                {notifyingDemandId === demand.id ? (
                                                    <CircularProgress size={20} />
                                                ) : (
                                                    <NotificationsIcon />
                                                )}
                                            </IconButton>
                                            <IconButton
                                                color="primary"
                                                onClick={() => handleEditClick(demand)}
                                                size="small"
                                                title="Edit"
                                            >
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton
                                                color="error"
                                                onClick={() => handleDelete(demand.id)}
                                                size="small"
                                                title="Delete"
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Box>
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
                        <Typography variant="h6">Add New Demand</Typography>
                        <IconButton onClick={() => setIsDrawerOpen(false)}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                    <Box component="form" onSubmit={handleSubmit}>
                        <TextField
                            fullWidth
                            label="Demand Text"
                            value={newDemandText}
                            onChange={(e) => setNewDemandText(e.target.value)}
                            required
                            placeholder="Enter demand text"
                            multiline
                            rows={4}
                            sx={{ mb: 2 }}
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            fullWidth
                        >
                            Add Demand
                        </Button>
                    </Box>
                </Box>
            </Drawer>

            <Drawer
                anchor="right"
                open={isEditDrawerOpen}
                onClose={handleCloseEditDrawer}
            >
                <Box sx={{ width: 400, p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h6">Edit Demand</Typography>
                        <IconButton onClick={handleCloseEditDrawer}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                    {editingDemand && (
                        <Box>
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    Transcription
                                </Typography>
                                <Typography variant="body1" sx={{ mb: 2 }}>
                                    {editingDemand.transcription}
                                </Typography>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    Translation
                                </Typography>
                                <Typography variant="body1" sx={{ mb: 2 }}>
                                    {editingDemand.translation}
                                </Typography>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    Status
                                </Typography>
                                <Chip
                                    label={formatStatus(editingDemand.status)}
                                    color={getStatusColor(editingDemand.status)}
                                    size="small"
                                    sx={{ mb: 3 }}
                                />
                            </Box>

                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mb: 1 }}>
                                    Category
                                </Typography>
                                <FormControl fullWidth size="small">
                                    <Select
                                        value={editingDemand.category?.id || categories.find(c => c.name === editingDemand.category?.name)?.id || ''}
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                handleCategoryChange(editingDemand.id, e.target.value);
                                            }
                                        }}
                                        disabled={updatingDemandId === editingDemand.id || isLoadingCategories}
                                        displayEmpty
                                    >
                                        <MenuItem value="">
                                            <em>{editingDemand.category?.name || 'No category'}</em>
                                        </MenuItem>
                                        {categories.map((category) => (
                                            <MenuItem key={category.id} value={category.id}>
                                                {category.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>

                            {editingDemand.status === DemandStatusEnum.PENDING_REVIEW && (
                                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                    <Button
                                        variant="contained"
                                        color="success"
                                        startIcon={updatingDemandId === editingDemand.id ? <CircularProgress size={16} /> : <CheckCircleIcon />}
                                        onClick={() => handleAcceptDemand(editingDemand.id)}
                                        disabled={updatingDemandId === editingDemand.id}
                                        fullWidth
                                    >
                                        Accept
                                    </Button>
                                    <Button
                                        variant="contained"
                                        color="error"
                                        startIcon={updatingDemandId === editingDemand.id ? <CircularProgress size={16} /> : <CancelIcon />}
                                        onClick={() => handleRejectDemand(editingDemand.id)}
                                        disabled={updatingDemandId === editingDemand.id}
                                        fullWidth
                                    >
                                        Reject
                                    </Button>
                                </Box>
                            )}

                            <Button
                                variant="outlined"
                                color="error"
                                startIcon={<DeleteIcon />}
                                onClick={async () => {
                                    await handleDelete(editingDemand.id);
                                    handleCloseEditDrawer();
                                }}
                                fullWidth
                            >
                                Delete Demand
                            </Button>
                        </Box>
                    )}
                </Box>
            </Drawer>
        </Box>
    );
}; 