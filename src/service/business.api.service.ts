import type { DemandResponseDto, PaginatedDemandsResponseDto } from './search.api.service';
import type { OfferTimingEnum } from '../types/offerTiming';

/**
 * Business contact fields — matches backend `BusinessContactsEntity` /
 * `BusinessContactsResponseDto` writable scalars (`UpdateContactsDto`).
 */
export interface IBusinessContacts {
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    website?: string | null;
    instagram?: string | null;
    /** Present in API docs when serialized from DB; read-only for display. */
    geolocation?: string | null;
}

export interface IBusiness {
    id: string;
    name: string;
    description?: string;
    contacts?: IBusinessContacts;
    categories?: ICategory[];
    location?: { longitude: number; latitude: number };
    userId?: number | null;
    coverageScore?: number | null;
    coverageAnalyzedAt?: string | null;
}

export interface ICategory {
    id: string;
    name: string;
    description?: string | null;
}

/** Admin API `AdminBusinessUserResponseDto` */
export interface IBusinessUser {
    id: number;
    email: string | null;
    telegramId: number | null;
    telegramUsername: string | null;
    telegramFirstName: string | null;
    telegramLastName: string | null;
    telegramLanguageCode: string | null;
    telegramPhotoUrl: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

/** POST /admin/business-user */
export interface CreateAdminBusinessUserDto {
    email?: string | null;
    password?: string;
    telegramId?: number | null;
    telegramUsername?: string | null;
    telegramFirstName?: string | null;
    telegramLastName?: string | null;
    telegramLanguageCode?: string | null;
    telegramPhotoUrl?: string | null;
    isActive?: boolean;
}

/** PATCH /admin/business-user/:id */
export interface UpdateAdminBusinessUserDto {
    email?: string | null;
    password?: string;
    telegramId?: number | null;
    telegramUsername?: string | null;
    telegramFirstName?: string | null;
    telegramLastName?: string | null;
    telegramLanguageCode?: string | null;
    telegramPhotoUrl?: string | null;
    isActive?: boolean;
    clearPassword?: boolean;
    unsetTelegramId?: boolean;
}

/** POST /admin/demands/:demandId/offers — body matches backend `AdminCreateOfferDto`. */
export interface AdminCreateOfferDto {
    businessId: string;
    price?: number;
    time?: OfferTimingEnum;
    comment?: string;
}

const API_URL = process.env.REACT_APP_API_URL;

export interface BusinessCoverageResult {
    score: number | null;
    coveredServices: string[];
    uncoveredServices: string[];
    summary: string;
    suggestedCategories: { name: string; description: string }[];
    analyzedAt: string | null;
}

export const getBusinessCoverage = async (businessId: string): Promise<BusinessCoverageResult | null> => {
    const response = await fetch(`${API_URL}/admin/business/${businessId}/coverage`);
    if (!response.ok) throw new Error('Failed to fetch coverage');
    return response.json();
};

export const analyzeBusinessCoverage = async (businessId: string): Promise<BusinessCoverageResult> => {
    const response = await fetch(`${API_URL}/admin/business/${businessId}/coverage`, { method: 'POST' });
    if (!response.ok) throw new Error('Failed to analyze coverage');
    return response.json();
};

export const createAndAssignSuggestedCategory = async (
    businessId: string,
    name: string,
    description: string,
): Promise<void> => {
    const response = await fetch(`${API_URL}/admin/business/${businessId}/categories/suggested`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
    });
    if (!response.ok) throw new Error('Failed to add suggested category');
};

export const getBusinessesByCategoryAndLocation = async (
    categoryId: string,
    latitude: number,
    longitude: number,
    radiusKm: number,
): Promise<IBusiness[]> => {
    const qs = new URLSearchParams({
        latitude: String(latitude),
        longitude: String(longitude),
        radiusKm: String(radiusKm),
    });
    const response = await fetch(`${API_URL}/admin/business/category/${categoryId}/nearby?${qs}`);
    if (!response.ok) throw new Error('Failed to fetch businesses');
    return response.json();
};

export const getBusinesses = async (): Promise<IBusiness[]> => {
    const response = await fetch(`${API_URL}/admin/business/list`);
    return response.json();
};

export const getBusinessById = async (id: string): Promise<IBusiness> => {
    const response = await fetch(`${API_URL}/admin/business/${id}`);
    return response.json();
};


export const createBusiness = async (business: Partial<IBusiness>): Promise<IBusiness> => {
    const response = await fetch(`${API_URL}/admin/business/create`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(business)
    });
    return response.json();
};

export const editBusiness = async (id: string, business: Partial<IBusiness>): Promise<IBusiness> => {
    const response = await fetch(`${API_URL}/admin/business/${id}/edit`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(business)
    });
    return response.json();
};

