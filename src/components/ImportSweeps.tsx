import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    LinearProgress,
    MenuItem,
    TextField,
    Typography,
} from '@mui/material';
import {
    cancelSweep,
    createSweep,
    IImportSweep,
    ISweepCell,
    listSweeps,
    pauseSweep,
    previewSweep,
    resumeSweep,
} from '../service/business-import.api.service';

const COST_PER_CALL_USD = 0.04;
const CELL_SIZES_KM = [0.5, 0.75, 1, 1.5, 2];
const POLL_MS = 4000;

const STATUS_COLOR: Record<IImportSweep['status'], 'primary' | 'warning' | 'success' | 'default'> = {
    running: 'primary',
    paused: 'warning',
    done: 'success',
    cancelled: 'default',
};

export type MapCell = { lat: number; lng: number; status?: ISweepCell['status'] };

interface Props {
    /** Show the "new sweep" form (sweep mode) or only the list of sweeps. */
    showForm: boolean;
    center: { lat: number; lng: number } | null;
    radiusKm: number;
    /** Cells to draw on the map: the planned grid, or the selected sweep's progress. */
    onMapCells: (cells: MapCell[] | null, cellRadiusKm: number) => void;
    /** A sweep added candidates to the review queue — reload it. */
    onNewCandidates: () => void;
}

/**
 * Sweeps: a large circle searched as a grid of small ones, one after another
 * on the server. Replaces clicking small circles one by one and waiting on
 * each — the server keeps going (and resumes after a restart), and new
 * candidates reach the queue while it runs.
 */
