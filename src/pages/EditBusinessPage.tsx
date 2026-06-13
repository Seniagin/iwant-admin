import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CircularProgress, Alert, Box, Button, Divider, Paper, Typography } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MapIcon from '@mui/icons-material/Map';
import StorefrontIcon from '@mui/icons-material/Storefront';
import {
    IBusiness, editUserBusiness, getBusinessById, getUserBusinessDetails,
} from '../service/business.api.service';
import type { ContactsFormInitialValues } from '../components/ContactsForm';
import { useSnackbar } from '../contexts/SnackbarContext';
import { BusinessForm } from '../components/BusinessForm';
import { ContactsForm } from '../components/ContactsForm';
import { BusinessCategoriesSection } from '../components/BusinessCategoriesSection';
import { CategoryCoveragePanel } from '../components/CategoryCoveragePanel';
import { BusinessDemandsSection } from '../components/BusinessDemandsSection';
import type { Location } from '../types/location';
import LocationPicker, { LocationMapPreview } from '../components/LocationPicker/LocationPicker';

// ── design tokens ────────────────────────────────────────────────────────────
const HEADER_H   = 60;
const ACCENT     = '#6366f1';   // indigo
const BG_PAGE    = '#f1f5f9';   // slate-100
const CARD_SHADOW = '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)';

// ── tiny helpers ─────────────────────────────────────────────────────────────
const SidebarSection: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <Box sx={{ width: 3, height: 14, bgcolor: ACCENT, borderRadius: 2, flexShrink: 0 }} />
            <Typography sx={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'text.secondary' }}>
                {label}
            </Typography>
        </Box>
        {children}
    </Box>
);

// ─────────────────────────────────────────────────────────────────────────────

