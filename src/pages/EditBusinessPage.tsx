import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CircularProgress, Alert, Typography, Box, Fab, Divider, Button } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MapIcon from '@mui/icons-material/Map';
import {
    IBusiness,
    editUserBusiness,
    getBusinessById,
    getUserBusinessDetails,
} from '../service/business.api.service';
import type { ContactsFormInitialValues } from '../components/ContactsForm';
import { useSnackbar } from '../contexts/SnackbarContext';
import { BusinessForm } from '../components/BusinessForm';
import { ContactsForm } from '../components/ContactsForm';
import { BusinessCategoriesSection } from '../components/BusinessCategoriesSection';
import { CategoryCoveragePanel } from '../components/CategoryCoveragePanel';
import type { Location } from '../types/location';
import LocationPicker, { LocationMapPreview } from '../components/LocationPicker/LocationPicker';

const EditBusinessPage: React.FC = () => {
    const { userId, businessId } = useParams<{ userId: string; businessId: string }>();
    const [business, setBusiness] = useState<Partial<IBusiness> | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formState, setFormState] = useState<Partial<IBusiness>>({});
    const [contacts, setContacts] = useState<ContactsFormInitialValues>({
        phone: '',
        email: '',
        address: '',
        website: '',
        instagram: '',
    });
    const [locationPickerOpen, setLocationPickerOpen] = useState(false);
    const [categoriesVersion, setCategoriesVersion] = useState(0);
    const navigate = useNavigate();
    const { showSuccess, showError } = useSnackbar();

    const backToUser = () => navigate(-1);

    useEffect(() => {
        const uid = userId ? Number.parseInt(userId, 10) : NaN;
        if (!Number.isFinite(uid) || !businessId) {
            setError('Invalid business user or business id');
            setLoading(false);
            return;
        }

        const fetchBusiness = async () => {
            setLoading(true);
            setError(null);
            try {
                await getUserBusinessDetails(uid, businessId);
                const full = await getBusinessById(businessId);
                setBusiness(full);
                setFormState(full);
                const c = full.contacts;
                setContacts({
                    phone: c?.phone ?? '',
                    email: c?.email ?? '',
                    address: c?.address ?? '',
                    website: c?.website ?? '',
                    instagram: c?.instagram ?? '',
                    geolocation: c?.geolocation ?? undefined,
                });
            } catch {
                setError('Failed to load business');
            } finally {
                setLoading(false);
            }
        };
        fetchBusiness();
    }, [userId, businessId]);

    const handleEdit = async () => {
        const uid = userId ? Number.parseInt(userId, 10) : NaN;
        if (!Number.isFinite(uid) || !businessId) return;

        setSaving(true);
        try {
            const { geolocation: _readOnly, ...contactPayload } = contacts;
            await editUserBusiness(uid, businessId, {
                ...formState,
                contacts: contactPayload,
            });
            showSuccess('Business updated successfully!');
            navigate(`/business-users/${userId}`);
        } catch {
            showError('Failed to update business. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 8 }} />;
    }
    if (error) {
        return (
            <Box sx={{ mt: 4, px: { xs: 2, sm: 2.5, md: 3 } }}>
                <Button startIcon={<ArrowBackIcon />} onClick={backToUser} sx={{ mb: 2 }}>
                    Back
                </Button>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }
    if (!business) {
        return null;
    }

    return (
        <Box
            sx={{
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box',
                px: { xs: 2, sm: 2.5, md: 3 },
                pt: 1,
                pb: 4,
            }}
        >
            <Button startIcon={<ArrowBackIcon />} onClick={backToUser} sx={{ mb: 2 }}>
                Back
            </Button>

            <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', minHeight: '75vh', flexWrap: 'wrap' }}>
            <Box sx={{ flex: '0 0 30%', pr: 3, maxWidth: 400, minWidth: 280 }}>
                <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
                    Edit business
                </Typography>

                <BusinessForm
                    initialBusiness={business || {}}
                    onSubmit={async () => {}}
                    loading={saving}
                    submitLabel="Save changes"
                    onChange={setFormState}
                    hideSubmitButton
                />

                <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
                    Contacts
                </Typography>
                <ContactsForm initialContacts={contacts} onChange={setContacts} />

                <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
                    Location
                </Typography>
                <LocationMapPreview
                    location={
                        formState.location
                            ? {
                                  latitude: formState.location.latitude,
                                  longitude: formState.location.longitude,
                              }
                            : null
                    }
                    height={240}
                />
                <Button
                    type="button"
                    variant="outlined"
                    startIcon={<MapIcon />}
                    onClick={() => setLocationPickerOpen(true)}
                    fullWidth
                    sx={{ mt: 1 }}
                >
                    Choose on map
                </Button>
            </Box>

            <Divider orientation="vertical" flexItem sx={{ mx: 2, display: { xs: 'none', md: 'block' } }} />

            <Box sx={{ flex: 1, pl: { md: 3 }, minWidth: 0, pt: { xs: 3, md: 0 } }}>
                {business.id && (
                    <>
                        <BusinessCategoriesSection
                            businessId={business.id}
                            businessCategories={business.categories || []}
                            onCategoriesChange={(categories) => {
                                setFormState((prev) => ({ ...prev, categories }));
                                setBusiness((prev) => (prev ? { ...prev, categories } : null));
                                setCategoriesVersion((v) => v + 1);
                            }}
                            onError={showError}
                        />
                        <CategoryCoveragePanel
                            businessId={business.id}
                            resetKey={categoriesVersion}
                            onCategoryAdded={() => setCategoriesVersion((v) => v + 1)}
                        />
                    </>
                )}
            </Box>
            </Box>

            <Fab
                color="primary"
                aria-label="save"
                onClick={handleEdit}
                disabled={saving}
                sx={{ position: 'fixed', bottom: 32, right: 32, zIndex: 1201 }}
            >
                <SaveIcon />
            </Fab>

            {locationPickerOpen && (
                <LocationPicker
                    initialLocation={
                        formState.location
                            ? {
                                  latitude: formState.location.latitude,
                                  longitude: formState.location.longitude,
                              }
                            : null
                    }
                    onLocationSelect={(loc: Location | null) => {
                        if (!loc) {
                            setFormState((prev) => {
                                const next = { ...prev };
                                delete next.location;
                                return next;
                            });
                            setBusiness((prev) => (prev ? { ...prev, location: undefined } : null));
                            return;
                        }
                        const next = { latitude: loc.latitude, longitude: loc.longitude };
                        setFormState((prev) => ({ ...prev, location: next }));
                        setBusiness((prev) => (prev ? { ...prev, location: next } : null));
                    }}
                    onClose={() => setLocationPickerOpen(false)}
                />
            )}
        </Box>
    );
};

export default EditBusinessPage;
