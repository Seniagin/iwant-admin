import React, { useState } from 'react';
import { Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { IBusiness, createBusiness } from '../service/business.api.service';
import { useSnackbar } from '../contexts/SnackbarContext';
import { BusinessForm } from '../components/BusinessForm';

const CreateBusinessPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showSuccess, showError } = useSnackbar();

  const handleCreate = async (business: Partial<IBusiness>) => {
    setLoading(true);
    try {
      await createBusiness(business);
      showSuccess('Business created successfully!');
      navigate('/business');
    } catch (error) {
      showError('Failed to create business. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mt: 6 }}>
        Create Business
      </Typography>
      <BusinessForm onSubmit={handleCreate} loading={loading} submitLabel="Create Business" />
    </>
  );
};

export default CreateBusinessPage; 