export interface IBusiness {
    id: string;
    name: string;
    description?: string;
    contacts?: { phone?: string; email?: string };
    categories?: ICategory[];
}

export interface ICategory {
    id: string;
    name: string;
}

export interface IDemand {
    id: string;
    category: ICategory;
    translation: string;
    createdAt: string;
}

export interface IBusinessUser {
    id: number;
    email: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface IOffer {
    demandId: number;
    serviceId: string;
    comment: string;
}

const API_URL = process.env.REACT_APP_API_URL;

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

export const getBusinessDemands = async (businessId: string): Promise<IDemand[]> => {
    const response = await fetch(`${API_URL}/business/${businessId}/demands`);
    if (!response.ok) throw new Error('Failed to fetch business demands');
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

export const createOffer = async (offer: IOffer): Promise<any> => {
    const response = await fetch(`${API_URL}/offer`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(offer)
    });

    if (!response.ok) {
        throw new Error('Failed to create offer');
    }

    return response.json();
};