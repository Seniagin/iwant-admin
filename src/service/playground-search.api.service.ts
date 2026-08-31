const API_URL = process.env.REACT_APP_API_URL;

export interface IPlaygroundResult {
    businessId: string;
    name: string;
    description: string | null;
    /** Final ordering score: relevance plus any ranking-preference adjustment. */
    score: number;
    /** Relevance alone; the gap to `score` is what the preferences moved. */
    relevanceScore: number;
    distanceKm: number;
    matchedAspects: string[];
    facets: Record<string, string[] | string | null> | null;
}

export interface IPlaygroundSearch {
    /**
     * The `search_logs` row this run wrote. It is the handle for looking the
     * search up afterwards — the row holds everything the matcher derived,
     * which is what a later question about the result needs. Null when the log
     * write had not landed before the response was assembled.
     */
    searchLogId: number | null;
    query: string;
    /** English service phrases the query was reduced to — what was embedded. */
    aspects: string[];
    /** Hard gates: a business contradicting one of these was excluded. */
    filters: Record<string, string[]>;
    /** Preferences: these reordered the results, they never excluded anyone. */
    ranking: Record<string, string[]>;
    durationMs: number | null;
    results: IPlaygroundResult[];
}

export const generatePlaygroundQuery = async (
    language: 'ru' | 'uk',
    hint?: string,
): Promise<string> => {
    const response = await fetch(`${API_URL}/admin/playground/generate-query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, hint }),
    });
    if (!response.ok) throw new Error('Failed to generate a query');
    const body: { query: string } = await response.json();
    return body.query;
};

export const runPlaygroundSearch = async (params: {
    text: string;
    lat: number;
    lng: number;
    radiusKm: number;
}): Promise<IPlaygroundSearch> => {
    const response = await fetch(`${API_URL}/admin/playground/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
    });
    if (!response.ok) throw new Error('Search failed');
    return response.json();
};
