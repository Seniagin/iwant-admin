import React, { useState, useEffect } from 'react';
import { Box, Typography, Alert, CircularProgress, Chip, Button, Drawer } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { useParams, useNavigate } from 'react-router-dom';
import { IBusinessUser, IBusiness, getBusinessUser, addBusinessToUser, getUserBusinesses, deleteBusiness } from '../service/business.api.service';
import { BusinessCreateForm } from '../components/BusinessCreateForm';
import { BusinessesList } from '../components/BusinessesList';
import { BusinessUserEditDrawer } from '../components/BusinessUserEditDrawer';
import { useSnackbar } from '../contexts/SnackbarContext';

export const BusinessUserDetailsPage: React.FC = () => {
    const [user, setUser] = useState<IBusinessUser | null>(null);
    const [userBusinesses, setUserBusinesses] = useState<IBusiness[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingBusinesses, setIsLoadingBusinesses] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editUserOpen, setEditUserOpen] = useState(false);
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
            const data = await getBusinessUser(parseInt(userId, 10));
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
            const businesses = await getUserBusinesses(parseInt(userId, 10));
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
            await addBusinessToUser(parseInt(userId, 10), business);
            showSuccess('Business added successfully!');
            fetchUserBusinesses();
        } catch (error) {
            showError('Failed to add business. Please try again.');
        }
    };

    const handleEditBusiness = (business: IBusiness) => {
        navigate(`/business-users/${userId}/businesses/${business.id}/edit`);
    };

    const handleDeleteBusiness = async (business: IBusiness) => {
        try {
            await deleteBusiness(business.id);
            showSuccess('Business deleted successfully!');
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
            <Box
                sx={{
                    width: '100%',
                    maxWidth: '100%',
                    boxSizing: 'border-box',
                    px: { xs: 2, sm: 2.5, md: 3 },
                    py: 3,
                }}
            >
                <Box display="flex" justifyContent="center" my={4}>
                    <CircularProgress />
                </Box>
            </Box>
        );
    }

    if (error) {
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
                    Back to Business Users
                </Button>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    if (!user) {
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
                    Back to Business Users
                </Button>
                <Alert severity="warning">User not found</Alert>
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
            <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mb: 3 }}>
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
                        Email: {user.email ?? '—'}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <Chip
                        label={user.isActive ? 'Active' : 'Inactive'}
                        color={user.isActive ? 'success' : 'error'}
                        size="medium"
                    />
                    <Button variant="outlined" startIcon={<EditIcon />} onClick={() => setEditUserOpen(true)}>
                        Edit user
                    </Button>
                    <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => setIsDrawerOpen(true)}>
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
                onEditBusiness={handleEditBusiness}
                onDeleteBusiness={handleDeleteBusiness}
            />

            <Drawer anchor="right" open={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}>
                <BusinessCreateForm onSubmit={handleSubmit} setIsDrawerOpen={setIsDrawerOpen} />
            </Drawer>

            <BusinessUserEditDrawer
                open={editUserOpen}
                onClose={() => setEditUserOpen(false)}
                user={user}
                onSaved={(u) => setUser(u)}
            />
        </Box>
    );
};
