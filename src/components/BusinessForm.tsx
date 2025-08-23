import React, { useState, useEffect } from 'react';
import { Box, Paper, TextField, Button } from '@mui/material';
import { IBusiness } from '../service/business.api.service';

export interface BusinessFormProps {
  initialBusiness?: Partial<IBusiness>;
  onSubmit: (business: Partial<IBusiness>) => Promise<void>;
  loading: boolean;
  submitLabel?: string;
  onChange?: (business: Partial<IBusiness>) => void;
  hideSubmitButton?: boolean;
}

export const BusinessForm: React.FC<BusinessFormProps> = ({
  initialBusiness = {},
  onSubmit,
  loading,
  submitLabel = 'Save',
  onChange,
  hideSubmitButton = false,
}) => {
  const [business, setBusiness] = useState<Partial<IBusiness>>(initialBusiness);

  useEffect(() => {
    setBusiness(initialBusiness);
  }, [initialBusiness]);

  const handleInputChange = (field: keyof IBusiness) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const updated = { ...business, [field]: e.target.value };
    setBusiness(updated);
    if (onChange) onChange(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(business);
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 500, mx: 'auto', mt: 6 }}>
      <Paper sx={{ p: 4 }}>
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
          {!hideSubmitButton && (
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={loading}
            >
              {loading ? 'Saving...' : submitLabel}
            </Button>
          )}
        </Box>
      </Paper>
    </Box>
  );
}; 