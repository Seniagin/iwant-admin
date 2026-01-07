const API_URL = process.env.REACT_APP_API_URL;





export const createDemand = async (text: string) => {
    const response = await fetch(`${API_URL}/demands/text`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
    });
    return response.json();
}

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

export const deleteDemand = async (id: string) => {
    const response = await fetch(`${API_URL}/demands/${id}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    return response.json();
}

export const updateDemandCategory = async (id: string, categoryId: string) => {
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

export const acceptDemand = async (id: string) => {
    const response = await fetch(`${API_URL}/admin/demands/${id}/accept`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    if (!response.ok) throw new Error('Failed to accept demand');
    return response.json();
}

export const rejectDemand = async (id: string) => {
    const response = await fetch(`${API_URL}/admin/demands/${id}/reject`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    if (!response.ok) throw new Error('Failed to reject demand');
    return response.json();
}

export const notifyBusinesses = async (demandId: string) => {
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
}
