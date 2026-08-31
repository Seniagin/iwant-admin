import React, { useState, useEffect, useCallback } from 'react';
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    FormControlLabel,
    MenuItem,
    Paper,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { RightDrawer } from '../components/common/RightDrawer';
import { ReindexPanel } from '../components/common/ReindexPanel';
import { useReindex } from '../utils/hooks/useReindex';
import { useSnackbar } from '../contexts/SnackbarContext';
import {
    createFacet,
    deleteFacet,
    getFacets,
    updateFacet,
    FacetRole,
    FacetValueType,
    IFacet,
} from '../service/facets.api.service';

const ROLES: { value: FacetRole; label: string; hint: string }[] = [
    { value: 'vector', label: 'Vector', hint: 'Fuzzy similarity axis — what search actually compares' },
    { value: 'filter', label: 'Filter', hint: 'Categorical hard gate — excludes non-matching businesses' },
    { value: 'ranking', label: 'Ranking', hint: 'Only reorders businesses that already qualified' },
    { value: 'display', label: 'Display', hint: 'Shown to people, does not affect search' },
];

const VALUE_TYPES: { value: FacetValueType; label: string }[] = [
    { value: 'enum', label: 'Enum (closed set)' },
    { value: 'text_list', label: 'Text list (open)' },
    { value: 'text', label: 'Text (single)' },
    { value: 'number', label: 'Number' },
    { value: 'boolean', label: 'Yes / no' },
];

const ROLE_COLOR: Record<FacetRole, 'primary' | 'error' | 'warning' | 'default'> = {
    vector: 'primary',
    filter: 'error',
    ranking: 'warning',
    display: 'default',
};

const EMPTY_FORM = {
    key: '',
    label: '',
    description: '',
    extractionPrompt: '',
    valueType: 'text_list' as FacetValueType,
    allowedValues: '',
    role: 'display' as FacetRole,
    enabled: true,
    sortOrder: 0,
};

