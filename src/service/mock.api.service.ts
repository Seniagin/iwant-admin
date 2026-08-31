const API_URL = process.env.REACT_APP_API_URL;

export interface GenerateMockBusinessesDto {
    centerLat: number;
    centerLng: number;
    radiusKm: number;
    minPerCategory: number;
    maxPerCategory: number;
    categoryIds?: string[];
    locale?: 'en' | 'ru' | 'uk';
}

export interface MockBusinessResult {
    id: string;
    name: string;
    category: string;
    lat: number;
    lng: number;
}

export interface GenerateMockBusinessesResult {
    created: number;
    businesses: MockBusinessResult[];
}

export const generateMockBusinesses = async (
    dto: GenerateMockBusinessesDto,
): Promise<GenerateMockBusinessesResult> => {
    const response = await fetch(`${API_URL}/admin/mock/generate-businesses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
    });
    if (!response.ok) throw new Error('Failed to generate mock businesses');
    return response.json();
};
