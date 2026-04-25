const API_URL = process.env.REACT_APP_API_URL;

export interface AdminUserGeoPointDto {
    latitude: number;
    longitude: number;
}

/** OpenAPI `AdminUserListItemResponseDto` */
export interface AdminUserListItemResponseDto {
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
    location: AdminUserGeoPointDto | null;
}

export interface PaginatedAdminUsersResponseDto {
    items: AdminUserListItemResponseDto[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

/** OpenAPI `AdminUserContactResponseDto` */
export interface AdminUserContactResponseDto {
    id: number;
    userId: number;
    email: string | null;
    phone: string | null;
    createdAt: string;
    updatedAt: string;
}

/** OpenAPI `AdminUserDetailResponseDto` */
export interface AdminUserDetailResponseDto {
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
    location: AdminUserGeoPointDto | null;
    contacts: AdminUserContactResponseDto[];
    demandsCount: number;
}

/** OpenAPI `CreateAdminUserDto` — POST /admin/user */
export interface CreateAdminUserDto {
    email?: string | null;
    password?: string;
    telegramId?: number | null;
    telegramUsername?: string | null;
    telegramFirstName?: string | null;
    telegramLastName?: string | null;
    telegramLanguageCode?: string | null;
    telegramPhotoUrl?: string | null;
    isActive?: boolean;
    latitude?: number;
    longitude?: number;
}

/** OpenAPI `UpdateAdminUserDto` — PATCH /admin/user/{id} */
export interface UpdateAdminUserDto {
    email?: string | null;
    telegramId?: number | null;
    telegramUsername?: string | null;
    telegramFirstName?: string | null;
    telegramLastName?: string | null;
    telegramLanguageCode?: string | null;
    telegramPhotoUrl?: string | null;
    isActive?: boolean;
    latitude?: number;
    longitude?: number;
    password?: string;
    clearPassword?: boolean;
    unsetTelegramId?: boolean;
}

export const listUsers = async (params?: { page?: number; limit?: number }): Promise<AdminUserListItemResponseDto[]> => {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 200;
    const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
    const response = await fetch(`${API_URL}/admin/users?${qs}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
        throw new Error('Failed to fetch users');
    }
    const data: PaginatedAdminUsersResponseDto = await response.json();
    return data.items;
};

/** GET /admin/user/{id} */
export const getUserDetail = async (id: number): Promise<AdminUserDetailResponseDto> => {
    const response = await fetch(`${API_URL}/admin/user/${id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
        if (response.status === 404) {
            throw new Error('User not found');
        }
        throw new Error('Failed to fetch user');
    }
    return response.json();
};

/** POST /admin/user */
export const createUser = async (body: CreateAdminUserDto): Promise<AdminUserDetailResponseDto> => {
    const response = await fetch(`${API_URL}/admin/user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        throw new Error('Failed to create user');
    }
    return response.json();
};

/** PATCH /admin/user/{id} */
export const updateUser = async (id: number, body: UpdateAdminUserDto): Promise<AdminUserDetailResponseDto> => {
    const response = await fetch(`${API_URL}/admin/user/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        if (response.status === 404) {
            throw new Error('User not found');
        }
        throw new Error('Failed to update user');
    }
    return response.json();
};