const EditBusinessPage: React.FC = () => {
    const { userId, businessId } = useParams<{ userId: string; businessId: string }>();
    const [business, setBusiness]   = useState<Partial<IBusiness> | null>(null);
    const [loading, setLoading]     = useState(true);
    const [saving, setSaving]       = useState(false);
    const [error, setError]         = useState<string | null>(null);
    const [formState, setFormState] = useState<Partial<IBusiness>>({});
    const [contacts, setContacts]   = useState<ContactsFormInitialValues>({
        phone: '', email: '', address: '', website: '', instagram: '',
    });
    const [locationPickerOpen, setLocationPickerOpen] = useState(false);
    const [categoriesVersion, setCategoriesVersion]   = useState(0);
    const navigate = useNavigate();
    const { showSuccess, showError } = useSnackbar();

    useEffect(() => {
        const uid = userId ? Number.parseInt(userId, 10) : NaN;
        if (!Number.isFinite(uid) || !businessId) { setError('Invalid URL'); setLoading(false); return; }
        (async () => {
            setLoading(true); setError(null);
            try {
                await getUserBusinessDetails(uid, businessId);
                const full = await getBusinessById(businessId);
                setBusiness(full); setFormState(full);
                const c = full.contacts;
                setContacts({
                    phone: c?.phone ?? '', email: c?.email ?? '', address: c?.address ?? '',
                    website: c?.website ?? '', instagram: c?.instagram ?? '',
                    geolocation: c?.geolocation ?? undefined,
                });
            } catch { setError('Failed to load business'); }
            finally { setLoading(false); }
        })();
    }, [userId, businessId]);

    const handleSave = async () => {
        const uid = userId ? Number.parseInt(userId, 10) : NaN;
        if (!Number.isFinite(uid) || !businessId) return;
        setSaving(true);
        try {
            const { geolocation: _ro, ...contactPayload } = contacts;
            await editUserBusiness(uid, businessId, { ...formState, contacts: contactPayload });
            showSuccess('Saved!');
            navigate(`/business-users/${userId}`);
        } catch { showError('Failed to save.'); }
        finally { setSaving(false); }
    };

    if (loading) return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 10 }} />;
    if (error || !business) return (
        <Box sx={{ mt: 4, px: 3 }}>
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>Back</Button>
            <Alert severity="error">{error ?? 'Not found'}</Alert>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: BG_PAGE }}>

            {/* ══════════════ HEADER ══════════════ */}
            <Box sx={{
                position: 'sticky', top: 0, zIndex: 200,
                height: HEADER_H,
                display: 'flex', alignItems: 'center', gap: 2,
                px: { xs: 2, md: 3 },
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
            }}>
                <Button
                    size="small"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate(-1)}
                    sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.08)' } }}
                >
                    Back
                </Button>

                <StorefrontIcon sx={{ color: 'rgba(255,255,255,0.35)', fontSize: 18 }} />

                <Typography
                    variant="subtitle1"
                    sx={{
                        flex: 1, fontWeight: 700, color: '#fff',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}
                >
                    {business.name ?? 'Edit business'}
                </Typography>

                <Button
                    variant="contained"
                    size="small"
                    startIcon={<SaveIcon />}
                    onClick={handleSave}
                    disabled={saving}
                    sx={{
                        bgcolor: ACCENT, '&:hover': { bgcolor: '#4f46e5' },
                        boxShadow: 'none', px: 2.5, fontWeight: 700,
                        '&:disabled': { bgcolor: 'rgba(99,102,241,0.4)', color: '#fff' },
                    }}
                >
                    {saving ? 'Saving…' : 'Save changes'}
                </Button>
            </Box>

            {/* ══════════════ BODY ══════════════ */}
            <Box sx={{
                display: 'flex', flex: 1, gap: 3,
                px: { xs: 2, md: 3 }, pt: 3, pb: 8,
                alignItems: 'flex-start',
            }}>

                {/* ── Left sticky sidebar ── */}
                <Box sx={{
                    width: 300, flexShrink: 0,
                    position: { md: 'sticky' },
                    top: { md: HEADER_H + 24 },
                    maxHeight: { md: `calc(100vh - ${HEADER_H + 48}px)` },
                    overflowY: { md: 'auto' },
                    display: { xs: 'none', md: 'flex' },
                    flexDirection: 'column', gap: 0,
                }}>
                    <Paper elevation={0} sx={{
                        borderRadius: 2, p: 0, overflow: 'hidden',
                        boxShadow: CARD_SHADOW,
                        border: '1px solid rgba(99,102,241,0.12)',
                    }}>
                        {/* indigo top accent */}
                        <Box sx={{ height: 3, background: `linear-gradient(90deg, ${ACCENT}, #818cf8)` }} />

                        <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 0 }}>
                            <SidebarSection label="Business info">
                                <BusinessForm
                                    initialBusiness={business}
                                    onSubmit={async () => {}}
                                    loading={saving}
                                    submitLabel=""
                                    onChange={setFormState}
                                    hideSubmitButton
                                />
                            </SidebarSection>

                            <Divider sx={{ my: 2.5 }} />

                            <SidebarSection label="Contacts">
                                <ContactsForm initialContacts={contacts} onChange={setContacts} />
                            </SidebarSection>

                            <Divider sx={{ my: 2.5 }} />

                            <SidebarSection label="Location">
                                <LocationMapPreview
                                    location={formState.location
                                        ? { latitude: formState.location.latitude, longitude: formState.location.longitude }
                                        : null}
                                    height={170}
                                />
                                <Button
                                    variant="outlined" size="small" startIcon={<MapIcon />}
                                    onClick={() => setLocationPickerOpen(true)}
                                    fullWidth sx={{ mt: 1, borderColor: 'divider', color: 'text.secondary', '&:hover': { borderColor: ACCENT, color: ACCENT } }}
                                >
                                    Choose on map
                                </Button>
                            </SidebarSection>
                        </Box>
                    </Paper>
                </Box>

                {/* ── Right main area ── */}
                <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2.5 }}>

                    {/* Categories */}
                    {business.id && (
                        <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: CARD_SHADOW }}>
                            <Box sx={{ height: 3, background: 'linear-gradient(90deg, #10b981, #34d399)' }} />
                            <Box sx={{ p: 2.5 }}>
                                <Typography sx={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#10b981', mb: 2 }}>
                                    Categories
                                </Typography>
                                <BusinessCategoriesSection
                                    businessId={business.id}
                                    businessCategories={business.categories || []}
                                    onCategoriesChange={(categories) => {
                                        setFormState((p) => ({ ...p, categories }));
                                        setBusiness((p) => (p ? { ...p, categories } : null));
                                        setCategoriesVersion((v) => v + 1);
                                    }}
                                    onError={showError}
                                />
                                <Box sx={{ mt: 2 }}>
                                    <CategoryCoveragePanel
                                        businessId={business.id}
                                        resetKey={categoriesVersion}
                                        onCategoryAdded={() => setCategoriesVersion((v) => v + 1)}
                                    />
                                </Box>
                            </Box>
                        </Paper>
                    )}

                    {/* Demands */}
                    {business.id && (
                        <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: CARD_SHADOW }}>
                            <Box sx={{ height: 3, background: `linear-gradient(90deg, ${ACCENT}, #818cf8)` }} />
                            <Box sx={{ p: 2.5 }}>
                                <BusinessDemandsSection
                                    businessId={business.id}
                                    onSuccess={showSuccess}
                                    onError={showError}
                                />
                            </Box>
                        </Paper>
                    )}
                </Box>
            </Box>

            {locationPickerOpen && (
                <LocationPicker
                    initialLocation={formState.location
                        ? { latitude: formState.location.latitude, longitude: formState.location.longitude }
                        : null}
                    onLocationSelect={(loc: Location | null) => {
                        if (!loc) {
                            setFormState((p) => { const n = { ...p }; delete n.location; return n; });
                            setBusiness((p) => (p ? { ...p, location: undefined } : null));
                        } else {
                            const next = { latitude: loc.latitude, longitude: loc.longitude };
                            setFormState((p) => ({ ...p, location: next }));
                            setBusiness((p) => (p ? { ...p, location: next } : null));
                        }
                    }}
                    onClose={() => setLocationPickerOpen(false)}
                />
            )}
        </Box>
    );
};

export default EditBusinessPage;
