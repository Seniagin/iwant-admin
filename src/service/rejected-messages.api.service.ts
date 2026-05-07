const API_URL = process.env.REACT_APP_API_URL;

export type RejectionReason = 'offering' | 'inappropriate' | 'unsupported' | 'spam';

export interface RejectedMessage {
    id: number;
    text: string;
    reason: RejectionReason;
    telegramUserId: number | null;
    telegramChatId: number | null;
    telegramMessageId: number | null;
    createdAt: string;
}

export interface PaginatedRejectedMessagesDto {
    items: RejectedMessage[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export const listRejectedMessages = async (params?: {
    page?: number;
    limit?: number;
    reason?: RejectionReason;
}): Promise<PaginatedRejectedMessagesDto> => {
    const qs = new URLSearchParams({
        page: String(params?.page ?? 1),
        limit: String(params?.limit ?? 50),
    });
    if (params?.reason) qs.set('reason', params.reason);

    const response = await fetch(`${API_URL}/admin/rejected-messages?${qs}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error('Failed to fetch rejected messages');
    return response.json();
};
