import React, { useState, useEffect, useRef } from 'react';
import { getCategories, deleteCategory } from '../service/search.api.service';
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
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import { useSnackbar } from '../contexts/SnackbarContext';
import { createCategory } from '../service/categories.api.service';
import { PineconeIndexStats, PineconeIndexStatsRef } from '../components/PineconeIndexStats';

interface Category {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
}

const truncateUUID = (uuid: string) => {
    return uuid.substring(0, 8) + '...';
};

export const CategoriesPage: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const { showSuccess, showError } = useSnackbar();
    const statsRef = useRef<PineconeIndexStatsRef>(null);

    const fetchCategories = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await getCategories();
            setCategories(data);
        } catch (err) {
            setError('Failed to fetch categories');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategoryName.trim()) {
            showError('Please enter category name');
            return;
        }

        try {
            const newCategory = await createCategory(newCategoryName);
            setCategories(prev => [...prev, newCategory]);
            setNewCategoryName('');
            setIsDrawerOpen(false);
            showSuccess('Category created successfully!');
            // Refresh index stats after adding category
            statsRef.current?.refresh();
        } catch (error) {
            showError('Failed to create category. Please try again.');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteCategory(id);
            setCategories(prev => prev.filter(cat => cat.id !== id));
            showSuccess('Category deleted successfully!');
        } catch (error) {
            showError('Failed to delete category. Please try again.');
        }
    };

    return (
        <Box sx={{ width: '100%', boxSizing: 'border-box', mx: 'auto', p: 3 }}>
            <Typography variant="h4" component="h2" gutterBottom align="center">
                Categories Management
            </Typography>

            <PineconeIndexStats ref={statsRef} />

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
                                <TableCell>Name</TableCell>
                                <TableCell>Created At</TableCell>
                                <TableCell>Updated At</TableCell>
                                <TableCell align="right">
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        startIcon={<AddIcon />}
                                        onClick={() => setIsDrawerOpen(true)}
                                    >
                                        Add Category
                                    </Button>
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {categories.map((category) => (
                                <TableRow key={category.id}>
                                    <TableCell component="th" scope="row" sx={{ fontFamily: 'monospace' }}>
                                        {category.id}
                                    </TableCell>
                                    <TableCell>{category.name}</TableCell>
                                    <TableCell>{new Date(category.createdAt).toLocaleString()}</TableCell>
                                    <TableCell>{new Date(category.updatedAt).toLocaleString()}</TableCell>
                                    <TableCell align="right">
                                        <Button
                                            variant="outlined"
                                            color="error"
                                            startIcon={<DeleteIcon />}
                                            onClick={() => handleDelete(category.id)}
                                        >
                                            Delete
                                        </Button>
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
                        <Typography variant="h6">Add New Category</Typography>
                        <IconButton onClick={() => setIsDrawerOpen(false)}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                    <Box component="form" onSubmit={handleSubmit}>
                        <TextField
                            fullWidth
                            label="Category Name"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            required
                            placeholder="Enter category name"
                            sx={{ mb: 2 }}
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            fullWidth
                        >
                            Add Category
                        </Button>
                    </Box>
                </Box>
            </Drawer>
        </Box>
    );
}; 