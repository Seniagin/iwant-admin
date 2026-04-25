import React, { createContext, useCallback, useEffect, useState } from 'react';
import {
    acceptDemand,
    deleteDemand,
    getCategories,
    rejectDemand,
    updateDemandCategory,
    type DemandResponseDto,
} from '../service/search.api.service';
import { useSnackbar } from './SnackbarContext';
import { DemandStatusEnum } from '../types/demandStatus';
import { DemandEditDrawer, type DemandCategoryOption } from '../components/DemandEditDrawer';

export type DemandEditOutletContextValue = {
    openEdit: (demand: DemandResponseDto) => void;
};

export const DemandEditOutletContext = createContext<DemandEditOutletContextValue | null>(null);

export interface DemandEditOutletProviderProps {
    demands: DemandResponseDto[];
    onAfterMutation: () => void | Promise<void>;
    children: React.ReactNode;
}

export const DemandEditOutletProvider: React.FC<DemandEditOutletProviderProps> = ({
    demands,
    onAfterMutation,
    children,
}) => {
    const { showSuccess, showError } = useSnackbar();
    const [editingDemand, setEditingDemand] = useState<DemandResponseDto | null>(null);
    const [categories, setCategories] = useState<DemandCategoryOption[]>([]);
    const [isLoadingCategories, setIsLoadingCategories] = useState(false);
    const [updatingDemandId, setUpdatingDemandId] = useState<number | null>(null);

    const openEdit = useCallback((d: DemandResponseDto) => {
        setEditingDemand(d);
    }, []);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setIsLoadingCategories(true);
                const data = await getCategories();
                if (!cancelled) setCategories(data);
            } catch {
                /* optional */
            } finally {
                if (!cancelled) setIsLoadingCategories(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!editingDemand) return;
        const next = demands.find((d) => d.id === editingDemand.id);
        if (next && next !== editingDemand) setEditingDemand(next);
    }, [demands, editingDemand]);

    const handleClose = () => {
        setEditingDemand(null);
        setUpdatingDemandId(null);
    };

    const runAfterMutation = async () => {
        await onAfterMutation();
    };

    const handleCategoryChange = async (demandId: number, categoryId: string) => {
        try {
            setUpdatingDemandId(demandId);
            await updateDemandCategory(demandId, categoryId);
            showSuccess('Demand category updated successfully!');
            await runAfterMutation();
        } catch {
            showError('Failed to update demand category. Please try again.');
        } finally {
            setUpdatingDemandId(null);
        }
    };

    const handleAccept = async (id: number) => {
        try {
            setUpdatingDemandId(id);
            await acceptDemand(id);
            showSuccess('Demand accepted successfully!');
            await runAfterMutation();
            setEditingDemand((prev) =>
                prev && prev.id === id ? { ...prev, demandStatus: DemandStatusEnum.ACTIVE } : prev
            );
        } catch {
            showError('Failed to accept demand. Please try again.');
        } finally {
            setUpdatingDemandId(null);
        }
    };

    const handleReject = async (id: number) => {
        try {
            setUpdatingDemandId(id);
            await rejectDemand(id);
            showSuccess('Demand rejected successfully!');
            await runAfterMutation();
            setEditingDemand((prev) =>
                prev && prev.id === id ? { ...prev, demandStatus: DemandStatusEnum.DECLINED } : prev
            );
        } catch {
            showError('Failed to reject demand. Please try again.');
        } finally {
            setUpdatingDemandId(null);
        }
    };

    const handleDeleteFromDrawer = async (id: number) => {
        try {
            await deleteDemand(id);
            showSuccess('Demand deleted successfully!');
            await runAfterMutation();
            handleClose();
        } catch {
            showError('Failed to delete demand. Please try again.');
        }
    };

    return (
        <DemandEditOutletContext.Provider value={{ openEdit }}>
            {children}
            <DemandEditDrawer
                open={Boolean(editingDemand)}
                onClose={handleClose}
                demand={editingDemand}
                categories={categories}
                isLoadingCategories={isLoadingCategories}
                updatingDemandId={updatingDemandId}
                onCategoryChange={handleCategoryChange}
                onAccept={handleAccept}
                onReject={handleReject}
                onDelete={handleDeleteFromDrawer}
            />
        </DemandEditOutletContext.Provider>
    );
};
