import React from 'react';
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    Drawer,
    FormControl,
    IconButton,
    MenuItem,
    Select,
    Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import type { DemandResponseDto } from '../service/search.api.service';
import { DemandStatusEnum } from '../types/demandStatus';
import { demandStatusChipColor, formatDemandStatus } from '../utils/demandDisplay';

export interface DemandCategoryOption {
    id: string;
    name: string;
}

export interface DemandEditDrawerProps {
    open: boolean;
    onClose: () => void;
    demand: DemandResponseDto | null;
    categories: DemandCategoryOption[];
    isLoadingCategories: boolean;
    updatingDemandId: number | null;
    onCategoryChange: (demandId: number, categoryId: string) => void | Promise<void>;
    onAccept: (id: number) => void | Promise<void>;
    onReject: (id: number) => void | Promise<void>;
    onDelete: (id: number) => void | Promise<void>;
}

export const DemandEditDrawer: React.FC<DemandEditDrawerProps> = ({
    open,
    onClose,
    demand,
    categories,
    isLoadingCategories,
    updatingDemandId,
    onCategoryChange,
    onAccept,
    onReject,
    onDelete,
}) => {
    return (
        <Drawer anchor="right" open={open} onClose={onClose}>
            <Box sx={{ width: 400, maxWidth: '100vw', p: 3, boxSizing: 'border-box' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6">Edit demand</Typography>
                    <IconButton onClick={onClose} aria-label="Close">
                        <CloseIcon />
                    </IconButton>
                </Box>
                {demand && (
                    <Box>
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Transcription
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 2 }}>
                                {demand.transcription ?? '—'}
                            </Typography>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Translation
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 2 }}>
                                {demand.translation ?? '—'}
                            </Typography>
                            {demand.categoryMatchConfidence && (
                                <>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        Category match
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <Chip
                                            label={demand.categoryMatchConfidence}
                                            size="small"
                                            color={
                                                demand.categoryMatchConfidence === 'high'
                                                    ? 'success'
                                                    : demand.categoryMatchConfidence === 'medium'
                                                      ? 'warning'
                                                      : 'default'
                                            }
                                        />
                                    </Box>
                                    {demand.categoryMatchReason && (
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                            {demand.categoryMatchReason}
                                        </Typography>
                                    )}
                                </>
                            )}
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Status
                            </Typography>
                            <Chip
                                label={formatDemandStatus(demand.demandStatus)}
                                color={demandStatusChipColor(demand.demandStatus)}
                                size="small"
                                sx={{ mb: 3 }}
                            />
                        </Box>

                        <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mb: 1 }}>
                                Category
                            </Typography>
                            <FormControl fullWidth size="small">
                                <Select
                                    value={
                                        demand.category?.id ??
                                        demand.categoryId ??
                                        categories.find((c) => c.name === demand.category?.name)?.id ??
                                        ''
                                    }
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            void onCategoryChange(demand.id, e.target.value);
                                        }
                                    }}
                                    disabled={updatingDemandId === demand.id || isLoadingCategories}
                                    displayEmpty
                                >
                                    <MenuItem value="">
                                        <em>{demand.category?.name || 'No category'}</em>
                                    </MenuItem>
                                    {categories.map((category) => (
                                        <MenuItem key={category.id} value={category.id}>
                                            {category.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>

                        {demand.demandStatus === DemandStatusEnum.PENDING_REVIEW && (
                            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                <Button
                                    variant="contained"
                                    color="success"
                                    startIcon={
                                        updatingDemandId === demand.id ? (
                                            <CircularProgress size={16} />
                                        ) : (
                                            <CheckCircleIcon />
                                        )
                                    }
                                    onClick={() => void onAccept(demand.id)}
                                    disabled={updatingDemandId === demand.id}
                                    fullWidth
                                >
                                    Accept
                                </Button>
                                <Button
                                    variant="contained"
                                    color="error"
                                    startIcon={
                                        updatingDemandId === demand.id ? (
                                            <CircularProgress size={16} />
                                        ) : (
                                            <CancelIcon />
                                        )
                                    }
                                    onClick={() => void onReject(demand.id)}
                                    disabled={updatingDemandId === demand.id}
                                    fullWidth
                                >
                                    Reject
                                </Button>
                            </Box>
                        )}

                        <Button
                            variant="outlined"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={() => void onDelete(demand.id)}
                            fullWidth
                        >
                            Delete demand
                        </Button>
                    </Box>
                )}
            </Box>
        </Drawer>
    );
};
