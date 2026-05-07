export interface ICategory {
    id: string;
    name: string;
    description?: string | null;
}

export type CategorySortBy = 'name' | 'businessCount' | 'createdAt' | 'updatedAt';
export type SortOrder = 'ASC' | 'DESC';

export interface ICategoryWithCount extends ICategory {
    businessCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface PaginatedCategoriesResult {
    items: ICategoryWithCount[];
    meta: { page: number; limit: number; total: number; totalPages: number };
}

export const getCategoriesPaginated = async (params: {
    page: number;
    limit: number;
    sortBy: CategorySortBy;
    sortOrder: SortOrder;
}): Promise<PaginatedCategoriesResult> => {
    const qs = new URLSearchParams({
        page: String(params.page),
        limit: String(params.limit),
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
    });
    const response = await fetch(`${process.env.REACT_APP_API_URL}/categories/paginated?${qs}`);
    if (!response.ok) throw new Error('Failed to fetch categories');
    return response.json();
};


const API_URL = process.env.REACT_APP_API_URL;

export const createCategory = async (name: string) => {
    const response = await fetch(`${API_URL}/categories/new`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name })
    });
    return response.json();
}

export const searchCategory = async (search: string) => {
    const response = await fetch(`${API_URL}/client/search`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ search })
    });
    return response.json();
}

// Business category management functions
export const getBusinessCategoryRecommendations = async (businessId: string): Promise<ICategory[]> => {
    const response = await fetch(`${API_URL}/admin/business/${businessId}/categories/recommendations`);
    if (!response.ok) throw new Error('Failed to fetch business category recommendations');
    return response.json();
};

export const getBusinessCategorySuggestions = async (businessId: string): Promise<string[]> => {
    const response = await fetch(`${API_URL}/admin/business/${businessId}/categories/suggestions`);
    if (!response.ok) throw new Error('Failed to fetch business category suggestions');
    return response.json();
};

export const addCategoryToBusiness = async (businessId: string, categoryId: string): Promise<void> => {
    const response = await fetch(`${API_URL}/admin/business/${businessId}/category/${categoryId}/add`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: categoryId })
    });
    if (!response.ok) throw new Error('Failed to add category to business');
};

export const removeCategoryFromBusiness = async (businessId: string, categoryId: string): Promise<void> => {
    const response = await fetch(`${API_URL}/admin/business/${businessId}/category/${categoryId}/remove`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    if (!response.ok) throw new Error('Failed to remove category from business');
};

export const getIndexStats = async () => {
    const response = await fetch(`${API_URL}/categories/stats/index`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    if (!response.ok) throw new Error('Failed to fetch index stats');
    return response.json();
};

export const syncCategories = async () => {
    const response = await fetch(`${API_URL}/categories/sync`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    if (!response.ok) throw new Error('Failed to sync categories');
    return response.json();
};