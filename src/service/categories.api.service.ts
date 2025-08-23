export interface ICategory {
    id: string;
    name: string;
}


const API_URL = process.env.REACT_APP_API_URL;

export const getMatchingServiceCategories = async (serviceId: string): Promise<ICategory[]> => {
    const response = await fetch(`${API_URL}/admin/service/${serviceId}/categories/matching`);
    if (!response.ok) throw new Error('Failed to fetch recommended service categories');
    return response.json();
};

export const getCategoriesSuggestions = async (query: string): Promise<string[]> => {
    const response = await fetch(`${API_URL}/admin/service/categories/suggestions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: query })
    });

    if (!response.ok) throw new Error('Failed to fetch suggested service categories');
    return response.json();
};

export const addCategoryToService = async (serviceId: string, categoryId: string): Promise<void> => {
    const response = await fetch(`${API_URL}/admin/service/${serviceId}/categories/add`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: categoryId })
    });
    if (!response.ok) throw new Error('Failed to add category to service');
};

export const removeCategoryFromService = async (serviceId: string, categoryId: string): Promise<void> => {
    const response = await fetch(`${API_URL}/admin/service/${serviceId}/categories/${categoryId}/remove`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    if (!response.ok) throw new Error('Failed to remove category from service');
};

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