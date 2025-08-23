import { Box, Button, TextField } from "@mui/material";
import { useState } from "react";
import { IService } from "../../service/service.api.service";

export const ServiceAddForm = (
    {
        userId,
        businessId,
        onSubmit
    }:
        {
            userId: string | undefined,
            businessId: string | undefined,
            onSubmit: (error?: string, service?: Partial<IService>) => void,
        }
) => {

    const [serviceFormData, setServiceFormData] = useState<Partial<IService>>({
        name: '',
        description: ''
    });
    

    const handleServiceSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!businessId || !serviceFormData.name?.trim()) return;

        try {
            onSubmit(undefined, serviceFormData);
        } catch (error) {
            onSubmit('Failed to add service. Please try again.');
        }
    };
    
    const handleServiceInputChange = (field: keyof IService) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setServiceFormData(prev => ({ ...prev, [field]: e.target.value }));
    };

    return <Box component="form" onSubmit={handleServiceSubmit}>
        <TextField
            fullWidth
            label="Service Name"
            value={serviceFormData.name || ''}
            onChange={handleServiceInputChange('name')}
            required
            placeholder="Enter service name"
            sx={{ mb: 2 }}
        />
        <TextField
            fullWidth
            label="Description"
            value={serviceFormData.description || ''}
            onChange={handleServiceInputChange('description')}
            placeholder="Enter service description"
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
            Add Service
        </Button>
    </Box>;
};
