import React, { useState, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    TextField,
    Box,
    Typography,
    Alert,
    CircularProgress,
    Drawer,
    IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import { createDemand, deleteDemand } from '../service/search.api.service';
import { useSnackbar } from '../contexts/SnackbarContext';

interface Demand {
    id: string;
    transcription: string;
    translation: string;
    createdAt: string;
    updatedAt: string;
    category: {
        name: string;
    };
}

export const DemandsPage: React.FC = () => {
    const [demands, setDemands] = useState<Demand[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [newDemandText, setNewDemandText] = useState('');
    const { showSuccess, showError } = useSnackbar();

    const fetchDemands = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await fetch('http://localhost:3000/demands');
            const data = await response.json();
            setDemands(data);
        } catch (err) {
            setError('Failed to fetch demands');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDemands();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDemandText.trim()) {
            showError('Please enter demand text');
            return;
        }

        try {
            const newDemand = await createDemand(newDemandText);
            setDemands(prev => [...prev, newDemand]);
            setNewDemandText('');
            setIsDrawerOpen(false);
            showSuccess('Demand created successfully!');
        } catch (error) {
            showError('Failed to create demand. Please try again.');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteDemand(id);
            setDemands(prev => prev.filter(demand => demand.id !== id));
            showSuccess('Demand deleted successfully!');
        } catch (error) {
            showError('Failed to delete demand. Please try again.');
        }
    };

    return (
        <Box sx={{ width: '100%', boxSizing: 'border-box', mx: 'auto', p: 3 }}>
            <Typography variant="h4" component="h2" gutterBottom align="center">
                Demands Management
            </Typography>

            {isLoading ? (
                <Box display="flex" justifyContent="center" my={4}>
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Alert severity="error" sx={{ maxWidth: 800, mx: 'auto' }}>{error}</Alert>
            ) : (
                <TableContainer component={Paper} sx={{ width: '100%' }}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Transcription</TableCell>
                                <TableCell>Translation</TableCell>
                                <TableCell>Category</TableCell>
                                <TableCell>Created At</TableCell>
                                <TableCell>Updated At</TableCell>
                                <TableCell align="right">
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        startIcon={<AddIcon />}
                                        onClick={() => setIsDrawerOpen(true)}
                                    >
                                        Add Demand
                                    </Button>
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {demands.map((demand) => (
                                <TableRow key={demand.id}>
                                    <TableCell component="th" scope="row" sx={{ fontFamily: 'monospace' }}>
                                        {demand.id}
                                    </TableCell>
                                    <TableCell>{demand.transcription}</TableCell>
                                    <TableCell>{demand.translation}</TableCell>
                                    <TableCell>{demand.category?.name}</TableCell>
                                    <TableCell>{new Date(demand.createdAt).toLocaleString()}</TableCell>
                                    <TableCell>{new Date(demand.updatedAt).toLocaleString()}</TableCell>
                                    <TableCell align="right">
                                        <IconButton
                                            color="error"
                                            onClick={() => handleDelete(demand.id)}
                                            size="small"
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <Drawer
                anchor="right"
                open={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
            >
                <Box sx={{ width: 400, p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h6">Add New Demand</Typography>
                        <IconButton onClick={() => setIsDrawerOpen(false)}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                    <Box component="form" onSubmit={handleSubmit}>
                        <TextField
                            fullWidth
                            label="Demand Text"
                            value={newDemandText}
                            onChange={(e) => setNewDemandText(e.target.value)}
                            required
                            placeholder="Enter demand text"
                            multiline
                            rows={4}
                            sx={{ mb: 2 }}
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            fullWidth
                        >
                            Add Demand
                        </Button>
                    </Box>
                </Box>
            </Drawer>
        </Box>
    );
}; 