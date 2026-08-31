import { useCallback, useEffect, useRef, useState } from 'react';
import {
    getReindexStatus,
    startReindexAll,
    ReindexStatus,
} from '../../service/reindex.api.service';

const POLL_INTERVAL_MS = 2000;

/**
 * Tracks the background business reindex.
 *
 * Progress lives in backend memory rather than the DB, so the only way to learn
 * about a run is to ask: once on mount (to pick up one already in flight, e.g.
 * after a page reload) and then on a timer for as long as it lasts.
 *
 * `onFinished` fires once per run, on the observed running -> not-running
 * transition, so a page can refresh whatever the reindex just rewrote. A run
 * that had already finished before mount does not fire it — nothing changed
 * while the page was watching.
 */
export function useReindex(onFinished?: () => void) {
    const [status, setStatus] = useState<ReindexStatus | null>(null);
    const [error, setError] = useState<string | null>(null);
    const wasRunning = useRef(false);
    const onFinishedRef = useRef(onFinished);

    useEffect(() => {
        onFinishedRef.current = onFinished;
    }, [onFinished]);

    const refresh = useCallback(async () => {
        try {
            const next = await getReindexStatus();
            setStatus(next);
            if (wasRunning.current && !next.running) onFinishedRef.current?.();
            wasRunning.current = next.running;
        } catch {
            // Best-effort poll: a blip should not replace the panel with an error.
        }
    }, []);

    useEffect(() => { refresh(); }, [refresh]);

    useEffect(() => {
        if (!status?.running) return;
        const timer = setInterval(refresh, POLL_INTERVAL_MS);
        return () => clearInterval(timer);
    }, [status?.running, refresh]);

    const start = useCallback(async () => {
        setError(null);
        try {
            const next = await startReindexAll();
            setStatus(next);
            wasRunning.current = next.running;
        } catch (e: any) {
            setError(e.message ?? 'Failed to start reindex');
        }
    }, []);

    return { status, error, start, refresh };
}