export const FacetsPage: React.FC = () => {
    const [facets, setFacets] = useState<IFacet[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editing, setEditing] = useState<IFacet | null>(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const { showSuccess, showError } = useSnackbar();

    const fetchFacets = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            setFacets(await getFacets());
        } catch (e: any) {
            setError(e.message ?? 'Failed to fetch parameters');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchFacets(); }, [fetchFacets]);

    // Counts only move when businesses are re-processed, so refresh them the
    // moment a run ends rather than making someone reload to see the effect of
    // a prompt they just edited.
    const reindex = useReindex(fetchFacets);

    const openCreate = () => {
        setEditing(null);
        setForm(EMPTY_FORM);
        setIsDrawerOpen(true);
    };

    const openEdit = (facet: IFacet) => {
        setEditing(facet);
        setForm({
            key: facet.key,
            label: facet.label,
            description: facet.description ?? '',
            extractionPrompt: facet.extractionPrompt ?? '',
            valueType: facet.valueType,
            allowedValues: (facet.allowedValues ?? []).join(', '),
            role: facet.role,
            enabled: facet.enabled,
            sortOrder: facet.sortOrder,
        });
        setIsDrawerOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const allowedValues = form.allowedValues
            .split(',')
            .map((v) => v.trim())
            .filter(Boolean);

        const payload = {
            key: form.key.trim(),
            label: form.label.trim(),
            description: form.description.trim() || null,
            extractionPrompt: form.extractionPrompt.trim() || null,
            valueType: form.valueType,
            allowedValues: allowedValues.length > 0 ? allowedValues : null,
            role: form.role,
            enabled: form.enabled,
            sortOrder: Number(form.sortOrder) || 0,
        };

        try {
            setSaving(true);
            if (editing) {
                await updateFacet(editing.id, payload);
                showSuccess(`Parameter "${payload.label}" updated`);
            } else {
                await createFacet(payload);
                showSuccess(`Parameter "${payload.label}" created`);
            }
            setIsDrawerOpen(false);
            await fetchFacets();
        } catch (err: any) {
            showError(err.message ?? 'Failed to save parameter');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (facet: IFacet) => {
        if (!window.confirm(`Delete parameter "${facet.label}"?`)) return;
        try {
            await deleteFacet(facet.id);
            showSuccess(`Parameter "${facet.label}" deleted`);
            await fetchFacets();
        } catch (err: any) {
            showError(err.message ?? 'Failed to delete parameter');
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start', mb: 2, flexWrap: 'wrap' }}>
                <Box sx={{ flex: '1 1 420px' }}>
                    <Typography variant="h5" fontWeight={700} gutterBottom>
                        Business vectorization parameters
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Fields extracted from each business description. <strong>Vector</strong> is the
                        similarity axis search compares against; <strong>filter</strong> excludes
                        non-matching businesses outright; <strong>ranking</strong> only reorders ones that
                        already qualified. An empty value never excludes a business.
                    </Typography>
                </Box>
                <Paper sx={{ p: 2, width: 340, flex: '0 0 auto' }}>
                    <ReindexPanel
                        status={reindex.status}
                        error={reindex.error}
                        onStart={reindex.start}
                        hint="Editing a prompt changes nothing until businesses are re-processed. Run this
                              after adding or rewriting a parameter; counts below refresh when it ends."
                    />
                </Paper>
            </Box>

            {isLoading ? (
                <Box display="flex" justifyContent="center" my={4}><CircularProgress /></Box>
            ) : error ? (
                <Alert severity="error">{error}</Alert>
            ) : (
                <Paper>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Parameter</TableCell>
                                    <TableCell>Key</TableCell>
                                    <TableCell>Role</TableCell>
                                    <TableCell>Value type</TableCell>
                                    <TableCell>Allowed values</TableCell>
                                    <TableCell align="center">
                                        Businesses
                                        <Typography variant="caption" color="text.secondary" display="block">
                                            as of last reindex
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="center">Enabled</TableCell>
                                    <TableCell align="right">
                                        <Button size="small" startIcon={<AddIcon />} onClick={openCreate}>
                                            Add parameter
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {facets.map((facet) => (
                                    <TableRow key={facet.id} hover sx={{ opacity: facet.enabled ? 1 : 0.5 }}>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={600}>{facet.label}</Typography>
                                            {/* An enabled parameter with no prompt is silently skipped —
                                                the one failure mode this table can't otherwise show. */}
                                            {facet.enabled && !facet.extractionPrompt?.trim() && (
                                                <Chip label="no prompt — not extracted" size="small"
                                                    color="warning" variant="outlined" sx={{ mt: 0.5 }} />
                                            )}
                                            {facet.valueType === 'enum' && !facet.allowedValues?.length && (
                                                <Chip label="enum without allowed values" size="small"
                                                    color="warning" variant="outlined" sx={{ mt: 0.5 }} />
                                            )}
                                            {facet.description && (
                                                <Typography variant="caption" color="text.secondary"
                                                    sx={{ display: 'block', maxWidth: 380 }}>
                                                    {facet.description}
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <code style={{ fontSize: '0.75rem' }}>{facet.key}</code>
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={facet.role} size="small" color={ROLE_COLOR[facet.role]} />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="caption">{facet.valueType}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, maxWidth: 280 }}>
                                                {(facet.allowedValues ?? []).map((v) => (
                                                    <Chip key={v} label={v} size="small" variant="outlined" />
                                                ))}
                                                {!facet.allowedValues?.length && (
                                                    <Typography variant="caption" color="text.secondary">—</Typography>
                                                )}
                                            </Box>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={facet.businessCount}
                                                size="small"
                                                color={facet.businessCount > 0 ? 'primary' : 'default'}
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            {facet.enabled ? '✓' : '—'}
                                        </TableCell>
                                        <TableCell align="right">
                                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                                <Button size="small" variant="outlined" onClick={() => openEdit(facet)}>
                                                    Edit
                                                </Button>
                                                <Button size="small" variant="outlined" color="error"
                                                    onClick={() => handleDelete(facet)}>
                                                    Delete
                                                </Button>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}

            <RightDrawer
                name={editing ? 'Edit parameter' : 'Add parameter'}
                isOpen={isDrawerOpen}
                setIsDrawerOpen={setIsDrawerOpen}
            >
                <Box component="form" onSubmit={handleSave} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                        label="Key" required size="small" value={form.key}
                        onChange={(e) => setForm({ ...form, key: e.target.value })}
                        helperText="Machine name used in the extracted value object"
                    />
                    <TextField
                        label="Label" required size="small" value={form.label}
                        onChange={(e) => setForm({ ...form, label: e.target.value })}
                    />
                    <TextField
                        label="Extraction prompt" size="small" multiline rows={4}
                        value={form.extractionPrompt}
                        onChange={(e) => setForm({ ...form, extractionPrompt: e.target.value })}
                        helperText="What the AI is told to look for. This text goes into the prompt verbatim — leave empty to skip this parameter during extraction."
                    />
                    <TextField
                        label="Notes" size="small" multiline rows={3} value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        helperText="For humans only, never sent to the AI"
                    />
                    <TextField
                        select label="Role" size="small" value={form.role}
                        onChange={(e) => setForm({ ...form, role: e.target.value as FacetRole })}
                        helperText={ROLES.find((r) => r.value === form.role)?.hint}
                    >
                        {ROLES.map((r) => <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>)}
                    </TextField>
                    <TextField
                        select label="Value type" size="small" value={form.valueType}
                        onChange={(e) => setForm({ ...form, valueType: e.target.value as FacetValueType })}
                    >
                        {VALUE_TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                    </TextField>
                    <TextField
                        label="Allowed values" size="small" value={form.allowedValues}
                        onChange={(e) => setForm({ ...form, allowedValues: e.target.value })}
                        helperText="Comma-separated. Only meaningful for enum — extraction drops anything outside this set."
                    />
                    <TextField
                        label="Sort order" type="number" size="small" value={form.sortOrder}
                        onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                    />
                    <FormControlLabel
                        control={<Switch checked={form.enabled}
                            onChange={(e) => setForm({ ...form, enabled: e.target.checked })} />}
                        label="Enabled"
                    />
                    <Button type="submit" variant="contained" fullWidth disabled={saving}>
                        {saving ? 'Saving…' : editing ? 'Save changes' : 'Create parameter'}
                    </Button>
                </Box>
            </RightDrawer>
        </Box>
    );
};
