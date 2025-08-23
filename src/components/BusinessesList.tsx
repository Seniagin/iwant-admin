import React, { useState } from 'react';
import {
    Box,
    Typography,
    Alert,
    CircularProgress,
    Chip,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { getBusinessDemands, IBusiness } from '../service/business.api.service';
import { useSnackbar } from '../contexts/SnackbarContext';
import { BusinessDemandsDialog } from './BusinessDemandsDialog';

interface BusinessesListProps {
    businesses: IBusiness[];
    isLoading: boolean;
    onViewBusinessDetails: (businessId: string) => void;
    onEditBusiness: (business: IBusiness) => void;
    onDeleteBusiness?: (business: IBusiness) => void;
    userId?: number;
}

export const BusinessesList: React.FC<BusinessesListProps> = ({
    businesses,
    isLoading,
    onViewBusinessDetails,
    onEditBusiness,
    onDeleteBusiness,
    userId
}) => {
    const [isDemandsDialogOpen, setIsDemandsDialogOpen] = useState(false);
    const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [businessToDelete, setBusinessToDelete] = useState<IBusiness | null>(null);

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" my={4}>
                <CircularProgress />
            </Box>
        );
    }

    if (businesses.length === 0) {
        return (
            <Alert severity="info" sx={{ mb: 3 }}>
                No businesses found for this user.
            </Alert>
        );
    }

    const handleDeleteClick = (business: IBusiness) => {
        setBusinessToDelete(business);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (businessToDelete && onDeleteBusiness) {
            onDeleteBusiness(businessToDelete);
        }
        setDeleteDialogOpen(false);
        setBusinessToDelete(null);
    };

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
        setBusinessToDelete(null);
    };

    return (
        <TableContainer component={Paper} sx={{ width: '100%' }}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Categories</TableCell>
                        <TableCell align="center">Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {businesses.map((business) => (
                        <TableRow key={business.id}>
                            <TableCell component="th" scope="row" sx={{ fontFamily: 'monospace' }}>
                                {business.id}
                            </TableCell>
                            <TableCell>{business.name}</TableCell>
                            <TableCell>{business.description}</TableCell>
                            <TableCell>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {business.categories?.map((category) => (
                                        <Chip
                                            key={category.id}
                                            label={category.name}
                                            size="small"
                                            variant="outlined"
                                        />
                                    )) || (
                                            <Typography variant="body2" color="text.secondary">
                                                No categories
                                            </Typography>
                                        )}
                                </Box>
                            </TableCell>
                            <TableCell align="center">
                                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                    <Button
                                        size="small"
                                        onClick={() => {
                                            setSelectedBusinessId(business.id);
                                            setIsDemandsDialogOpen(true);
                                        }}
                                        variant="outlined"
                                        color="primary"
                                        startIcon={<VisibilityIcon />}
                                    >
                                        Show Demands
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        color="primary"
                                        size="small"
                                        startIcon={<VisibilityIcon />}
                                        onClick={() => onViewBusinessDetails(business.id)}
                                    >
                                        Details
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        color="secondary"
                                        size="small"
                                        startIcon={<EditIcon />}
                                        onClick={() => onEditBusiness(business)}
                                    >
                                        Edit
                                    </Button>
                                    {onDeleteBusiness && (
                                        <Button
                                            variant="outlined"
                                            color="error"
                                            size="small"
                                            startIcon={<DeleteIcon />}
                                            onClick={() => handleDeleteClick(business)}
                                        >
                                            Delete
                                        </Button>
                                    )}
                                </Box>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <BusinessDemandsDialog
                businessId={selectedBusinessId}
                isOpen={isDemandsDialogOpen}
                onClose={setIsDemandsDialogOpen}
                userId={userId}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={handleDeleteCancel}
                aria-labelledby="delete-dialog-title"
                aria-describedby="delete-dialog-description"
            >
                <DialogTitle id="delete-dialog-title">
                    Confirm Delete
                </DialogTitle>
                <DialogContent>
                    Are you sure you want to delete business "{businessToDelete?.name}"? This action cannot be undone.
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteCancel} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleDeleteConfirm} color="error" variant="contained">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </TableContainer>
    );
}; 