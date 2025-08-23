import { Alert, Box, CircularProgress, TextField, Chip, Typography, Collapse, Divider, Autocomplete } from "@mui/material";

import { Button } from "@mui/material";
import { ICategory } from "../../service/business.api.service";
import { getCategories } from "../../service/search.api.service";
import { useEffect, useState } from "react";
import { useAsyncOnLoad } from "../../utils/hooks/useAsyncOnLoad";
import RecommendIcon from '@mui/icons-material/Recommend';
import CategoryIcon from '@mui/icons-material/Category';
import AddIcon from '@mui/icons-material/Add';
import { editService, getServiceById, IService, AssetResponseDto } from "../../service/service.api.service";
import {
    addCategoryToService,
    getMatchingServiceCategories,
    getCategoriesSuggestions,
    removeCategoryFromService
} from "../../service/categories.api.service";
import { CategorySuggestions } from "../CategorySuggestions";
import { FileUpload } from "../FileUpload";

export const ServiceEditForm = ({
    serviceId,
    onSubmit
}:
    {
        serviceId: string,
        onSubmit: (error?: string, service?: Partial<IService>) => void,
    }) => {

    const { data: service, loading, error } = useAsyncOnLoad(
        () => getServiceById(serviceId)
    );

    useEffect(() => {
        if (service) {
            setEditServiceFormData(service);
        }
    }, [service]);

    const [editServiceFormData, setEditServiceFormData] = useState<Partial<IService>>({});
    const [matchingCategories, setMatchingCategories] = useState<ICategory[]>([]);
    const [showMatchingCategories, setShowMatchingCategories] = useState(false);
    const [loadingMatchings, setLoadingMatchings] = useState(false);
    const [matchingErrors, setMatchingErrors] = useState<string | null>(null);

    // Category management state
    const [allCategories, setAllCategories] = useState<ICategory[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [categoriesError, setCategoriesError] = useState<string | null>(null);
    const [addingCategory, setAddingCategory] = useState(false);
    const [removingCategory, setRemovingCategory] = useState<string | null>(null);

    // Fetch all categories on component mount
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                setLoadingCategories(true);
                setCategoriesError(null);
                const categories = await getCategories();
                setAllCategories(categories);
            } catch (error) {
                setCategoriesError('Failed to fetch categories');
            } finally {
                setLoadingCategories(false);
            }
        };

        fetchCategories();
    }, []);

    const handleEditServiceInputChange = (field: keyof IService) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditServiceFormData(prev => ({ ...prev, [field]: e.target.value }));
    };

    const handleEditServiceSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editServiceFormData.name?.trim()) return;

        try {
            await editService(serviceId, editServiceFormData);
            onSubmit(undefined, editServiceFormData);
        } catch (error) {
            onSubmit('Failed to update service. Please try again.');
        }
    };

    const handleShowRecommendedCategories = async () => {
        if (showMatchingCategories) {
            setShowMatchingCategories(false);
            return;
        }

        try {
            setLoadingMatchings(true);
            setMatchingErrors(null);
            const categories = await getMatchingServiceCategories(serviceId);
            setMatchingCategories(categories);
            setShowMatchingCategories(true);
        } catch (error) {
            setMatchingErrors('Failed to fetch recommended categories');
        } finally {
            setLoadingMatchings(false);
        }
    };

    const handleAddCategory = async (category: ICategory) => {
        if (!category) return;

        try {
            setAddingCategory(true);
            await addCategoryToService(serviceId, category.id);

            // Update local state
            setEditServiceFormData(prev => ({
                ...prev,
                categories: [...(prev.categories || []), category]
            }));
        } catch (error) {
            onSubmit('Failed to add category to service');
        } finally {
            setAddingCategory(false);
        }
    };

    const handleRemoveCategory = async (categoryId: string) => {
        try {
            setRemovingCategory(categoryId);
            await removeCategoryFromService(serviceId, categoryId);

            // Update local state
            setEditServiceFormData(prev => ({
                ...prev,
                categories: prev.categories?.filter(cat => cat.id !== categoryId) || []
            }));
        } catch (error) {
            onSubmit('Failed to remove category from service');
        } finally {
            setRemovingCategory(null);
        }
    };

    const handleAddRecommendedCategory = async (category: ICategory) => {
        await handleAddCategory(category);
        // Remove from recommended list
        setMatchingCategories(prev => prev.filter(cat => cat.id !== category.id));
    };

    // Get available categories (not already assigned)
    const availableCategories = allCategories.filter(
        category => !editServiceFormData.categories?.some(assigned => assigned.id === category.id)
    );

    return <Box component="form" onSubmit={handleEditServiceSubmit}>
        {loading && <CircularProgress />}
        {error && <Alert severity="error">{error}</Alert>}
        {service && (
            <>
                <TextField
                    fullWidth
                    label="Service Name"
                    value={editServiceFormData.name || ''}
                    onChange={handleEditServiceInputChange('name')}
                    required
                    placeholder="Enter service name"
                    sx={{ mb: 2 }}
                />
                <TextField
                    fullWidth
                    label="Description"
                    value={editServiceFormData.description || ''}
                    onChange={handleEditServiceInputChange('description')}
                    placeholder="Enter service description"
                    multiline
                    rows={3}
                    sx={{ mb: 2 }}
                />

                {/* Current Categories Section */}
                <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                        <CategoryIcon sx={{ mr: 1 }} />
                        Current Categories
                    </Typography>

                    {editServiceFormData.categories && editServiceFormData.categories.length > 0 ? (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                            {editServiceFormData.categories.map((category) => (
                                <Chip
                                    key={category.id}
                                    label={category.name}
                                    onDelete={() => handleRemoveCategory(category.id)}
                                    color="primary"
                                    variant="filled"
                                    disabled={removingCategory === category.id}
                                    deleteIcon={removingCategory === category.id ? <CircularProgress size={16} /> : undefined}
                                />
                            ))}
                        </Box>
                    ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic' }}>
                            No categories assigned yet
                        </Typography>
                    )}

                    {/* Add Category Section */}
                    {!loadingCategories && availableCategories.length > 0 && (
                        <Autocomplete
                            options={availableCategories}
                            getOptionLabel={(option) => option.name}
                            onChange={(event, newValue) => {
                                if (newValue) {
                                    handleAddCategory(newValue);
                                }
                            }}
                            disabled={addingCategory}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Add Category"
                                    placeholder="Search and select a category to add"
                                    InputProps={{
                                        ...params.InputProps,
                                        startAdornment: addingCategory ? <CircularProgress size={20} /> : <AddIcon />,
                                    }}
                                />
                            )}
                            sx={{ mb: 2 }}
                        />
                    )}

                    {loadingCategories && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                            <CircularProgress size={20} />
                        </Box>
                    )}

                    {categoriesError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {categoriesError}
                        </Alert>
                    )}
                </Box>

                {/* Recommended Categories Section */}
                <Box sx={{ mb: 2 }}>
                    <Button
                        variant="outlined"
                        color="info"
                        startIcon={loadingMatchings ? <CircularProgress size={16} /> : <RecommendIcon />}
                        onClick={handleShowRecommendedCategories}
                        disabled={loadingMatchings}
                        fullWidth
                        sx={{ mb: 2 }}
                    >
                        {loadingMatchings
                            ? 'Loading Matchings...'
                            : showMatchingCategories
                                ? 'Hide Matching Categories'
                                : 'Show Matching Categories'
                        }
                    </Button>

                    {matchingErrors && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {matchingErrors}
                        </Alert>
                    )}

                    <Collapse in={showMatchingCategories}>
                        <Box sx={{
                            border: '1px solid #e0e0e0',
                            borderRadius: 1,
                            p: 2,
                            backgroundColor: '#f8f9fa',
                            mb: 2
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <CategoryIcon sx={{ mr: 1, color: 'primary.main' }} />
                                <Typography variant="h6" color="primary">
                                    Matching Categories
                                </Typography>
                            </Box>

                            {matchingCategories.length === 0 ? (
                                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                    No matching categories found for this service.
                                </Typography>
                            ) : (
                                <>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        These categories are matching based on your service details:
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                        {matchingCategories.map((category, index) => (
                                            <Chip
                                                key={category.id}
                                                label={category.name}
                                                variant="outlined"
                                                color="primary"
                                                size="medium"
                                                clickable
                                                onClick={() => handleAddRecommendedCategory(category)}
                                                sx={{
                                                    fontWeight: 500,
                                                    '&:hover': {
                                                        backgroundColor: 'primary.light',
                                                        color: 'white'
                                                    }
                                                }}
                                            />
                                        ))}
                                    </Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                                        💡 Click on a category to add it to this service
                                    </Typography>
                                </>
                            )}
                        </Box>
                    </Collapse>
                </Box>

                {/* Category Suggestions Section */}
                <CategorySuggestions
                    query={service?.description!}
                    onCategoryCreated={async (categoryName) => {
                        // Refresh categories list after creating a new category
                        try {
                            setLoadingCategories(true);
                            setCategoriesError(null);
                            const categories = await getCategories();
                            setAllCategories(categories);
                            // Find the newly created category and add it to the service
                            const newCategory = categories.find((cat: ICategory) => cat.name === categoryName);
                            if (newCategory) {
                                await handleAddCategory(newCategory);
                            }
                        } catch (error) {
                            setCategoriesError('Failed to refresh categories');
                        } finally {
                            setLoadingCategories(false);
                        }
                    }}
                />

                <Divider sx={{ mb: 2 }} />

                {/* Service Images Section */}
                <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        Service Images
                    </Typography>
                    <FileUpload
                        serviceId={serviceId}
                        existingAssets={service?.assets || []}
                        onUploadComplete={(asset: AssetResponseDto) => {
                            // Handle successful upload
                            console.log('Asset uploaded:', asset);
                        }}
                        onUploadError={(error: string) => {
                            // Handle upload error
                            console.error('Upload error:', error);
                        }}
                        onAssetDeleted={(assetId: string) => {
                            // Handle asset deletion
                            console.log('Asset deleted:', assetId);
                        }}
                    />
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                >
                    Update Service
                </Button>
            </>
        )}
    </Box>;
}
