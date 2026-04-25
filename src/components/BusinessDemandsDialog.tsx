import React, { useCallback, useEffect, useState } from 'react';
import {
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useSnackbar } from '../contexts/SnackbarContext';
import {
    createAdminOfferForDemand,
    getBusinessDemandsPaginated,
    type AdminCreateOfferDto,
} from '../service/business.api.service';
import type { DemandResponseDto, PaginationMetaDto } from '../service/search.api.service';
import { DemandTableRow } from './DemandTableRow';
import { DemandEditOutletProvider } from '../contexts/DemandEditOutletContext';
import { OfferTimingEnum } from '../types/offerTiming';

const OFFER_TIMING_LABELS: Record<OfferTimingEnum, string> = {
    [OfferTimingEnum.TODAY]: 'Today',
    [OfferTimingEnum.THIS_WEEK]: 'This week',
    [OfferTimingEnum.AFTER_THIS_WEEK]: 'After this week',
};

interface BusinessDemandsDialogProps {
    businessId: string | null;
    /** Shown in the title and offer flow so staff know which business the offer is from. */
    businessName: string | null;
    isOpen: boolean;
    onClose: () => void;
}

export const BusinessDemandsDialog: React.FC<BusinessDemandsDialogProps> = ({
    businessId,
    businessName,
    isOpen,
    onClose,
}) => {
    const [businessDemands, setBusinessDemands] = useState<DemandResponseDto[]>([]);
    const [demandsMeta, setDemandsMeta] = useState<PaginationMetaDto | null>(null);
    const [isLoadingDemands, setIsLoadingDemands] = useState(false);
    const [offerDemand, setOfferDemand] = useState<DemandResponseDto | null>(null);
    const [offerComment, setOfferComment] = useState('');
    const [offerPrice, setOfferPrice] = useState('');
    const [offerTime, setOfferTime] = useState<OfferTimingEnum | ''>('');
    const [offerSubmitting, setOfferSubmitting] = useState(false);
    const { showError, showSuccess } = useSnackbar();

    const formatDateTime = (iso: string) => new Date(iso).toLocaleString();

    const refetchQuiet = useCallback(async () => {
        if (!businessId) return;
        try {
            const { items, meta } = await getBusinessDemandsPaginated(businessId, { page: 1, limit: 200 });
            setBusinessDemands(items);
            setDemandsMeta(meta);
        } catch {
            showError('Failed to fetch demands');
        }
    }, [businessId, showError]);

    useEffect(() => {
        if (!isOpen || !businessId) {
            return;
        }
        let cancelled = false;
        setIsLoadingDemands(true);
        (async () => {
            try {
                const { items, meta } = await getBusinessDemandsPaginated(businessId, { page: 1, limit: 200 });
                if (!cancelled) {
                    setBusinessDemands(items);
                    setDemandsMeta(meta);
                }
            } catch {
                if (!cancelled) {
                    showError('Failed to fetch demands');
                    setBusinessDemands([]);
                    setDemandsMeta(null);
                }
            } finally {
                if (!cancelled) setIsLoadingDemands(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [isOpen, businessId, showError]);

    useEffect(() => {
        if (!isOpen) {
            setOfferDemand(null);
            setOfferComment('');
            setOfferPrice('');
            setOfferTime('');
        }
    }, [isOpen]);

    const handleDialogExited = () => {
        setBusinessDemands([]);
        setDemandsMeta(null);
    };

    const closeOfferDialog = () => {
        setOfferDemand(null);
        setOfferComment('');
        setOfferPrice('');
        setOfferTime('');
    };

    const handleSubmitOffer = async () => {
        if (!offerDemand || !businessId) {
            showError('Missing demand or business');
            return;
        }
        const body: AdminCreateOfferDto = { businessId };
        const trimmed = offerComment.trim();
        if (trimmed) body.comment = trimmed;
        const priceNum = Number.parseFloat(offerPrice.trim());
        if (Number.isFinite(priceNum) && priceNum > 0) {
            body.price = priceNum;
        }
        if (offerTime) {
            body.time = offerTime;
        }

        setOfferSubmitting(true);
        try {
            await createAdminOfferForDemand(offerDemand.id, body);
            showSuccess('Offer submitted successfully!');
            closeOfferDialog();
        } catch {
            showError('Failed to create offer. Please try again.');
        } finally {
            setOfferSubmitting(false);
        }
    };

    const titleSuffix = businessName?.trim() ? ` — ${businessName.trim()}` : '';
    const truncatedList =
        demandsMeta !== null && businessDemands.length < demandsMeta.total;

    return (
        <>
            <DemandEditOutletProvider demands={businessDemands} onAfterMutation={() => void refetchQuiet()}>
                <Dialog
                    open={isOpen}
                    onClose={onClose}
                    maxWidth="lg"
                    fullWidth
                    TransitionProps={{ onExited: handleDialogExited }}
                >
                    <DialogTitle>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                            <Typography variant="h6" component="span">
                                Business demands{titleSuffix}
                            </Typography>
                            <IconButton onClick={onClose} aria-label="close">
                                <CloseIcon />
                            </IconButton>
                        </Box>
                    </DialogTitle>
                    <DialogContent>
                        {truncatedList && (
                            <Typography variant="caption" color="warning.main" display="block" sx={{ mb: 1 }}>
                                Showing {businessDemands.length} of {demandsMeta?.total} demands (raise limit in code if
                                needed).
                            </Typography>
                        )}
                        {isLoadingDemands ? (
                            <Box display="flex" justifyContent="center" my={4}>
                                <CircularProgress />
                            </Box>
                        ) : businessDemands.length === 0 ? (
                            <Typography variant="body1" color="text.secondary" align="center" sx={{ my: 4 }}>
                                No demands found for this business
                            </Typography>
                        ) : (
                            <TableContainer sx={{ mt: 1 }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>ID</TableCell>
                                            <TableCell>User ID</TableCell>
                                            <TableCell>Transcription</TableCell>
                                            <TableCell>Translation</TableCell>
                                            <TableCell>Category</TableCell>
                                            <TableCell>Status</TableCell>
                                            <TableCell>Created</TableCell>
                                            <TableCell>Updated</TableCell>
                                            <TableCell align="right">Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {businessDemands.map((demand) => (
                                            <DemandTableRow
                                                key={demand.id}
                                                demand={demand}
                                                variant="admin"
                                                size="small"
                                                onListChanged={() => void refetchQuiet()}
                                                formatDateTime={formatDateTime}
                                                extraActions={(d) => (
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        color="secondary"
                                                        onClick={() => {
                                                            setOfferDemand(d);
                                                            setOfferComment('');
                                                            setOfferPrice('');
                                                            setOfferTime('');
                                                        }}
                                                    >
                                                        Make offer
                                                    </Button>
                                                )}
                                            />
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </DialogContent>
                </Dialog>
            </DemandEditOutletProvider>

            <Dialog open={Boolean(offerDemand)} onClose={closeOfferDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">Make offer</Typography>
                        <IconButton onClick={closeOfferDialog} aria-label="close" size="small">
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {offerDemand && (
                        <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                                Offer on behalf of <strong>{businessName?.trim() || 'this business'}</strong>
                                {businessId ? (
                                    <Box component="span" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', ml: 0.5 }}>
                                        ({businessId})
                                    </Box>
                                ) : null}
                            </Typography>
                            <Typography variant="body2">
                                Demand #{offerDemand.id}: {offerDemand.translation ?? offerDemand.transcription ?? '—'}
                            </Typography>
                            <TextField
                                fullWidth
                                label="Comment"
                                value={offerComment}
                                onChange={(e) => setOfferComment(e.target.value)}
                                multiline
                                rows={3}
                                placeholder={
                                    businessName?.trim()
                                        ? `e.g. ${businessName.trim()} can help with …`
                                        : 'Optional details for the client'
                                }
                            />
                            <TextField
                                fullWidth
                                label="Price"
                                type="number"
                                value={offerPrice}
                                onChange={(e) => setOfferPrice(e.target.value)}
                                inputProps={{ min: 0, step: 'any' }}
                                placeholder="Optional"
                            />
                            <FormControl fullWidth>
                                <InputLabel id="offer-time-label">Timing</InputLabel>
                                <Select
                                    labelId="offer-time-label"
                                    label="Timing"
                                    value={offerTime}
                                    onChange={(e) => setOfferTime(e.target.value as OfferTimingEnum | '')}
                                >
                                    <MenuItem value="">
                                        <em>Not specified</em>
                                    </MenuItem>
                                    {(Object.values(OfferTimingEnum) as OfferTimingEnum[]).map((v) => (
                                        <MenuItem key={v} value={v}>
                                            {OFFER_TIMING_LABELS[v]}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeOfferDialog} disabled={offerSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={() => void handleSubmitOffer()} variant="contained" disabled={offerSubmitting}>
                        {offerSubmitting ? 'Submitting…' : 'Submit offer'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};
