const API_URL = process.env.REACT_APP_API_URL;

export type CandidateStatus = 'pending' | 'approved' | 'rejected' | 'filtered';

export interface IImportedBusinessCandidate {
    id: string;
    placeId: string;
    name: string;
    address: string | null;
    location: { latitude: number; longitude: number };
    website: string | null;
    phone: string | null;
    instagramUrl: string | null;
    facebookUrl: string | null;
    googleMapsUrl: string | null;
    rawScrapeExcerpt: string | null;
    description: string | null;
    descriptionRu: string | null;
    status: CandidateStatus;
    businessId: string | null;
    /** Google Maps rating; null when unrated or not fetched yet. */
    googleRating: number | null;
    googleRatingCount: number | null;
    /** AI-approve judge's last score; null until the AI has reviewed it. */
    aiConfidence: number | null;
    aiJudgedAt: string | null;
    createdAt: string;
    reviewedAt: string | null;
}

export interface IBusinessImportSearchResult {
    candidates: IImportedBusinessCandidate[];
    search: {
        places: number;
        calls: number;
        estimatedCostUsd: number;
        /** Areas still returning 20 places, left unsearched when the call cap ran out. */
        unexploredCells: number;
        /** Areas still returning 20 places at the smallest cell size. */
        saturatedAtMinSize: number;
    };
}

export const searchBusinessImportArea = async (dto: {
    centerLat: number;
    centerLng: number;
    radiusKm: number;
    maxCalls: number;
}): Promise<IBusinessImportSearchResult> => {
    const response = await fetch(`${API_URL}/admin/business-import/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
    });
    if (!response.ok) throw new Error('Search failed');
    return response.json();
};

export const listBusinessImportCandidates = async (
    status?: CandidateStatus,
): Promise<IImportedBusinessCandidate[]> => {
    const query = status ? `?status=${status}` : '';
    const response = await fetch(`${API_URL}/admin/business-import/candidates${query}`);
    if (!response.ok) throw new Error('Failed to load candidates');
    return response.json();
};

export const approveBusinessImportCandidate = async (
    id: string,
): Promise<{ businessId: string; categories: string[]; duplicateOf: string | null }> => {
    const response = await fetch(`${API_URL}/admin/business-import/candidates/${id}/approve`, {
        method: 'POST',
    });
    if (response.status === 409) throw new Error('Already reviewed (another approve got there first)');
    if (!response.ok) throw new Error('Approve failed');
    return response.json();
};

export const rejectBusinessImportCandidate = async (id: string): Promise<void> => {
    const response = await fetch(`${API_URL}/admin/business-import/candidates/${id}/reject`, {
        method: 'POST',
    });
    if (!response.ok) throw new Error('Reject failed');
};

export interface AutoApproveResult {
    approved: Array<{ id: string; name: string; confidence: number; categories: string[] }>;
    linkedToExisting: Array<{ id: string; name: string; existingName: string }>;
    leftPending: Array<{ id: string; name: string; confidence: number | null; reason: string }>;
}

/** `all` = regress: re-judge every pending candidate, not only unscored ones. */
export const autoApproveBusinessImportCandidates = async (all = false): Promise<AutoApproveResult> => {
    const path = all ? 'auto-approve/all' : 'auto-approve';
    const response = await fetch(`${API_URL}/admin/business-import/candidates/${path}`, {
        method: 'POST',
    });
    if (response.status === 409) throw new Error('AI approve is already running');
    if (!response.ok) throw new Error('AI approve failed');
    return response.json();
};

export const translateBusinessImportCandidate = async (
    id: string,
): Promise<{ descriptionRu: string | null }> => {
    const response = await fetch(`${API_URL}/admin/business-import/candidates/${id}/translate`, {
        method: 'POST',
    });
    if (!response.ok) throw new Error('Translate failed');
    return response.json();
};

// ── Area sweeps: a big circle searched as a grid of small ones, in the background ──

export type SweepStatus = 'running' | 'paused' | 'done' | 'cancelled';
export type SweepCellStatus = 'pending' | 'running' | 'done' | 'failed';

export interface ISweepCell {
    lat: number;
    lng: number;
    status: SweepCellStatus;
    calls: number;
    places: number;
    newCandidates: number;
    unexploredCells: number;
    error: string | null;
}

export interface IImportSweep {
    id: string;
    centerLat: number;
    centerLng: number;
    radiusKm: number;
    cellRadiusKm: number;
    maxCallsPerCell: number;
    maxTotalCalls: number;
    status: SweepStatus;
    cells: ISweepCell[];
    callsUsed: number;
    placesFound: number;
    newCandidates: number;
    lastError: string | null;
    createdAt: string;
    finishedAt: string | null;
}

export interface ISweepPlan {
    centerLat: number;
    centerLng: number;
    radiusKm: number;
    cellRadiusKm: number;
}

async function sweepRequest<T>(path: string, body?: unknown): Promise<T> {
    const response = await fetch(`${API_URL}/admin/business-import/sweeps${path}`, {
        method: body === undefined ? 'GET' : 'POST',
        headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message ?? `Sweep request failed (${response.status})`);
    }
    return response.json();
}

export const previewSweep = (plan: ISweepPlan) =>
    sweepRequest<{ cells: Array<{ lat: number; lng: number }>; cellCount: number }>('/preview', plan);

export const createSweep = (dto: ISweepPlan & { maxCallsPerCell: number; maxTotalCalls: number }) =>
    sweepRequest<IImportSweep>('', dto);

export const listSweeps = () => sweepRequest<IImportSweep[]>('');

export const pauseSweep = (id: string) => sweepRequest<IImportSweep>(`/${id}/pause`, {});

/** `maxTotalCalls` raises the sweep's call cap before resuming it. */
export const resumeSweep = (id: string, maxTotalCalls?: number) =>
    sweepRequest<IImportSweep>(`/${id}/resume`, maxTotalCalls ? { maxTotalCalls } : {});

export const cancelSweep = (id: string) => sweepRequest<IImportSweep>(`/${id}/cancel`, {});
