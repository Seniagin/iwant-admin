import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CircularProgress, Alert, Typography, Box, Divider, Fab } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { IBusiness, getBusinesses, editBusiness, getBusinessById } from '../service/business.api.service';
import { useSnackbar } from '../contexts/SnackbarContext';
import { BusinessForm, BusinessFormProps } from '../components/BusinessForm';
import { ServiceList } from '../components/service/ServiceList';
import { ContactsForm } from '../components/ContactsForm';
import { ServiceAddForm } from '../components/service/ServiceAddForm';
import Drawer from '@mui/material/Drawer';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import { ServiceEditForm } from '../components/service/ServiceEditForm';
import { addServiceToBusiness, editService, getBusinessServices, IService } from '../service/service.api.service';
import { BusinessCategoriesSection } from '../components/BusinessCategoriesSection';

const EditBusinessPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [business, setBusiness] = useState<Partial<IBusiness> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [services, setServices] = useState<IService[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [formState, setFormState] = useState<Partial<IBusiness>>({});
  const [contacts, setContacts] = useState<{ phone?: string; email?: string }>({});
  const navigate = useNavigate();
  const { showSuccess, showError } = useSnackbar();
  const [isServiceDrawerOpen, setIsServiceDrawerOpen] = useState(false);
  const [isServiceEditDrawerOpen, setIsServiceEditDrawerOpen] = useState(false);
  const [editingService, setEditingService] = useState<IService | null>(null);

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

  useEffect(() => {
    const fetchServices = async () => {
      if (!id) return;
      setServicesLoading(true);
      try {
        const result = await getBusinessServices(0, id); // 0 as dummy userId
        setServices(result);
      } catch (e) {
        setServices([]);
      } finally {
        setServicesLoading(false);
      }
    };
    fetchServices();
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

  const handleEditService = (service: IService) => {
    setEditingService(service);
    setIsServiceEditDrawerOpen(true);
    setIsServiceDrawerOpen(false);
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
      <Box sx={{ flex: 1, pr: 3, maxWidth: 400 }}>
        {/* Business Edit Form */}
        <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>General Information</Typography>
        <BusinessForm
          initialBusiness={business || {}}
          onSubmit={async () => {}}
          loading={saving}
          submitLabel="Save Changes"
          onChange={setFormState}
          hideSubmitButton
        />
        
        {/* Business Categories Section */}
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
        
        {/* Contacts Form */}
        <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>Contacts</Typography>
        <ContactsForm
          initialContacts={contacts}
          onChange={setContacts}
        />
      </Box>
      <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
      <Box sx={{ flex: 2, pl: 3, minWidth: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Services
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setIsServiceDrawerOpen(true)}
          >
            Add Service
          </Button>
        </Box>
        {servicesLoading ? (
          <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 8 }} />
        ) : (
          <ServiceList
            loading={false}
            services={services}
            handleEditService={handleEditService}
            businessId={id!}
            onServiceDeleted={() => {}}
          />
        )}
        <Drawer
          anchor="right"
          open={isServiceDrawerOpen}
          onClose={() => setIsServiceDrawerOpen(false)}
        >
          <Box sx={{ width: 400, p: 3 }}>
            <ServiceAddForm
              userId={undefined}
              businessId={id!}
              onSubmit={async (error, service) => {
                if (error) {
                  showError(error);
                  return;
                }
                try {
                  await addServiceToBusiness(id!, service!);
                  showSuccess('Service added successfully!');
                  setIsServiceDrawerOpen(false);
                  // Refresh services list
                  setServicesLoading(true);
                  try {
                    const result = await getBusinessServices(0, id!);
                    setServices(result);
                  } catch (e) {
                    setServices([]);
                  } finally {
                    setServicesLoading(false);
                  }
                } catch (e) {
                  showError('Failed to add service. Please try again.');
                }
              }}
            />
          </Box>
        </Drawer>
        <Drawer
          anchor="right"
          open={isServiceEditDrawerOpen}
          onClose={() => setIsServiceEditDrawerOpen(false)}
        >
          <Box sx={{ width: 400, p: 3 }}>
            {editingService && (
              <ServiceEditForm
                serviceId={editingService.id}
                onSubmit={async (error, updatedService) => {
                  if (error) {
                    showError(error);
                    return;
                  }
                  if (!updatedService || !updatedService.id) {
                    showError('Invalid service data.');
                    return;
                  }
                  try {
                    await editService(updatedService.id, updatedService);
                    showSuccess('Service updated successfully!');
                    setIsServiceEditDrawerOpen(false);
                    setEditingService(null);
                    // Refresh services list
                    setServicesLoading(true);
                    try {
                      const result = await getBusinessServices(0, id!);
                      setServices(result);
                    } catch (e) {
                      setServices([]);
                    } finally {
                      setServicesLoading(false);
                    }
                  } catch (e) {
                    showError('Failed to update service. Please try again.');
                  }
                }}
              />
            )}
          </Box>
        </Drawer>
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