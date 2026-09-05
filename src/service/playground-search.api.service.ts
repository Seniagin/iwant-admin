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
    /** Businesses carrying an unresolved flag from any earlier run — repeat offenders. */
    flaggedBusinessIds: string[];
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

/**
 * Why a match looked wrong, in terms of the mechanism that would have to
 * change. Free text says what a person saw; this says where to go and fix it,
 * and makes the flags countable — nine of twelve being `wrong_trade` points at
 * a lever, where nine paragraphs do not.
 */
/** Null until someone classifies it — marking is one click and carries no reason. */
export type FlagReason =
    | 'wrong_trade'
    | 'adjacent_service'
    | 'too_generic'
    | 'wrong_preference'
    | 'too_far'
    | 'bad_business_data'
    | 'other';

export const FLAG_REASONS: { value: FlagReason; label: string; hint: string }[] = [
    { value: 'wrong_trade', label: 'Wrong trade', hint: 'A different profession entirely — road repair for a leaking pipe' },
    { value: 'adjacent_service', label: 'Adjacent service', hint: 'Right trade, wrong job — blade sharpening for a mower that will not start' },
    { value: 'too_generic', label: 'Too generic', hint: 'Matched on a phrase too broad to mean anything, like "repair services"' },
    { value: 'wrong_preference', label: 'Wrong preference', hint: 'Contradicts a stated audience, urgency, or where the work happens' },
    { value: 'too_far', label: 'Too far', hint: 'Plausible work, unusable distance' },
    { value: 'bad_business_data', label: 'Bad business data', hint: 'The matcher was right; the business description or categories are wrong' },
    { value: 'other', label: 'Other', hint: 'Something else — say what in the note' },
];

export interface IFlaggedMatch {
    id: number;
    searchLogId: number | null;
    query: string;
    aspects: string[];
    demandFacets: Record<string, string[]>;
    demandRanking: Record<string, string[]>;
    businessId: string;
    businessName: string;
    rank: number;
    score: number;
    relevanceScore: number | null;
    distanceKm: number | null;
    matchedAspects: string[];
    businessFacets: Record<string, string[] | string | null> | null;
    reason: FlagReason | null;
    note: string | null;
    resolved: boolean;
    createdAt: string;
}

export const flagMatch = async (
    payload: Omit<IFlaggedMatch, 'id' | 'resolved' | 'createdAt' | 'reason' | 'note'>,
): Promise<IFlaggedMatch> => {
    const response = await fetch(`${API_URL}/admin/playground/flags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Could not save the flag');
    return response.json();
};

export const listFlags = async (
    includeResolved = false,
): Promise<{ items: IFlaggedMatch[]; byReason: { reason: FlagReason; count: number }[] }> => {
    const response = await fetch(
        `${API_URL}/admin/playground/flags?includeResolved=${includeResolved}`,
    );
    if (!response.ok) throw new Error('Could not load flags');
    return response.json();
};

/** Only the supplied fields change, so classifying does not un-resolve and vice versa. */
export const updateFlag = async (
    id: number,
    changes: { resolved?: boolean; reason?: FlagReason | null; note?: string | null },
): Promise<void> => {
    const response = await fetch(`${API_URL}/admin/playground/flags/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
    });
    if (!response.ok) throw new Error('Could not update the flag');
};

export const deleteFlag = async (id: number): Promise<void> => {
    const response = await fetch(`${API_URL}/admin/playground/flags/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Could not remove the flag');
};

/**
 * Reads one recorded search through the Claude Code CLI on the machine running
 * the backend. Slow by nature — a minute is normal — so callers should show
 * progress rather than a spinner that looks stuck.
 */
export const analyseSearch = async (
    searchLogId: number,
): Promise<{ analysis: string; durationMs: number }> => {
    const response = await fetch(`${API_URL}/admin/playground/analyse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchLogId }),
    });
    if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message ?? 'Analysis failed');
    }
    return response.json();
};
