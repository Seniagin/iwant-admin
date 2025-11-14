import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CircularProgress, Alert, Typography, Box, Fab, Divider } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { IBusiness, editBusiness, getBusinessById } from '../service/business.api.service';
import { useSnackbar } from '../contexts/SnackbarContext';
import { BusinessForm } from '../components/BusinessForm';
import { ContactsForm } from '../components/ContactsForm';
import { BusinessCategoriesSection } from '../components/BusinessCategoriesSection';

const EditBusinessPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [business, setBusiness] = useState<Partial<IBusiness> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formState, setFormState] = useState<Partial<IBusiness>>({});
  const [contacts, setContacts] = useState<{ phone?: string; email?: string }>({});
  const navigate = useNavigate();
  const { showSuccess, showError } = useSnackbar();

  useEffect(() => {
    const fetchBusiness = async () => {
      setLoading(true);
      setError(null);
      try {
        const business = await getBusinessById(id as string);
        if (!business) {
          setError('Business not found');
        } else {
          setBusiness(business);
          setFormState(business);
          setContacts({ phone: business.contacts?.phone, email: business.contacts?.email });
        }
      } catch (e) {
        setError('Failed to load business');
      } finally {
        setLoading(false);
      }
    };
    fetchBusiness();
  }, [id]);

  const handleEdit = async () => {
    setSaving(true);
    try {
      await editBusiness(id as string, { ...formState, contacts });
      showSuccess('Business updated successfully!');
      navigate('/business');
    } catch (e) {
      showError('Failed to update business. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 8 }} />;
  }
  if (error) {
    return <Alert severity="error" sx={{ mt: 6 }}>{error}</Alert>;
  }
  if (!business) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', minHeight: '80vh', mt: 6, position: 'relative' }}>
      {/* Left Side - Business Info and Contacts (30%) */}
      <Box sx={{ flex: '0 0 30%', pr: 3, maxWidth: 400 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>Edit Business</Typography>
        
        {/* Business Form - Name and Description */}
        <BusinessForm
          initialBusiness={business || {}}
          onSubmit={async () => {}}
          loading={saving}
          submitLabel="Save Changes"
          onChange={setFormState}
          hideSubmitButton
        />
        
        {/* Contacts Form */}
        <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>Contacts</Typography>
        <ContactsForm
          initialContacts={contacts}
          onChange={setContacts}
        />
      </Box>

      {/* Divider */}
      <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />

      {/* Right Side - Categories (70%) */}
      <Box sx={{ flex: 1, pl: 3, minWidth: 0 }}>
        {business && (
          <BusinessCategoriesSection
            businessId={business.id!}
            businessCategories={business.categories || []}
            businessDescription={business.description}
            onCategoriesChange={(categories) => {
              setFormState(prev => ({ ...prev, categories }));
            }}
            onError={showError}
          />
        )}
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
    </Box>
  );
};

export default EditBusinessPage;