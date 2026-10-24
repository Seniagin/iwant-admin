import React, { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Alert,
    Card,
    CardContent,
    Button,
    Link as MuiLink,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import {
    listBusinessClaims,
    approveBusinessClaim,
    rejectBusinessClaim,
    IBusinessClaimRequest,
} from '../service/business-claim.api.service';

export const BusinessClaimsPage: React.FC = () => {
    const [claims, setClaims] = useState<IBusinessClaimRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [reviewingId, setReviewingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const load = () => {
        setLoading(true);
        listBusinessClaims('pending')
            .then(setClaims)
            .catch((e: any) => setError(e.message ?? 'Failed to load claims'))
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    const handleApprove = async (claim: IBusinessClaimRequest) => {
        setReviewingId(claim.id);
        setError(null);
        try {
            await approveBusinessClaim(claim.id);
            setClaims((prev) => prev.filter((c) => c.id !== claim.id));
        } catch (e: any) {
            setError(e.message ?? 'Approve failed');
        } finally {
            setReviewingId(null);
        }
    };

    const handleReject = async (claim: IBusinessClaimRequest) => {
        setReviewingId(claim.id);
        setError(null);
        try {
            await rejectBusinessClaim(claim.id);
            setClaims((prev) => prev.filter((c) => c.id !== claim.id));
        } catch (e: any) {
            setError(e.message ?? 'Reject failed');
        } finally {
            setReviewingId(null);
        }
    };

    return (
        <Box sx={{ p: 3, maxWidth: 800 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
                🏷️ Business ownership claims
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Owners asking to take over a listing that has no owner yet. Before approving,
                confirm it's really them — e.g. call the listing's phone and ask about the
                account's email. Approving one claim rejects the other claims on the same listing.
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {loading ? (
                <Typography variant="body2">Loading…</Typography>
            ) : claims.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                    Nothing pending.
                </Typography>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {claims.map((claim) => (
                        <Card key={claim.id} variant="outlined">
                            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <Typography variant="subtitle1" fontWeight={600}>
                                    <MuiLink component={RouterLink} to={`/businesses/${claim.businessId}`}>
                                        {claim.business?.name ?? claim.businessId}
                                    </MuiLink>
                                    {claim.business?.hasOwner && (
                                        <Typography component="span" variant="caption" color="error" sx={{ ml: 1 }}>
                                            already has an owner
                                        </Typography>
                                    )}
                                </Typography>
                                {claim.business?.address && (
                                    <Typography variant="caption" color="text.secondary">
                                        {claim.business.address}
                                    </Typography>
                                )}
                                <Typography variant="body2" color="text.primary">
                                    Listing phone: <strong>{claim.business?.phone ?? '—'}</strong>
                                    {claim.business?.website && (
                                        <>
                                            {' · '}
                                            <MuiLink href={claim.business.website} target="_blank" rel="noopener">
                                                website
                                            </MuiLink>
                                        </>
                                    )}
                                    {claim.business?.googleMapsUrl && (
                                        <>
                                            {' · '}
                                            <MuiLink href={claim.business.googleMapsUrl} target="_blank" rel="noopener">
                                                Google Maps
                                            </MuiLink>
                                        </>
                                    )}
                                </Typography>
                                <Typography variant="body2" color="text.primary">
                                    Claimed by:{' '}
                                    <MuiLink
                                        component={RouterLink}
                                        to={`/business-users/${claim.userId}`}
                                    >
                                        {claim.account?.email ?? `account #${claim.userId}`}
                                    </MuiLink>
                                </Typography>
                                <Typography variant="body2" color={claim.note ? 'text.primary' : 'text.secondary'}>
                                    Their note: {claim.note ?? '(none)'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Submitted {new Date(claim.createdAt).toLocaleString()}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                    <Button
                                        size="small"
                                        variant="contained"
                                        color="success"
                                        disabled={reviewingId === claim.id}
                                        onClick={() => handleApprove(claim)}
                                    >
                                        Approve
                                    </Button>
                                    <Button
                                        size="small"
                                        color="error"
                                        disabled={reviewingId === claim.id}
                                        onClick={() => handleReject(claim)}
                                    >
                                        Reject
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                    ))}
                </Box>
            )}
        </Box>
    );
};
