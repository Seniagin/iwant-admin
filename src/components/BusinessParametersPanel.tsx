import React, { useEffect, useState } from 'react';
import {
    Alert,
    Box,
    Chip,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import { getBusinessParameters, type IBusinessParameter } from '../service/business.api.service';

interface Props {
    businessId: string;
    /** Bump to refetch — e.g. after Reconcile re-extracts the parameters. */
    resetKey?: unknown;
}

const isEmpty = (value: IBusinessParameter['value']): boolean =>
    value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0);

/** Booleans are stored stringified, so they read as "true"/"false" without this. */
const renderValue = (param: IBusinessParameter): React.ReactNode => {
    if (Array.isArray(param.value)) {
        return (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {param.value.map((v) => <Chip key={v} label={v} size="small" variant="outlined" />)}
            </Box>
        );
    }
    if (param.valueType === 'boolean') return param.value === 'true' ? 'Yes' : 'No';
    return param.value;
};

/**
 * What was actually extracted from a business description, parameter by
 * parameter. Every registered parameter is listed, including the ones that came
 * back empty — a gap is the useful answer as often as a value is.
 */
export const BusinessParametersPanel: React.FC<Props> = ({ businessId, resetKey }) => {
    const [params, setParams] = useState<IBusinessParameter[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError(null);
        getBusinessParameters(businessId)
            .then((items) => { if (active) setParams(items); })
            .catch(() => { if (active) setError('Failed to load parameters'); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [businessId, resetKey]);

    // A disabled parameter that still holds a value is real data and stays
    // visible; a disabled one with nothing in it is just noise.
    const visible = (params ?? []).filter((p) => p.enabled || !isEmpty(p.value));
    const filled = visible.filter((p) => !isEmpty(p.value));

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography sx={{
                    fontSize: 10, fontWeight: 800, letterSpacing: '0.12em',
                    textTransform: 'uppercase', color: '#0ea5e9',
                }}>
                    Parameters
                </Typography>
                {visible.length > 0 && (
                    <Typography variant="caption" color="text.secondary">
                        {filled.length} of {visible.length} extracted
                    </Typography>
                )}
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                Pulled from this business's description by the parameters defined on the
                Parameters page. Run <strong>Reconcile</strong> to re-extract them.
            </Typography>

            {loading ? (
                <Box display="flex" justifyContent="center" py={2}><CircularProgress size={22} /></Box>
            ) : error ? (
                <Alert severity="error">{error}</Alert>
            ) : visible.length === 0 ? (
                <Alert severity="info">No parameters defined yet.</Alert>
            ) : filled.length === 0 ? (
                <Alert severity="warning">
                    Nothing extracted for this business yet — run <strong>Reconcile</strong> to
                    process its description.
                </Alert>
            ) : (
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell width="34%">Parameter</TableCell>
                                <TableCell>Value</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {visible.map((param) => {
                                const empty = isEmpty(param.value);
                                return (
                                    <TableRow key={param.key} hover sx={{ opacity: empty ? 0.45 : 1 }}>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={600}>{param.label}</Typography>
                                            <code style={{ fontSize: '0.7rem', color: '#64748b' }}>{param.key}</code>
                                            {!param.enabled && (
                                                <Chip label="disabled" size="small" variant="outlined"
                                                    sx={{ ml: 1, height: 18, fontSize: '0.65rem' }} />
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {empty
                                                ? <Typography variant="caption" color="text.secondary">—</Typography>
                                                : renderValue(param)}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    );
};
