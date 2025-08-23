import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Alert,
    CircularProgress,
    Chip,
    Button,
    Drawer,
    TextField,
    IconButton
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import { useParams, useNavigate } from 'react-router-dom';
import { IBusinessUser, IBusiness, getBusinessUser, addBusinessToUser, getUserBusinesses, editUserBusiness, deleteBusiness } from '../service/business.api.service';
import { BusinessCreateForm } from '../components/BusinessCreateForm';
import { BusinessesList } from '../components/BusinessesList';
import { useSnackbar } from '../contexts/SnackbarContext';

export const BusinessUserDetailsPage: React.FC = () => {
    const [user, setUser] = useState<IBusinessUser | null>(null);
    const [userBusinesses, setUserBusinesses] = useState<IBusiness[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingBusinesses, setIsLoadingBusinesses] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
    const [editingBusiness, setEditingBusiness] = useState<IBusiness | null>(null);
    const [editFormData, setEditFormData] = useState<Partial<IBusiness>>({});
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const { showSuccess, showError } = useSnackbar();

    const fetchUser = async () => {
        if (!userId) {
            setError('User ID is required');
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);
            const data = await getBusinessUser(parseInt(userId));
            setUser(data);
        } catch (err) {
            setError('Failed to fetch user details');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUserBusinesses = async () => {
        if (!userId) return;

        try {
            setIsLoadingBusinesses(true);
            const businesses = await getUserBusinesses(parseInt(userId));
            setUserBusinesses(businesses);
        } catch (err) {
            showError('Failed to fetch user businesses');
        } finally {
            setIsLoadingBusinesses(false);
        }
    };

    const handleSubmit = async (business: Partial<IBusiness>) => {
        if (!userId) return;

        try {
            await addBusinessToUser(parseInt(userId), business);
            showSuccess('Business added successfully!');
            // Refresh the businesses list
            fetchUserBusinesses();
        } catch (error) {
            showError('Failed to add business. Please try again.');
        }
    };

    const handleEditBusiness = (business: IBusiness) => {
        setEditingBusiness(business);
        setEditFormData({
            name: business.name,
            description: business.description,
        });
        setIsEditDrawerOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId || !editingBusiness) return;

        try {
            await editUserBusiness(parseInt(userId), editingBusiness.id, editFormData);
            showSuccess('Business updated successfully!');
            setIsEditDrawerOpen(false);
            setEditingBusiness(null);
            setEditFormData({});
            // Refresh the businesses list
            fetchUserBusinesses();
        } catch (error) {
            showError('Failed to update business. Please try again.');
        }
    };

    const handleEditInputChange = (field: keyof IBusiness) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditFormData(prev => ({ ...prev, [field]: e.target.value }));
    };

    const handleViewBusinessDetails = (businessId: string) => {
        navigate(`/business-users/${userId}/businesses/${businessId}`);
    };

    const handleDeleteBusiness = async (business: IBusiness) => {
        try {
            await deleteBusiness(business.id);
            showSuccess('Business deleted successfully!');
            // Refresh the businesses list
            fetchUserBusinesses();
        } catch (error) {
            showError('Failed to delete business. Please try again.');
        }
    };

    useEffect(() => {
        fetchUser();
        fetchUserBusinesses();
    }, [userId]);

    const handleBack = () => {
        navigate('/business-users');
    };

    if (isLoading) {
        return (
            <Box sx={{ width: '100%', boxSizing: 'border-box', mx: 'auto', p: 3 }}>
                <Box display="flex" justifyContent="center" my={4}>
                    <CircularProgress />
                </Box>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ width: '100%', boxSizing: 'border-box', mx: 'auto', p: 3 }}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={handleBack}
                    sx={{ mb: 2 }}
                >
                    Back to Business Users
                </Button>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    if (!user) {
        return (
            <Box sx={{ width: '100%', boxSizing: 'border-box', mx: 'auto', p: 3 }}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={handleBack}
                    sx={{ mb: 2 }}
                >
                    Back to Business Users
                </Button>
                <Alert severity="warning">User not found</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ width: '100%', boxSizing: 'border-box', mx: 'auto', p: 3, maxWidth: '100%' }}>
            <Button
                startIcon={<ArrowBackIcon />}
                onClick={handleBack}
                sx={{ mb: 3 }}
            >
                Back to Business Users
            </Button>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h4" gutterBottom>
                        User Details
                    </Typography>
                    <Typography variant="body1" color="primary" gutterBottom>
                        User ID: {user.id}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                        Email: {user.email}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Chip
                        label={user.isActive ? 'Active' : 'Inactive'}
                        color={user.isActive ? 'success' : 'error'}
                        size="medium"
                    />
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={() => setIsDrawerOpen(true)}
                    >
                        Add Business
                    </Button>
                </Box>
            </Box>

            <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
                User Businesses
            </Typography>

            <BusinessesList
                businesses={userBusinesses}
                isLoading={isLoadingBusinesses}
                onViewBusinessDetails={handleViewBusinessDetails}
                onEditBusiness={handleEditBusiness}
                onDeleteBusiness={handleDeleteBusiness}
                userId={userId ? parseInt(userId) : undefined}
            />

            {/* Add Business Drawer */}
            <Drawer
                anchor="right"
                open={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
            >
                <BusinessCreateForm onSubmit={handleSubmit} setIsDrawerOpen={setIsDrawerOpen} />
            </Drawer>

            {/* Edit Business Drawer */}
            <Drawer
                anchor="right"
                open={isEditDrawerOpen}
                onClose={() => {
                    setIsEditDrawerOpen(false);
                    setEditingBusiness(null);
                    setEditFormData({});
                }}
            >
                <Box sx={{ width: 400, p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h6">Edit Business</Typography>
                        <IconButton onClick={() => {
                            setIsEditDrawerOpen(false);
                            setEditingBusiness(null);
                            setEditFormData({});
                        }}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                    <Box component="form" onSubmit={handleEditSubmit}>
                        <TextField
                            fullWidth
                            label="Business Name"
                            value={editFormData.name || ''}
                            onChange={handleEditInputChange('name')}
                            required
                            placeholder="Enter business name"
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            fullWidth
                            label="Description"
                            value={editFormData.description || ''}
                            onChange={handleEditInputChange('description')}
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
                            Update Business
                        </Button>
                    </Box>
                </Box>
            </Drawer>
        </Box>
    );
}; 