export const ImportSweeps: React.FC<Props> = ({ showForm, center, radiusKm, onMapCells, onNewCandidates }) => {
    const [cellRadiusKm, setCellRadiusKm] = useState(1);
    const [maxCallsPerCell, setMaxCallsPerCell] = useState(30);
    const [maxTotalCalls, setMaxTotalCalls] = useState(500);
    const [plannedCells, setPlannedCells] = useState<Array<{ lat: number; lng: number }> | null>(null);
    const [sweeps, setSweeps] = useState<IImportSweep[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const lastNewCandidates = useRef<Record<string, number>>({});
    const anyRunning = sweeps.some((s) => s.status === 'running');

    // Planned grid for the chosen area — drawn on the map before starting.
    useEffect(() => {
        if (!showForm || !center || cellRadiusKm >= radiusKm) {
            setPlannedCells(null);
            return;
        }
        const timer = setTimeout(() => {
            previewSweep({ centerLat: center.lat, centerLng: center.lng, radiusKm, cellRadiusKm })
                .then((p) => setPlannedCells(p.cells))
                .catch(() => setPlannedCells(null));
        }, 300);
        return () => clearTimeout(timer);
    }, [showForm, center, radiusKm, cellRadiusKm]);

    // Poll while anything is running; pick up new candidates as they land.
    useEffect(() => {
        let stopped = false;
        let timer: ReturnType<typeof setTimeout> | undefined;
        const tick = async () => {
            try {
                const list = await listSweeps();
                if (stopped) return;
                setSweeps(list);
                let grew = false;
                for (const s of list) {
                    const before = lastNewCandidates.current[s.id];
                    if (before !== undefined && s.newCandidates > before) grew = true;
                    lastNewCandidates.current[s.id] = s.newCandidates;
                }
                if (grew) onNewCandidates();
                if (list.some((s) => s.status === 'running')) timer = setTimeout(tick, POLL_MS);
            } catch {
                if (!stopped) timer = setTimeout(tick, POLL_MS * 3);
            }
        };
        void tick();
        return () => {
            stopped = true;
            if (timer) clearTimeout(timer);
        };
        // Restarts when a sweep starts or resumes, stops once none is running.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [anyRunning]);

    const selected = sweeps.find((s) => s.id === selectedId) ?? null;

    useEffect(() => {
        if (selected) onMapCells(selected.cells, selected.cellRadiusKm);
        else if (showForm && plannedCells) onMapCells(plannedCells, cellRadiusKm);
        else onMapCells(null, cellRadiusKm);
    }, [selected, showForm, plannedCells, cellRadiusKm, onMapCells]);

    const replace = (updated: IImportSweep) =>
        setSweeps((prev) => {
            const rest = prev.filter((s) => s.id !== updated.id);
            return [updated, ...rest].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        });

    const act = async (fn: () => Promise<IImportSweep>) => {
        setBusy(true);
        setError(null);
        try {
            replace(await fn());
        } catch (e: any) {
            setError(e.message ?? 'Request failed');
        } finally {
            setBusy(false);
        }
    };

    const handleStart = () =>
        center &&
        act(async () => {
            const sweep = await createSweep({
                centerLat: center.lat,
                centerLng: center.lng,
                radiusKm,
                cellRadiusKm,
                maxCallsPerCell,
                maxTotalCalls,
            });
            setSelectedId(sweep.id);
            return sweep;
        });

    const cellCount = plannedCells?.length ?? 0;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {showForm && (
                <>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                            select
                            size="small"
                            label="Cell radius"
                            value={cellRadiusKm}
                            onChange={(e) => setCellRadiusKm(Number(e.target.value))}
                            sx={{ flex: 1 }}
                        >
                            {CELL_SIZES_KM.map((km) => (
                                <MenuItem key={km} value={km}>{km} km</MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            size="small"
                            type="number"
                            label="Calls per cell"
                            value={maxCallsPerCell}
                            onChange={(e) => setMaxCallsPerCell(Math.max(1, Math.min(300, Number(e.target.value) || 1)))}
                            sx={{ flex: 1 }}
                        />
                    </Box>
                    <TextField
                        size="small"
                        type="number"
                        label="Call cap for the whole sweep"
                        value={maxTotalCalls}
                        onChange={(e) => setMaxTotalCalls(Math.max(1, Number(e.target.value) || 1))}
                        helperText={
                            center
                                ? cellRadiusKm >= radiusKm
                                    ? 'Make the area radius bigger than the cell radius.'
                                    : `${cellCount} cells, at least ${cellCount} calls (~$${(cellCount * COST_PER_CALL_USD).toFixed(2)}). ` +
                                      `Dense cells split further, up to ${maxCallsPerCell} calls each. ` +
                                      `Stops at ${maxTotalCalls} calls (~$${(maxTotalCalls * COST_PER_CALL_USD).toFixed(2)}).`
                                : 'Click the map to set the center of the area.'
                        }
                    />
                    <Button
                        variant="contained"
                        size="large"
                        onClick={handleStart}
                        disabled={!center || busy || cellCount === 0}
                        startIcon={busy ? <CircularProgress size={18} color="inherit" /> : undefined}
                    >
                        Start sweep ({cellCount} cells)
                    </Button>
                </>
            )}

            {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}

            {sweeps.length > 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="subtitle2">Sweeps</Typography>
                    {sweeps.map((s) => {
                        const done = s.cells.filter((c) => c.status === 'done' || c.status === 'failed').length;
                        const failed = s.cells.filter((c) => c.status === 'failed').length;
                        const isSelected = s.id === selectedId;
                        return (
                            <Box
                                key={s.id}
                                onClick={() => setSelectedId(isSelected ? null : s.id)}
                                sx={{
                                    p: 1.5,
                                    border: '1px solid',
                                    borderColor: isSelected ? 'primary.main' : 'divider',
                                    borderRadius: 1,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 0.75,
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Chip size="small" label={s.status} color={STATUS_COLOR[s.status]} />
                                    <Typography variant="body2" sx={{ flex: 1 }}>
                                        r={s.radiusKm} km · cells {s.cellRadiusKm} km
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {new Date(s.createdAt).toLocaleString()}
                                    </Typography>
                                </Box>
                                <LinearProgress
                                    variant="determinate"
                                    value={s.cells.length ? (done / s.cells.length) * 100 : 0}
                                />
                                <Typography variant="caption" color="text.secondary">
                                    {done}/{s.cells.length} cells{failed ? ` (${failed} failed)` : ''} ·{' '}
                                    {s.callsUsed}/{s.maxTotalCalls} calls (~${(s.callsUsed * COST_PER_CALL_USD).toFixed(2)}) ·{' '}
                                    {s.placesFound} places · <b>{s.newCandidates} new</b>
                                </Typography>
                                {s.status === 'running' && (
                                    <Typography variant="caption" color="primary">
                                        Working on cell {done + 1} of {s.cells.length}. Its places are scraped and
                                        judged first, then land in the queue together — a dense cell can take several minutes.
                                    </Typography>
                                )}
                                {/* Only a paused sweep is waiting on the admin; on a finished or
                                    cancelled one the reason it once stopped is history. */}
                                {s.status === 'paused' && s.lastError && (
                                    <Alert severity="warning" sx={{ py: 0 }}>{s.lastError}</Alert>
                                )}
                                <Box sx={{ display: 'flex', gap: 1 }} onClick={(e) => e.stopPropagation()}>
                                    {s.status === 'running' && (
                                        <Button size="small" disabled={busy} onClick={() => act(() => pauseSweep(s.id))}>
                                            Pause
                                        </Button>
                                    )}
                                    {s.status === 'paused' && (
                                        <>
                                            <Button size="small" disabled={busy} onClick={() => act(() => resumeSweep(s.id))}>
                                                Resume
                                            </Button>
                                            {s.callsUsed >= s.maxTotalCalls && (
                                                <Button
                                                    size="small"
                                                    disabled={busy}
                                                    onClick={() => act(() => resumeSweep(s.id, s.maxTotalCalls + 250))}
                                                >
                                                    +250 calls & resume
                                                </Button>
                                            )}
                                        </>
                                    )}
                                    {(s.status === 'running' || s.status === 'paused') && (
                                        <Button size="small" color="error" disabled={busy} onClick={() => act(() => cancelSweep(s.id))}>
                                            Cancel
                                        </Button>
                                    )}
                                </Box>
                            </Box>
                        );
                    })}
                </Box>
            )}
        </Box>
    );
};
