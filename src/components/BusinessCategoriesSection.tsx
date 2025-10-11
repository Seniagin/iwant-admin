import React, { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Chip,
    Button,
    CircularProgress,
    Alert,
    Collapse,
    Autocomplete,
    TextField,
    Divider
} from '@mui/material';
import RecommendIcon from '@mui/icons-material/Recommend';
import CategoryIcon from '@mui/icons-material/Category';
import AddIcon from '@mui/icons-material/Add';
import { ICategory } from '../service/business.api.service';
import { getCategories } from '../service/search.api.service';
import {
    getBusinessCategoryRecommendations,
    getBusinessCategorySuggestions,
    addCategoryToBusiness,
    removeCategoryFromBusiness,
    createCategory
} from '../service/categories.api.service';
import { CategorySuggestions } from './CategorySuggestions';

interface BusinessCategoriesSectionProps {
    businessId: string;
    businessCategories: ICategory[];
    businessDescription?: string;
    onCategoriesChange: (categories: ICategory[]) => void;
    onError: (error: string) => void;
}

export const BusinessCategoriesSection: React.FC<BusinessCategoriesSectionProps> = ({
    businessId,
    businessCategories,
    businessDescription,
    onCategoriesChange,
    onError
}) => {
    // Category management state
    const [allCategories, setAllCategories] = useState<ICategory[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [categoriesError, setCategoriesError] = useState<string | null>(null);
    const [addingCategory, setAddingCategory] = useState(false);
    const [removingCategory, setRemovingCategory] = useState<string | null>(null);

    // Recommended categories state
    const [recommendedCategories, setRecommendedCategories] = useState<ICategory[]>([]);
    const [showRecommendedCategories, setShowRecommendedCategories] = useState(false);
    const [loadingRecommendations, setLoadingRecommendations] = useState(false);
    const [recommendationsError, setRecommendationsError] = useState<string | null>(null);

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

    const handleAddCategory = async (category: ICategory) => {
        if (!category) return;

        try {
            setAddingCategory(true);
            await addCategoryToBusiness(businessId, category.id);

            // Update local state
            const updatedCategories = [...businessCategories, category];
            onCategoriesChange(updatedCategories);
        } catch (error) {
            onError('Failed to add category to business');
        } finally {
            setAddingCategory(false);
        }
    };

    const handleRemoveCategory = async (categoryId: string) => {
        try {
            setRemovingCategory(categoryId);
            await removeCategoryFromBusiness(businessId, categoryId);

            // Update local state
            const updatedCategories = businessCategories.filter(cat => cat.id !== categoryId);
            onCategoriesChange(updatedCategories);
        } catch (error) {
            onError('Failed to remove category from business');
        } finally {
            setRemovingCategory(null);
        }
    };

    const handleShowRecommendedCategories = async () => {
        if (showRecommendedCategories) {
            setShowRecommendedCategories(false);
            return;
        }

        try {
            setLoadingRecommendations(true);
            setRecommendationsError(null);
            const categories = await getBusinessCategoryRecommendations(businessId);
            setRecommendedCategories(categories);
            setShowRecommendedCategories(true);
        } catch (error) {
            setRecommendationsError('Failed to fetch recommended categories');
        } finally {
            setLoadingRecommendations(false);
        }
    };

    const handleAddRecommendedCategory = async (category: ICategory) => {
        await handleAddCategory(category);
        // Remove from recommended list
        setRecommendedCategories(prev => prev.filter(cat => cat.id !== category.id));
    };

    // Get available categories (not already assigned)
    const availableCategories = allCategories.filter(
        category => !businessCategories.some(assigned => assigned.id === category.id)
    );

    return (
        <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <CategoryIcon sx={{ mr: 1 }} />
                Business Categories
            </Typography>

            {/* Current Categories Section */}
            <Box sx={{ mb: 2 }}>
                {businessCategories && businessCategories.length > 0 ? (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                        {businessCategories.map((category) => (
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
                    startIcon={loadingRecommendations ? <CircularProgress size={16} /> : <RecommendIcon />}
                    onClick={handleShowRecommendedCategories}
                    disabled={loadingRecommendations}
                    fullWidth
                    sx={{ mb: 2 }}
                >
                    {loadingRecommendations
                        ? 'Loading Recommendations...'
                        : showRecommendedCategories
                            ? 'Hide Recommended Categories'
                            : 'Show Recommended Categories'
                    }
                </Button>

                {recommendationsError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {recommendationsError}
                    </Alert>
                )}

                <Collapse in={showRecommendedCategories}>
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
                                Recommended Categories
                            </Typography>
                        </Box>

                        {recommendedCategories.length === 0 ? (
                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                No recommended categories found for this business.
                            </Typography>
                        ) : (
                            <>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    These categories are recommended based on your business details:
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {recommendedCategories.map((category) => (
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
                                    💡 Click on a category to add it to this business
                                </Typography>
                            </>
                        )}
                    </Box>
                </Collapse>
            </Box>

            {/* Category Suggestions Section */}
            {businessDescription && (
                <CategorySuggestions
                    query={businessDescription}
                    businessId={businessId}
                    onCategoryCreated={async (categoryName) => {
                        // Refresh categories list after creating a new category
                        try {
                            setLoadingCategories(true);
                            setCategoriesError(null);
                            const categories = await getCategories();
                            setAllCategories(categories);
                            // Find the newly created category and add it to the business
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
            )}

            <Divider sx={{ mt: 2 }} />
        </Box>
    );
};
