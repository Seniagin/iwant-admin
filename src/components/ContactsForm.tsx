import React, { useState, useEffect } from 'react';
import { Box, Paper, TextField, Typography } from '@mui/material';
import type { IBusinessContacts } from '../service/business.api.service';

export type BusinessContactsFormValues = Pick<
    IBusinessContacts,
    'phone' | 'email' | 'address' | 'website' | 'instagram'
>;

/** Optional `geolocation` is read-only (API may return it; not submitted from this form). */
export type ContactsFormInitialValues = BusinessContactsFormValues & Pick<IBusinessContacts, 'geolocation'>;

export interface ContactsFormProps {
    initialContacts?: ContactsFormInitialValues;
    onChange?: (contacts: BusinessContactsFormValues) => void;
    submitLabel?: string;
}

const emptyValues = (): BusinessContactsFormValues => ({
    phone: '',
    email: '',
    address: '',
    website: '',
    instagram: '',
});

function normalizeFromApi(c?: ContactsFormInitialValues | null): BusinessContactsFormValues {
    const v = emptyValues();
    if (!c) return v;
    return {
        phone: c.phone ?? '',
        email: c.email ?? '',
        address: c.address ?? '',
        website: c.website ?? '',
        instagram: c.instagram ?? '',
    };
}

export const ContactsForm: React.FC<ContactsFormProps> = ({ initialContacts = {}, onChange }) => {
    const [contacts, setContacts] = useState<BusinessContactsFormValues>(() => normalizeFromApi(initialContacts));

    useEffect(() => {
        setContacts(normalizeFromApi(initialContacts));
    }, [initialContacts]);

    const handleInputChange =
        (field: keyof BusinessContactsFormValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
            const updated = { ...contacts, [field]: e.target.value };
            setContacts(updated);
            onChange?.(updated);
        };

    const geo = initialContacts?.geolocation;

    return (
        <Box sx={{ width: '100%', maxWidth: 500, mx: 'auto', mt: 2 }}>
            <Paper sx={{ p: 3 }}>
                <TextField
                    fullWidth
                    label="Phone"
                    value={contacts.phone}
                    onChange={handleInputChange('phone')}
                    placeholder="Phone number"
                    inputProps={{ maxLength: 30 }}
                    sx={{ mb: 2 }}
                />
                <TextField
                    fullWidth
                    label="Email"
                    value={contacts.email}
                    onChange={handleInputChange('email')}
                    placeholder="Email address"
                    type="email"
                    inputProps={{ maxLength: 255 }}
                    sx={{ mb: 2 }}
                />
                <TextField
                    fullWidth
                    label="Address"
                    value={contacts.address}
                    onChange={handleInputChange('address')}
                    placeholder="Street, city, etc."
                    inputProps={{ maxLength: 255 }}
                    sx={{ mb: 2 }}
                />
                <TextField
                    fullWidth
                    label="Website"
                    value={contacts.website}
                    onChange={handleInputChange('website')}
                    placeholder="https://…"
                    inputProps={{ maxLength: 255 }}
                    sx={{ mb: 2 }}
                />
                <TextField
                    fullWidth
                    label="Instagram"
                    value={contacts.instagram}
                    onChange={handleInputChange('instagram')}
                    placeholder="Handle or profile URL"
                    inputProps={{ maxLength: 255 }}
                    sx={{ mb: 2 }}
                />
                {geo ? (
                    <Typography variant="caption" color="text.secondary" display="block">
                        Geolocation (read-only): {geo}
                    </Typography>
                ) : null}
            </Paper>
        </Box>
    );
};