export const deleteBusiness = async (businessId: string): Promise<void> => {
    const response = await fetch(`${API_URL}/admin/business/${businessId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error('Failed to delete business');
    }
};

export const addCategoryToBusiness = async (businessId: string, categoryId: string): Promise<void> => {
    const response = await fetch(`${API_URL}/business/${businessId}/categories/${categoryId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    if (!response.ok) throw new Error('Failed to add category');
};

export const removeCategoryFromBusiness = async (businessId: string, categoryId: string): Promise<void> => {
    const response = await fetch(`${API_URL}/business/${businessId}/categories/${categoryId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    if (!response.ok) throw new Error('Failed to remove category');
};

export const getBusinessCategories = async (businessId: string): Promise<ICategory[]> => {
    const response = await fetch(`${API_URL}/business/${businessId}/categories`);
    if (!response.ok) throw new Error('Failed to fetch business categories');
    return response.json();
};

/** GET /admin/business/:businessId/demands — paginated; backend default limit 20. */
export const getBusinessDemandsPaginated = async (
    businessId: string,
    params?: { page?: number; limit?: number }
): Promise<PaginatedDemandsResponseDto> => {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 200;
    const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
    const response = await fetch(`${API_URL}/admin/business/${businessId}/demands?${qs}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });
    if (!response.ok) {
        if (response.status === 404) throw new Error('Business not found');
        throw new Error('Failed to fetch business demands');
    }
    return response.json() as Promise<PaginatedDemandsResponseDto>;
};

export const getBusinessDemands = async (businessId: string): Promise<DemandResponseDto[]> => {
    const { items } = await getBusinessDemandsPaginated(businessId, { page: 1, limit: 200 });
    return items;
};

export interface BusinessOfferDto {
    id: number;
    demandId: number;
    status: 'pending' | 'accepted' | 'rejected';
    price: number | null;
    time: string | null;
    comment: string | null;
    createdAt: string;
    demand: {
        id: number;
        summarizedTranslation: string | null;
        translation: string | null;
        transcription: string | null;
        createdAt: string;
        category: { id: string; name: string } | null;
    } | null;
}

export const getBusinessOffers = async (businessId: string): Promise<BusinessOfferDto[]> => {
    const response = await fetch(`${API_URL}/admin/business/${businessId}/offers`);
    if (!response.ok) throw new Error('Failed to fetch business offers');
    return response.json();
};

export const getBusinessUsers = async (): Promise<IBusinessUser[]> => {
    const response = await fetch(`${API_URL}/admin/business-users`);
    if (!response.ok) throw new Error('Failed to fetch business users');
    return response.json();
};

export const getBusinessUser = async (userId: number): Promise<IBusinessUser> => {
    const response = await fetch(`${API_URL}/admin/business-users/${userId}`);
    if (!response.ok) throw new Error('Failed to fetch business user');
    return response.json();
};

export const createBusinessUser = async (body: CreateAdminBusinessUserDto): Promise<IBusinessUser> => {
    const response = await fetch(`${API_URL}/admin/business-user`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        if (response.status === 409) throw new Error('Email or Telegram ID already in use');
        throw new Error('Failed to create business user');
    }
    return response.json();
};

export const updateBusinessUser = async (userId: number, body: UpdateAdminBusinessUserDto): Promise<IBusinessUser> => {
    const response = await fetch(`${API_URL}/admin/business-user/${userId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        if (response.status === 404) throw new Error('Business user not found');
        if (response.status === 409) throw new Error('Email or Telegram ID already in use');
        throw new Error('Failed to update business user');
    }
    return response.json();
};

export const deleteBusinessUser = async (userId: number): Promise<void> => {
    const response = await fetch(`${API_URL}/admin/business-users/${userId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error('Failed to delete business user');
    }
};

export const addBusinessToUser = async (userId: number, business: Partial<IBusiness>): Promise<IBusiness> => {
    const response = await fetch(`${API_URL}/admin/business-users/${userId}/business/add`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(business)
    });

    if (!response.ok) {
        throw new Error('Failed to add business to user');
    }

    return response.json();
};

export const getUserBusinesses = async (userId: number): Promise<IBusiness[]> => {
    const response = await fetch(`${API_URL}/admin/business-users/${userId}/businesses`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch user businesses');
    }

    return response.json();
};

export const getUserBusinessDetails = async (userId: number, businessId: string): Promise<IBusiness> => {
    const response = await fetch(`${API_URL}/admin/business-users/${userId}/businesses/${businessId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch business details');
    }

    return response.json();
};

export const editUserBusiness = async (userId: number, businessId: string, business: Partial<IBusiness>): Promise<IBusiness> => {
    const response = await fetch(`${API_URL}/admin/business-users/${userId}/business/${businessId}/edit`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(business)
    });

    if (!response.ok) {
        throw new Error('Failed to edit business');
    }

    return response.json();
};

/** POST /admin/demands/:demandId/offers — demand id in path, business UUID in body. */
export const createAdminOfferForDemand = async (
    demandId: number,
    body: AdminCreateOfferDto
): Promise<unknown> => {
    const response = await fetch(`${API_URL}/admin/demands/${demandId}/offers`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        if (response.status === 404) throw new Error('Demand or business not found');
        throw new Error('Failed to create offer');
    }
    return response.json();
};