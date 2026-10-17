const API_URL = process.env.REACT_APP_API_URL;

export interface AppSettings {
    /** Manual moderation: every new request waits here until approved or rejected. */
    demandReview: boolean;
}

export interface ReviewBusiness {
    id: string;
    name: string;
    address: string | null;
    logoUrl: string | null;
    phone: string | null;
    /** Someone runs it — only those get a push and see it in their dashboard. */
    hasOwner: boolean;
    distanceKm: number | null;
}

export interface ReviewRecipients {
    /** The client chose them ("Get offers"); otherwise the matcher's pick. */
    chosenByClient: boolean;
    businesses: ReviewBusiness[];
}

export interface ReviewItem {
    id: number;
    text: string;
    /** English, used for matching only — businesses read the client's words translated into their language. */
    translation: string | null;
    timing: { urgency: string | null; raw: string | null } | null;
    createdAt: string;
    client: { id: number; email: string | null; name: string | null; languageCode: string | null } | null;
    /** Null: the client chose nobody — the matcher picks on approval. */
    recipients: ReviewRecipients | null;
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_URL}${path}`, {
        ...init,
        headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
        const message = Array.isArray(body?.message) ? body.message.join('. ') : body?.message;
        throw new Error(message || `Request failed (HTTP ${response.status})`);
    }
    return body as T;
}

export const getSettings = () => call<AppSettings>('/admin/settings');

export const updateSettings = (patch: Partial<AppSettings>) =>
    call<AppSettings>('/admin/settings', { method: 'PUT', body: JSON.stringify(patch) });

export const getReviewQueue = () => call<ReviewItem[]>('/admin/moderation/demands');

/** Runs the matcher when the client chose nobody (paid). */
export const previewRecipients = (id: number) =>
    call<ReviewRecipients>(`/admin/moderation/demands/${id}/recipients`);

export const approveDemand = (id: number, businessIds?: string[]) =>
    call<{ id: number }>(`/admin/moderation/demands/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify(businessIds ? { businessIds } : {}),
    });

export const rejectDemand = (id: number) =>
    call<{ id: number }>(`/admin/moderation/demands/${id}/reject`, { method: 'POST' });
