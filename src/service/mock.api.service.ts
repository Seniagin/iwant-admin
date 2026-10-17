const API_URL = process.env.REACT_APP_API_URL;

/** Places the predefined mock pool (2000 businesses) around a centre. */
export interface PlaceMockBusinessesDto {
    centerLat: number;
    centerLng: number;
    radiusKm: number;
    /** How many of the pool to place, spread over its niches; all of it when left out. */
    count?: number;
    /** Only businesses of these categories. */
    categoryIds?: string[];
    /** Remove the mock businesses placed earlier first. */
    replace?: boolean;
}

export interface MockBusinessResult {
    id: string;
    name: string;
    category: string;
    lat: number;
    lng: number;
}

export interface PlaceMockBusinessesResult {
    created: number;
    failed: number;
    removed: number;
    businesses: MockBusinessResult[];
}

export const placeMockBusinesses = async (
    dto: PlaceMockBusinessesDto,
): Promise<PlaceMockBusinessesResult> => {
    const response = await fetch(`${API_URL}/admin/mock/generate-businesses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
    });
    if (!response.ok) throw new Error('Failed to place mock businesses');
    return response.json();
};

export const removeMockBusinesses = async (): Promise<{ removed: number }> => {
    const response = await fetch(`${API_URL}/admin/mock/businesses`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to remove mock businesses');
    return response.json();
};
