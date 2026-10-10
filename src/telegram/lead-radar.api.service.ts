const API_URL = process.env.REACT_APP_API_URL;

export type TelegramConnection =
    | { status: 'not-configured' }
    | { status: 'logged-out' }
    | { status: 'code-sent'; phone: string }
    | { status: 'password-needed'; phone: string }
    | { status: 'connected'; account: string };

export type LeadKind = 'request' | 'offer' | 'other';

export interface ILeadSource {
    id: string;
    platform: 'telegram';
    handle: string;
    title: string | null;
    city: string | null;
    enabled: boolean;
    lastMessageId: number;
    lastPolledAt: string | null;
    lastError: string | null;
    createdAt: string;
}

export interface ILeadMessage {
    id: string;
    sourceId: string;
    externalId: number;
    postedAt: string;
    text: string;
    link: string;
    kind: LeadKind | null;
    trade: string | null;
    place: string | null;
    urgency: 'urgent' | 'soon' | 'flexible' | null;
    summary: string | null;
}

export interface ILeadStats {
    days: number;
    totals: { messages: number; requests: number; offers: number; other: number; unclassified: number };
    perDay: Array<{ day: string; messages: number; requests: number; offers: number }>;
    perTrade: Array<{ trade: string; requests: number; offers: number }>;
    perSource: Array<{ sourceId: string; messages: number; requests: number; offers: number; firstAt: string; lastAt: string }>;
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${API_URL}/admin/lead-radar${path}`, {
        ...init,
        headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    });
    const text = await response.text();
    const body = text ? JSON.parse(text) : null;
    if (!response.ok) {
        const message = Array.isArray(body?.message) ? body.message.join('. ') : body?.message;
        throw new Error(message ?? `Request failed (${response.status})`);
    }
    return body as T;
}

const post = <T>(path: string, body?: unknown) =>
    call<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) });

export const leadRadarApi = {
    telegram: () => call<TelegramConnection>('/telegram'),
    sendCode: (phone: string) => post<TelegramConnection>('/telegram/send-code', { phone }),
    signIn: (code: string) => post<TelegramConnection>('/telegram/sign-in', { code }),
    password: (password: string) => post<TelegramConnection>('/telegram/password', { password }),
    logout: () => post<TelegramConnection>('/telegram/logout'),

    sources: () => call<ILeadSource[]>('/sources'),
    addSource: (handle: string, city: string, backfillDays: number) =>
        post<ILeadSource>('/sources', { handle, city, backfillDays }),
    updateSource: (id: string, patch: { enabled?: boolean; city?: string | null }) =>
        call<ILeadSource>(`/sources/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
    removeSource: (id: string) => call<void>(`/sources/${id}`, { method: 'DELETE' }),
    poll: (id: string) => post<ILeadSource>(`/sources/${id}/poll`),

    stats: (days: number, sourceId?: string) =>
        call<ILeadStats>(`/stats?days=${days}${sourceId ? `&sourceId=${sourceId}` : ''}`),
    messages: (filter: { kind?: LeadKind; trade?: string; sourceId?: string; limit?: number }) => {
        const params = new URLSearchParams();
        Object.entries(filter).forEach(([k, v]) => v !== undefined && v !== '' && params.set(k, String(v)));
        return call<ILeadMessage[]>(`/messages?${params}`);
    },
};
