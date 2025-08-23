import { Box, Button, IconButton, TextField, Typography } from "@mui/material"
import CloseIcon from '@mui/icons-material/Close';
import { useState } from "react";
import { IBusiness } from "../service/business.api.service";

export const BusinessCreateForm = ({ onSubmit, setIsDrawerOpen }: { onSubmit: (business: Partial<IBusiness>) => void, setIsDrawerOpen: (isDrawerOpen: boolean) => void }) => {
    const [business, setBusiness] = useState<Partial<IBusiness>>({});

    const handleInputChange = (field: keyof IBusiness) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setBusiness(prev => ({ ...prev, [field]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setBusiness({});
        setIsDrawerOpen(false);
        onSubmit(business);
    };


    return <Box sx={{ width: 400, p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">Add New Business</Typography>
            <IconButton onClick={() => setIsDrawerOpen(false)}>
                <CloseIcon />
            </IconButton>
        </Box>
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
            <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
            >
                Add Business
            </Button>
        </Box>
    </Box>
}
