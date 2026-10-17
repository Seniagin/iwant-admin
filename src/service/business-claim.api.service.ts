const API_URL = process.env.REACT_APP_API_URL;

export type ClaimStatus = 'pending' | 'approved' | 'rejected';

export interface IBusinessClaimRequest {
    id: string;
    businessId: string;
    userId: number;
    note: string | null;
    status: ClaimStatus;
    createdAt: string;
    reviewedAt: string | null;
    /** The listing being claimed — its phone is the one to call to confirm ownership. */
    business: {
        id: string;
        name: string;
        address: string | null;
        phone: string | null;
        website: string | null;
        googleMapsUrl: string | null;
        hasOwner: boolean;
    } | null;
    account: { id: number; email: string | null } | null;
}

export const listBusinessClaims = async (
    status?: ClaimStatus,
): Promise<IBusinessClaimRequest[]> => {
    const query = status ? `?status=${status}` : '';
    const response = await fetch(`${API_URL}/admin/business-claims${query}`);
    if (!response.ok) throw new Error('Failed to load claims');
    return response.json();
};

export const approveBusinessClaim = async (id: string): Promise<void> => {
    const response = await fetch(`${API_URL}/admin/business-claims/${id}/approve`, {
        method: 'POST',
    });
    if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message ?? 'Approve failed');
    }
};

export const rejectBusinessClaim = async (id: string): Promise<void> => {
    const response = await fetch(`${API_URL}/admin/business-claims/${id}/reject`, {
        method: 'POST',
    });
    if (!response.ok) throw new Error('Reject failed');
};
