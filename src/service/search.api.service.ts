import { DemandStatusEnum } from '../types/demandStatus';

const API_URL = process.env.REACT_APP_API_URL;

/** Matches Admin API `DemandResponseDto` (OpenAPI /admin/demands). */
export interface DemandResponseDto {
    id: number;
    demandStatus: DemandStatusEnum;
    categoryId?: string | null;
    userId: number;
    transcription?: string | null;
    translation?: string | null;
    summarizedTranslation?: string | null;
    categoryMatchConfidence?: 'high' | 'medium' | 'low' | null;
    categoryMatchReason?: string | null;
    telegramMessageId?: number | null;
    telegramChatId?: number | string | null;
    createdAt: string;
    updatedAt: string;
    availableBusinessCount?: number | null;
    user?: {
        id: number;
        location?: { longitude: number; latitude: number } | null;
    } | null;
    category?: {
        id: string;
        name: string;
        description?: string | null;
        createdAt: string;
        updatedAt: string;
    } | null;
}

export interface CreateAdminDemandDto {
    text: string;
    userId: number;
}

export interface PaginationMetaDto {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface PaginatedDemandsResponseDto {
    items: DemandResponseDto[];
    meta: PaginationMetaDto;
}

export const getDemandsPaginated = async (params?: {
    page?: number;
    limit?: number;
}): Promise<PaginatedDemandsResponseDto> => {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 200;
    const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
    const response = await fetch(`${API_URL}/admin/demands?${qs}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });
    if (!response.ok) {
        throw new Error('Failed to fetch demands');
    }
    return response.json();
};

export const getDemands = async (params?: { page?: number; limit?: number }): Promise<DemandResponseDto[]> => {
    const data = await getDemandsPaginated(params);
    return data.items;
};

/** GET /admin/user/:userId/demands — paginated demands for one client user. */
export const getUserDemandsPaginated = async (
    userId: number,
    params?: { page?: number; limit?: number }
): Promise<PaginatedDemandsResponseDto> => {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
    const response = await fetch(`${API_URL}/admin/user/${userId}/demands?${qs}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });
    if (!response.ok) {
        if (response.status === 404) throw new Error('User not found');
        throw new Error('Failed to fetch user demands');
    }
    return response.json();
};

export const createManualDemand = async (body: CreateAdminDemandDto): Promise<DemandResponseDto> => {
    const response = await fetch(`${API_URL}/admin/demand`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        if (response.status === 404) {
            throw new Error('User not found');
        }
        throw new Error('Failed to create demand');
    }
    return response.json();
};

/** POST /admin/user/:userId/demand — body `{ text }` only (user id in path). */
export const createManualDemandForUser = async (
    userId: number,
    body: { text: string }
): Promise<DemandResponseDto> => {
    const response = await fetch(`${API_URL}/admin/user/${userId}/demand`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        if (response.status === 404) throw new Error('User not found');
        throw new Error('Failed to create demand');
    }
    return response.json();
};

export const getCategories = async () => {
    const response = await fetch(`${API_URL}/categories`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    return response.json();
}

export const deleteCategory = async (id: string) => {
    const response = await fetch(`${API_URL}/categories/${id}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    return response.json();
}

export const deleteDemand = async (id: string | number) => {
    const response = await fetch(`${API_URL}/demands/${id}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    return response.json();
}

export const updateDemandCategory = async (id: string | number, categoryId: string) => {
    const response = await fetch(`${API_URL}/admin/demands/${id}/category`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ categoryId })
    });
    if (!response.ok) throw new Error('Failed to update demand category');
    return response.json();
}

export const acceptDemand = async (id: string | number) => {
    const response = await fetch(`${API_URL}/admin/demands/${id}/accept`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    if (!response.ok) throw new Error('Failed to accept demand');
    return response.json();
}

export const rejectDemand = async (id: string | number) => {
    const response = await fetch(`${API_URL}/admin/demands/${id}/reject`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    if (!response.ok) throw new Error('Failed to reject demand');
    return response.json();
}

export const notifyBusinesses = async (demandId: string | number) => {
    const response = await fetch(`${API_URL}/admin/manual-actions/notify-businesses/${demandId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    if (!response.ok) throw new Error('Failed to notify businesses');
    const data = await response.json();
    if (!data.success) throw new Error('Notification failed');
    return data;
};

export interface AdminStatisticsResponseDto {
    totalUsers: number;
    totalBusinessUsers: number;
    totalDemands: number;
    demandsWithOffers: number;
    demandsWithOffersPercent: number;
}

export const getLowCoverageDemands = async (params?: {
    threshold?: number;
    page?: number;
    limit?: number;
}): Promise<PaginatedDemandsResponseDto> => {
    const threshold = params?.threshold ?? 5;
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 200;
    const qs = new URLSearchParams({ threshold: String(threshold), page: String(page), limit: String(limit) });
    const response = await fetch(`${API_URL}/admin/demands/low-coverage?${qs}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error('Failed to fetch low-coverage demands');
    return response.json();
};

export const getAdminStatistics = async (): Promise<AdminStatisticsResponseDto> => {
    const response = await fetch(`${API_URL}/admin/statistics`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });
    if (!response.ok) {
        throw new Error('Failed to fetch statistics');
    }
    return response.json();
};
