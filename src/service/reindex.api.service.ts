const API_URL = process.env.REACT_APP_API_URL;

export interface ReindexStatus {
    running: boolean;
    total: number;
    processed: number;
    failed: number;
    startedAt: string | null;
    finishedAt: string | null;
    lastError: string | null;
}

/** Kicks off a background reindex of every business; returns immediately. */
export const startReindexAll = async (): Promise<ReindexStatus> => {
    const response = await fetch(`${API_URL}/admin/business/reindex-all`, { method: 'POST' });
    if (!response.ok) throw new Error('Failed to start reindex');
    return response.json();
};

export const getReindexStatus = async (): Promise<ReindexStatus> => {
    const response = await fetch(`${API_URL}/admin/business/reindex-all/status`);
    if (!response.ok) throw new Error('Failed to fetch reindex status');
    return response.json();
};
