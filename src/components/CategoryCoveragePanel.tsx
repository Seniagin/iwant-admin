import React, { useEffect, useState } from 'react';
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    Alert,
    Typography,
    LinearProgress,
    Divider,
    IconButton,
    Tooltip,
} from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { analyzeBusinessCoverage, getBusinessCoverage, createAndAssignSuggestedCategory, type BusinessCoverageResult } from '../service/business.api.service';

function scoreColor(score: number): 'success' | 'warning' | 'error' {
    if (score >= 70) return 'success';
    if (score >= 40) return 'warning';
    return 'error';
}

function scoreBarColor(score: number): 'success' | 'warning' | 'error' | 'primary' {
    if (score >= 70) return 'success';
    if (score >= 40) return 'warning';
    return 'error';
}

interface Props {
    businessId: string;
    resetKey?: unknown;
    onCategoryAdded?: () => void;
}

export const CategoryCoveragePanel: React.FC<Props> = ({ businessId, resetKey, onCategoryAdded }) => {
    const [result, setResult] = useState<BusinessCoverageResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [adding, setAdding] = useState<string | null>(null);

    useEffect(() => {
        setResult(null);
        getBusinessCoverage(businessId)
            .then((stored) => { if (stored) setResult(stored); })
            .catch(() => {});
    }, [businessId, resetKey]);

    const handleAddSuggested = async (cat: { name: string; description: string }) => {
        setAdding(cat.name);
        try {
            await createAndAssignSuggestedCategory(businessId, cat.name, cat.description);
            setResult((prev) => prev ? {
                ...prev,
                suggestedCategories: prev.suggestedCategories.filter((c) => c.name !== cat.name),
            } : prev);
            onCategoryAdded?.();
        } catch {
            setError('Failed to add category. Please try again.');
        } finally {
            setAdding(null);
        }
    };

    const run = async () => {
        setLoading(true);
        setError(null);
        try {
            setResult(await analyzeBusinessCoverage(businessId));
        } catch {
            setError('Analysis failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Box>
                    <Typography variant="h6">Category Coverage</Typography>
                    {result?.analyzedAt && (
                        <Typography variant="caption" color="text.secondary">
                            Last analyzed: {new Date(result.analyzedAt).toLocaleString()}
                        </Typography>
                    )}
                </Box>
                <Button
                    variant="outlined"
                    size="small"
                    startIcon={loading ? <CircularProgress size={16} /> : <AssessmentIcon />}
                    onClick={run}
                    disabled={loading}
                >
                    {result ? 'Re-analyze' : 'Analyze'}
                </Button>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                How well do the assigned categories cover this business's actual services?
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {result && (
                <Box>
                    {/* Score */}
                    <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="body2" color="text.secondary">Coverage score</Typography>
                            <Chip
                                label={result.score != null ? `${result.score}%` : 'N/A'}
                                size="small"
                                color={result.score != null ? scoreColor(result.score) : 'default'}
                            />
                        </Box>
                        {result.score != null && (
                            <LinearProgress
                                variant="determinate"
                                value={result.score}
                                color={scoreBarColor(result.score)}
                                sx={{ height: 8, borderRadius: 4 }}
                            />
                        )}
                    </Box>

                    {/* Summary */}
                    {result.summary && (
                        <Typography variant="body2" sx={{ mb: 2 }}>{result.summary}</Typography>
                    )}

                    {/* Covered */}
                    {result.coveredServices.length > 0 && (
                        <Box sx={{ mb: 1.5 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                Covered by assigned categories
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {result.coveredServices.map((s) => (
                                    <Chip key={s} label={s} size="small" color="success" variant="outlined" />
                                ))}
                            </Box>
                        </Box>
                    )}

                    {/* Missing */}
                    {result.uncoveredServices.length > 0 && (
                        <Box sx={{ mb: 1.5 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                Not covered — consider adding categories
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {result.uncoveredServices.map((s) => (
                                    <Chip key={s} label={s} size="small" color="error" variant="outlined" />
                                ))}
                            </Box>
                        </Box>
                    )}

                    {/* GPT-suggested categories */}
                    {result.suggestedCategories?.length > 0 && (
                        <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                Recommended categories to add
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                                {result.suggestedCategories.map((cat) => (
                                    <Box
                                        key={cat.name}
                                        sx={{
                                            p: 1,
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            borderRadius: 1,
                                            backgroundColor: 'background.paper',
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: 1,
                                        }}
                                    >
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="body2" fontWeight={500}>{cat.name}</Typography>
                                            {cat.description && (
                                                <Typography variant="caption" color="text.secondary">
                                                    {cat.description}
                                                </Typography>
                                            )}
                                        </Box>
                                        <Tooltip title="Add to business">
                                            <span>
                                                <IconButton
                                                    size="small"
                                                    color="primary"
                                                    disabled={adding === cat.name}
                                                    onClick={() => handleAddSuggested(cat)}
                                                >
                                                    {adding === cat.name
                                                        ? <CircularProgress size={16} />
                                                        : <AddCircleOutlineIcon fontSize="small" />}
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    )}
                </Box>
            )}
        </Box>
    );
};
