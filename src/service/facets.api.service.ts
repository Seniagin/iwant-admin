const API_URL = process.env.REACT_APP_API_URL;

export type FacetValueType = 'enum' | 'text_list' | 'text' | 'number' | 'boolean';
export type FacetRole = 'vector' | 'filter' | 'ranking' | 'display';

export interface IFacet {
    id: string;
    key: string;
    label: string;
    /** Notes for whoever maintains the list. Never sent to the model. */
    description: string | null;
    /** The instruction the model receives for this field. */
    extractionPrompt: string | null;
    valueType: FacetValueType;
    allowedValues: string[] | null;
    role: FacetRole;
    enabled: boolean;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
    businessCount: number;
}

export type FacetInput = Omit<IFacet, 'id' | 'createdAt' | 'updatedAt' | 'businessCount'>;

/**
 * Surfaces the server's own message instead of a generic string — this page is
 * for hand-editing rows, so a duplicate key has to read as a duplicate key.
 */
async function parseError(response: Response, fallback: string): Promise<never> {
    let message = fallback;
    try {
        const body = await response.json();
        if (typeof body?.message === 'string') message = body.message;
        else if (Array.isArray(body?.message)) message = body.message.join(', ');
    } catch {
        // non-JSON body — keep the fallback
    }
    throw new Error(message);
}

export const getFacets = async (): Promise<IFacet[]> => {
    const response = await fetch(`${API_URL}/admin/facets`);
    if (!response.ok) return parseError(response, 'Failed to fetch parameters');
    return response.json();
};

export const createFacet = async (facet: Partial<FacetInput>): Promise<IFacet> => {
    const response = await fetch(`${API_URL}/admin/facets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(facet),
    });
    if (!response.ok) return parseError(response, 'Failed to create parameter');
    return response.json();
};

export const updateFacet = async (id: string, facet: Partial<FacetInput>): Promise<IFacet> => {
    const response = await fetch(`${API_URL}/admin/facets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(facet),
    });
    if (!response.ok) return parseError(response, 'Failed to update parameter');
    return response.json();
};

export const deleteFacet = async (id: string): Promise<void> => {
    const response = await fetch(`${API_URL}/admin/facets/${id}`, { method: 'DELETE' });
    if (!response.ok) return parseError(response, 'Failed to delete parameter');
};
