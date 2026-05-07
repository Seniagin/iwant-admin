import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Chip, CircularProgress, IconButton, Link, TableCell, TableRow, Tooltip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { deleteDemand, notifyBusinesses, type DemandResponseDto } from '../service/search.api.service';
import { useSnackbar } from '../contexts/SnackbarContext';
import { DemandEditOutletContext } from '../contexts/DemandEditOutletContext';
import { demandStatusChipColor, demandTextPreview, formatDemandStatus } from '../utils/demandDisplay';

const confidenceChip = (confidence?: 'high' | 'medium' | 'low' | null, reason?: string | null) => {
    if (!confidence) return null;
    const color = confidence === 'high' ? 'success' : confidence === 'medium' ? 'warning' : 'error';
    return (
        <Tooltip title={reason ?? ''} placement="top" arrow>
            <Chip label={confidence} color={color} size="small" sx={{ ml: 0.5, cursor: reason ? 'help' : 'default' }} />
        </Tooltip>
    );
};

export type DemandTableRowVariant = 'admin' | 'userProfile';

export interface DemandTableRowProps {
    demand: DemandResponseDto;
    variant: DemandTableRowVariant;
    size?: 'small' | 'medium';
    /** Refetch list after delete (and optional other local sync). */
    onListChanged: () => void | Promise<void>;
    formatDateTime: (iso: string) => string;
    /** When false, no actions column (default true). */
    showActions?: boolean;
    /** Extra controls in the actions cell (e.g. business-context “Make offer”). */
    extraActions?: (demand: DemandResponseDto) => React.ReactNode;
    /** Extra <TableCell> rendered between Status and Created in the admin variant. */
    extraCell?: (demand: DemandResponseDto) => React.ReactNode;
}

export const DemandTableRow: React.FC<DemandTableRowProps> = ({
    demand,
    variant,
    size = 'medium',
    onListChanged,
    formatDateTime,
    showActions = true,
    extraActions,
    extraCell,
}) => {
    const { showSuccess, showError } = useSnackbar();
    const editOutlet = useContext(DemandEditOutletContext);
    const navigate = useNavigate();
    const [pending, setPending] = useState<'notify' | 'delete' | null>(null);

    const handleNotify = async () => {
        setPending('notify');
        try {
            await notifyBusinesses(demand.id);
            showSuccess('Businesses notified successfully!');
        } catch {
            showError('Failed to notify businesses. Please try again.');
        } finally {
            setPending(null);
        }
    };

    const handleDelete = async () => {
        setPending('delete');
        try {
            await deleteDemand(demand.id);
            showSuccess('Demand deleted successfully!');
            await onListChanged();
        } catch {
            showError('Failed to delete demand. Please try again.');
        } finally {
            setPending(null);
        }
    };

    const isSmall = size === 'small';
    const busyNotify = pending === 'notify';
    const busyDelete = pending === 'delete';

    const actionsCell = showActions && (
        <TableCell align="right" size={isSmall ? 'small' : 'medium'} sx={{ whiteSpace: 'nowrap' }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'flex-end', alignItems: 'center' }}>
                {extraActions?.(demand)}
                <IconButton
                    color="info"
                    onClick={() => void handleNotify()}
                    disabled={busyNotify || busyDelete}
                    size="small"
                    title="Notify businesses"
                >
                    {busyNotify ? <CircularProgress size={20} /> : <NotificationsIcon />}
                </IconButton>
                {editOutlet && (
                    <IconButton
                        color="primary"
                        onClick={() => editOutlet.openEdit(demand)}
                        disabled={busyDelete}
                        size="small"
                        title="Edit"
                    >
                        <EditIcon />
                    </IconButton>
                )}
                <IconButton
                    color="error"
                    onClick={() => void handleDelete()}
                    disabled={busyNotify || busyDelete}
                    size="small"
                    title="Delete"
                >
                    {busyDelete ? <CircularProgress size={20} /> : <DeleteIcon />}
                </IconButton>
            </Box>
        </TableCell>
    );

    if (variant === 'userProfile') {
        return (
            <TableRow hover>
                <TableCell sx={{ fontFamily: 'monospace' }} size={isSmall ? 'small' : 'medium'}>
                    {demand.id}
                </TableCell>
                <TableCell
                    size={isSmall ? 'small' : 'medium'}
                    sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}
                >
                    {demandTextPreview(demand, 120)}
                </TableCell>
                <TableCell size={isSmall ? 'small' : 'medium'}>
                    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
                        {demand.category?.name ?? '—'}
                        {confidenceChip(demand.categoryMatchConfidence, demand.categoryMatchReason)}
                    </Box>
                </TableCell>
                <TableCell size={isSmall ? 'small' : 'medium'}>
                    <Chip
                        size="small"
                        label={formatDemandStatus(demand.demandStatus)}
                        color={demandStatusChipColor(demand.demandStatus)}
                    />
                </TableCell>
                <TableCell size={isSmall ? 'small' : 'medium'}>{formatDateTime(demand.createdAt)}</TableCell>
                {actionsCell}
            </TableRow>
        );
    }

    const cellSize = isSmall ? 'small' : 'medium';

    return (
        <TableRow>
            <TableCell component="th" scope="row" sx={{ fontFamily: 'monospace' }} size={cellSize}>
                {demand.id}
            </TableCell>
            <TableCell sx={{ fontFamily: 'monospace' }} size={cellSize}>
                {demand.userId}
            </TableCell>
            <TableCell size={cellSize}>{demand.transcription ?? '—'}</TableCell>
            <TableCell size={cellSize}>{demand.translation ?? '—'}</TableCell>
            <TableCell size={cellSize}>
                <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
                    {demand.category ? (
                        <Link
                            component="button"
                            underline="hover"
                            onClick={() =>
                                navigate(`/categories/${demand.category!.id}/businesses`, {
                                    state: {
                                        categoryName: demand.category!.name,
                                        latitude: demand.user?.location?.latitude,
                                        longitude: demand.user?.location?.longitude,
                                    },
                                })
                            }
                            sx={{ cursor: 'pointer', textAlign: 'left' }}
                        >
                            {demand.category.name}
                        </Link>
                    ) : (
                        'No category'
                    )}
                    {confidenceChip(demand.categoryMatchConfidence, demand.categoryMatchReason)}
                </Box>
            </TableCell>
            <TableCell size={cellSize}>
                <Chip
                    label={formatDemandStatus(demand.demandStatus)}
                    color={demandStatusChipColor(demand.demandStatus)}
                    size="small"
                />
            </TableCell>
            {extraCell && <TableCell size={cellSize} align="center">{extraCell(demand)}</TableCell>}
            <TableCell size={cellSize}>{formatDateTime(demand.createdAt)}</TableCell>
            <TableCell size={cellSize}>{formatDateTime(demand.updatedAt)}</TableCell>
            {actionsCell}
        </TableRow>
    );
};
