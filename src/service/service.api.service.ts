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

export interface AssetResponseDto {
    id: string;
    fileName: string;
    filePath: string;
    mimeType: string;
    fileSize: number;
    originalName?: string;
    fileExtension?: string;
    serviceIds?: string[];
    url: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IService {
    id: string;
    name: string;
    description?: string;
    categories?: ICategory[];
    assets?: AssetResponseDto[];
}

export interface IOffer {
    demandId: number;
    serviceId: string;
    comment: string;
}

const API_URL = process.env.REACT_APP_API_URL;

export const editService = async (serviceId: string, service: Partial<IService>): Promise<IService> => {
    const response = await fetch(`${API_URL}/admin/service/${serviceId}/edit`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(service)
    });

    if (!response.ok) {
        throw new Error('Failed to edit service');
    }

    return response.json();
};

export const deleteService = async (serviceId: string): Promise<void> => {
    const response = await fetch(`${API_URL}/admin/service/${serviceId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error('Failed to delete service');
    }
};

export const getServiceById = async (serviceId: string): Promise<IService> => {
    const response = await fetch(`${API_URL}/admin/service/${serviceId}`);
    if (!response.ok) throw new Error('Failed to fetch business service');
    return response.json();
};

export const addServiceToBusiness = async (businessId: string, service: Partial<IService>): Promise<IService> => {
    const response = await fetch(`${API_URL}/admin/business/${businessId}/service/add`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(service)
    });

    if (!response.ok) {
        throw new Error('Failed to add service to business');
    }

    return response.json();
};

export const getBusinessServices = async (userId: number, businessId: string): Promise<IService[]> => {
    const response = await fetch(`${API_URL}/admin/business-users/${userId}/businesses/${businessId}/services`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch business services');
    }

    return response.json();
};
