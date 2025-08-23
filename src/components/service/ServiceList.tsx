import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";

import { TableBody, Typography } from "@mui/material";

import { Table, TableRow, TableHead, Paper, Box, CircularProgress } from "@mui/material";

import { TableCell } from "@mui/material";

import { TableContainer } from "@mui/material";

import { Alert, Chip } from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useState } from "react";
import { deleteService, IService } from "../../service/service.api.service";

export const ServiceList = ({
    loading,
    services,
    handleEditService,
    onServiceDeleted
}: { 
    loading: boolean, 
    services: IService[], 
    handleEditService: (service: IService) => void,
    userId?: string,
    businessId?: string,
    onServiceDeleted: (error?: string) => void
}) => {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [serviceToDelete, setServiceToDelete] = useState<IService | null>(null);
    const [deleting, setDeleting] = useState(false);

    const handleDeleteClick = (service: IService) => {
        setServiceToDelete(service);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!serviceToDelete) return;

        try {
            setDeleting(true);
            await deleteService(serviceToDelete.id);
            onServiceDeleted();
            setDeleteDialogOpen(false);
            setServiceToDelete(null);
        } catch (error) {
            onServiceDeleted('Failed to delete service. Please try again.');
        } finally {
            setDeleting(false);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
        setServiceToDelete(null);
    };

    return <>
        {loading ? (
            <Box display="flex" justifyContent="center" my={4}>
                <CircularProgress />
            </Box>
        ) : services.length === 0 ? (
            <Alert severity="info" sx={{ mb: 3 }}>
                No services found for this business.
            </Alert>
        ) : (
            <TableContainer component={Paper} sx={{ flex: 1, width: '100%' }}>
                <Table stickyHeader>
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
                        {services.map((service) => (
                            <TableRow key={service.id}>
                                <TableCell component="th" scope="row" sx={{ fontFamily: 'monospace' }}>
                                    {service.id}
                                </TableCell>
                                <TableCell sx={{ fontWeight: 500 }}>
                                    {service.name}
                                </TableCell>
                                <TableCell>
                                    {service.description || (
                                        <Typography variant="body2" color="text.secondary">
                                            No description
                                        </Typography>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                        {service.categories && service.categories.length > 0 ? (
                                            service.categories.map((category) => (
                                                <Chip
                                                    key={category.id}
                                                    label={category.name}
                                                    size="small"
                                                    variant="outlined"
                                                    color="primary"
                                                />
                                            ))
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">
                                                No categories
                                            </Typography>
                                        )}
                                    </Box>
                                </TableCell>
                                <TableCell align="center">
                                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                        <Button
                                            variant="outlined"
                                            color="secondary"
                                            size="small"
                                            startIcon={<EditIcon />}
                                            onClick={() => handleEditService(service)}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            color="error"
                                            size="small"
                                            startIcon={<DeleteIcon />}
                                            onClick={() => handleDeleteClick(service)}
                                        >
                                            Delete
                                        </Button>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog
            open={deleteDialogOpen}
            onClose={handleDeleteCancel}
            aria-labelledby="delete-dialog-title"
            aria-describedby="delete-dialog-description"
        >
            <DialogTitle id="delete-dialog-title">
                Delete Service
            </DialogTitle>
            <DialogContent>
                <DialogContentText id="delete-dialog-description">
                    Are you sure you want to delete the service "{serviceToDelete?.name}"? 
                    This action cannot be undone.
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button 
                    onClick={handleDeleteCancel} 
                    color="primary"
                    disabled={deleting}
                >
                    Cancel
                </Button>
                <Button 
                    onClick={handleDeleteConfirm} 
                    color="error" 
                    variant="contained"
                    disabled={deleting}
                    startIcon={deleting ? <CircularProgress size={16} /> : <DeleteIcon />}
                >
                    {deleting ? 'Deleting...' : 'Delete'}
                </Button>
            </DialogActions>
        </Dialog>
    </>
};
