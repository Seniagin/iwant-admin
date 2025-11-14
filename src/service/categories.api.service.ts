export interface ICategory {
    id: string;
    name: string;
}


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