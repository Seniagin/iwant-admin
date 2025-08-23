import React, { useState, useEffect } from 'react';
import { Box, Paper, TextField } from '@mui/material';

export interface ContactsFormProps {
  initialContacts?: { phone?: string; email?: string };
  onChange?: (contacts: { phone?: string; email?: string }) => void;
  submitLabel?: string;
}

export const ContactsForm: React.FC<ContactsFormProps> = ({
  initialContacts = {},
  onChange,
}) => {
  const [contacts, setContacts] = useState<{ phone?: string; email?: string }>(initialContacts);

  useEffect(() => {
    setContacts(initialContacts);
  }, [initialContacts]);

  const handleInputChange = (field: 'phone' | 'email') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const updated = { ...contacts, [field]: e.target.value };
    setContacts(updated);
    if (onChange) onChange(updated);
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 500, mx: 'auto', mt: 6 }}>
      <Paper sx={{ p: 4 }}>
        <TextField
          fullWidth
          label="Phone"
          value={contacts.phone || ''}
          onChange={handleInputChange('phone')}
          placeholder="Enter phone number"
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label="Email"
          value={contacts.email || ''}
          onChange={handleInputChange('email')}
          placeholder="Enter email address"
          type="email"
          sx={{ mb: 2 }}
        />
      </Paper>
    </Box>
  );
}; 