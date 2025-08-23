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
