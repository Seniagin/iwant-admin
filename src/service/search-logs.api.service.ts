const API_URL = process.env.REACT_APP_API_URL;

export type SearchLogSource = 'search' | 'demand' | 'demand_created' | 'notify' | 'eval';

/** One matched business, snapshotted as it was ranked at search time. */
export interface ISearchLogResult {
    businessId: string;
    name: string;
    /** Final ordering score: relevance plus any ranking-preference adjustment. */
    score: number;
    /**
     * Relevance alone — best aspect cosine plus the breadth bonus. The gap to
     * `score` is what the query's stated preferences moved. Absent on rows
     * logged before ranking preferences existed.
     */
    relevanceScore?: number;
    distanceKm: number;
    matchedAspects: string[];
    facets: Record<string, string[] | string | null> | null;
}

export interface ISearchLog {
    id: number;
    query: string;
    /** English service phrases the query was reduced to — what was embedded. */
    aspects: string[];
    /** Categorical constraints taken from the query and used as hard filters. */
    demandFacets: Record<string, string[]>;
    /**
     * Preferences taken from the query that reorder results without gating
     * them. Kept apart from `demandFacets` because the two do categorically
     * different things to a result set.
     */
    demandRanking?: Record<string, string[]>;
    results: ISearchLogResult[];
    resultCount: number;
    source: SearchLogSource;
    demandId: number | null;
    userId: number | null;
    latitude: number | null;
    longitude: number | null;
    durationMs: number | null;
    createdAt: string;
}

export interface ISearchLogsPage {
    items: ISearchLog[];
    total: number;
    page: number;
    limit: number;
}

export const getSearchLogs = async (page = 1, limit = 50): Promise<ISearchLogsPage> => {
    const response = await fetch(`${API_URL}/admin/search-logs?page=${page}&limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch search logs');
    return response.json();
};

export const clearSearchLogs = async (): Promise<void> => {
    const response = await fetch(`${API_URL}/admin/search-logs`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to clear search logs');
};
