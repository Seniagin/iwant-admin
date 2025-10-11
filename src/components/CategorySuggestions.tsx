import React, { useState, useEffect } from 'react';
import { Box, Chip, CircularProgress, Alert, Typography, Button, Collapse } from '@mui/material';
import CategoryIcon from '@mui/icons-material/Category';
import { createCategory, getBusinessCategorySuggestions } from '../service/categories.api.service';
import { useSnackbar } from '../contexts/SnackbarContext';

interface CategorySuggestionsProps {
  query: string;
  businessId: string;
  onCategoryCreated?: (categoryName: string) => void;
}

export const CategorySuggestions: React.FC<CategorySuggestionsProps> = ({
  query,
  businessId,
  onCategoryCreated
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { showSuccess, showError } = useSnackbar();

  const fetchSuggestions = async () => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await getBusinessCategorySuggestions(businessId);
      setSuggestions(result);
    } catch (err) {
      setError('Failed to fetch category suggestions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showSuggestions) {
      fetchSuggestions();
    }
  }, [query, showSuggestions]);

  const handleSuggestionClick = async (suggestion: string) => {
    try {
      await createCategory(suggestion);
      showSuccess(`Category "${suggestion}" created successfully!`);
      onCategoryCreated?.(suggestion);
      // Refresh suggestions list
      fetchSuggestions();
    } catch (err) {
      showError('Failed to create category. Please try again.');
    }
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Button
        variant="outlined"
        color="info"
        startIcon={<CategoryIcon />}
        onClick={() => setShowSuggestions((prev) => !prev)}
        fullWidth
        sx={{ mb: 2 }}
      >
        {showSuggestions ? 'Hide Suggestions' : 'Show Suggestions'}
      </Button>
      
      <Collapse in={showSuggestions}>
        <Box sx={{ mt: 2 }}>
          {loading && (
            <Box display="flex" justifyContent="center" my={2}>
              <CircularProgress size={24} />
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ my: 2 }}>
              {error}
            </Alert>
          )}

          {!loading && !error && !query.trim() && (
            <Box sx={{ my: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Enter a query to get category suggestions
              </Typography>
            </Box>
          )}

          {!loading && !error && query.trim() && suggestions.length === 0 && (
            <Box sx={{ my: 2 }}>
              <Typography variant="body2" color="text.secondary">
                No suggestions found for "{query}"
              </Typography>
            </Box>
          )}

          {!loading && !error && suggestions.length > 0 && (
            <Box sx={{ my: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Category Suggestions:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {suggestions.map((suggestion, index) => (
                  <Chip
                    key={index}
                    label={suggestion}
                    size="small"
                    variant="outlined"
                    clickable
                    onClick={() => handleSuggestionClick(suggestion)}
                    sx={{ cursor: 'pointer' }}
                  />
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}; 