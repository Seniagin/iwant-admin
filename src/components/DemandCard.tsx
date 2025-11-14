import React, { useState } from 'react';
import { 
    Card, 
    CardContent, 
    Typography, 
    Chip, 
    Box, 
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { ICategory, IOffer, createOffer } from '../service/business.api.service';
import { useSnackbar } from '../contexts/SnackbarContext';

interface IDemand {
    id: string;
    category: ICategory;
    translation: string;
    createdAt: string;
}

interface DemandCardProps {
    demand: IDemand;
}

export const DemandCard: React.FC<DemandCardProps> = ({ demand }) => {
    const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false);
    const [comment, setComment] = useState('');
    const { showSuccess, showError } = useSnackbar();

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    const handleMakeOffer = async () => {
        if (!comment.trim()) {
            showError('Please enter a comment');
            return;
        }

        try {
            const offer: IOffer = {
                demandId: parseInt(demand.id),
                serviceId: '', // No service needed anymore
                comment: comment.trim()
            };

            await createOffer(offer);
            showSuccess('Offer created successfully!');
            setIsOfferDialogOpen(false);
            setComment('');
        } catch (error) {
            showError('Failed to create offer. Please try again.');
        }
    };

    const handleCloseDialog = () => {
        setIsOfferDialogOpen(false);
        setComment('');
    };

    return (
        <>
            <Card sx={{ mb: 2, width: '100%' }}>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Chip
                            label={demand.category.name}
                            color="primary"
                            size="small"
                            sx={{ mb: 1 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                            {formatDate(demand.createdAt)}
                        </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        {demand.translation}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            onClick={() => setIsOfferDialogOpen(true)}
                        >
                            Make Offer
                        </Button>
                    </Box>
                </CardContent>
            </Card>

            <Dialog
                open={isOfferDialogOpen}
                onClose={handleCloseDialog}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">Make Offer</Typography>
                        <IconButton onClick={handleCloseDialog}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Demand: {demand.translation}
                        </Typography>

                        <TextField
                            fullWidth
                            label="Comment"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            multiline
                            rows={4}
                            placeholder="Enter your offer comment..."
                            required
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleMakeOffer}
                        variant="contained"
                        disabled={!comment.trim()}
                    >
                        Submit Offer
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}; 