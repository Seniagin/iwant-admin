import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteCategory } from '../service/search.api.service';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TableSortLabel,
    TablePagination,
    Paper,
    Button,
    Chip,
    TextField,
    Box,
    Typography,
    Alert,
    CircularProgress,
    Drawer,
    IconButton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import MapIcon from '@mui/icons-material/Map';
import { useSnackbar } from '../contexts/SnackbarContext';
import { createCategory } from '../service/categories.api.service';
import {
    getCategoriesPaginated,
    type ICategoryWithCount,
    type CategorySortBy,
    type SortOrder,
} from '../service/categories.api.service';
import { PineconeIndexStats, PineconeIndexStatsRef } from '../components/PineconeIndexStats';

const truncateUUID = (uuid: string) => uuid.substring(0, 8) + '...';

export const CategoriesPage: React.FC = () => {
    const navigate = useNavigate();
    const { showSuccess, showError } = useSnackbar();
    const statsRef = useRef<PineconeIndexStatsRef>(null);

    const [categories, setCategories] = useState<ICategoryWithCount[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Pagination
    const [page, setPage] = useState(0); // MUI TablePagination is 0-based
    const [rowsPerPage, setRowsPerPage] = useState(20);

    // Sorting
    const [sortBy, setSortBy] = useState<CategorySortBy>('name');
    const [sortOrder, setSortOrder] = useState<SortOrder>('ASC');

    // Drawer
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    const fetchCategories = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const result = await getCategoriesPaginated({
                page: page + 1, // backend is 1-based
                limit: rowsPerPage,
                sortBy,
                sortOrder,
            });
            setCategories(result.items);
            setTotal(result.meta.total);
        } catch {
            setError('Failed to fetch categories');
        } finally {
            setIsLoading(false);
        }
    }, [page, rowsPerPage, sortBy, sortOrder]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const handleSort = (column: CategorySortBy) => {
        if (sortBy === column) {
            setSortOrder((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'));
        } else {
            setSortBy(column);
            setSortOrder('ASC');
        }
        setPage(0);
    };

    const handlePageChange = (_: unknown, newPage: number) => setPage(newPage);

    const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(e.target.value, 10));
        setPage(0);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategoryName.trim()) {
            showError('Please enter category name');
            return;
        }
        try {
            await createCategory(newCategoryName);
            setNewCategoryName('');
            setIsDrawerOpen(false);
            showSuccess('Category created successfully!');
            statsRef.current?.refresh();
            setPage(0);
            setSortBy('createdAt');
            setSortOrder('DESC');
        } catch {
            showError('Failed to create category. Please try again.');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteCategory(id);
            showSuccess('Category deleted successfully!');
            await fetchCategories();
        } catch {
            showError('Failed to delete category. Please try again.');
        }
    };

    const sortLabel = (column: CategorySortBy, label: string, align?: 'center' | 'right') => (
        <TableCell align={align} sortDirection={sortBy === column ? sortOrder.toLowerCase() as 'asc' | 'desc' : false}>
            <TableSortLabel
                active={sortBy === column}
                direction={sortBy === column ? sortOrder.toLowerCase() as 'asc' | 'desc' : 'asc'}
                onClick={() => handleSort(column)}
            >
                {label}
            </TableSortLabel>
        </TableCell>
    );

    return (
        <Box sx={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', px: { xs: 2, sm: 2.5, md: 3 }, py: 3 }}>
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
                <Paper sx={{ width: '100%' }}>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>ID</TableCell>
                                    {sortLabel('name', 'Name')}
                                    {sortLabel('businessCount', 'Businesses', 'center')}
                                    {sortLabel('createdAt', 'Created At')}
                                    {sortLabel('updatedAt', 'Updated At')}
                                    <TableCell align="right">
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            size="small"
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
                                    <TableRow key={category.id} hover>
                                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                            {truncateUUID(category.id)}
                                        </TableCell>
                                        <TableCell>{category.name}</TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={category.businessCount ?? 0}
                                                size="small"
                                                color={category.businessCount > 0 ? 'primary' : 'default'}
                                            />
                                        </TableCell>
                                        <TableCell>{new Date(category.createdAt).toLocaleString()}</TableCell>
                                        <TableCell>{new Date(category.updatedAt).toLocaleString()}</TableCell>
                                        <TableCell align="right">
                                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                                <Button
                                                    variant="outlined"
                                                    color="primary"
                                                    size="small"
                                                    startIcon={<MapIcon />}
                                                    onClick={() =>
                                                        navigate(`/categories/${category.id}/businesses`, {
                                                            state: { categoryName: category.name },
                                                        })
                                                    }
                                                >
                                                    Manage Businesses
                                                </Button>
                                                <Button
                                                    variant="outlined"
                                                    color="error"
                                                    size="small"
                                                    startIcon={<DeleteIcon />}
                                                    onClick={() => handleDelete(category.id)}
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
                    <TablePagination
                        component="div"
                        count={total}
                        page={page}
                        onPageChange={handlePageChange}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={handleRowsPerPageChange}
                        rowsPerPageOptions={[10, 20, 50, 100]}
                    />
                </Paper>
            )}

            <Drawer anchor="right" open={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}>
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
                        <Button type="submit" variant="contained" color="primary" fullWidth>
                            Add Category
                        </Button>
                    </Box>
                </Box>
            </Drawer>
        </Box>
    );
};
