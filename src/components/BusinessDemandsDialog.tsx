import { CircularProgress, Dialog, DialogContent } from "@mui/material"
import { DialogTitle, Box, IconButton } from "@mui/material"
import { Typography } from "@mui/material"
import CloseIcon from '@mui/icons-material/Close';
import { useEffect, useState } from "react";
import { useSnackbar } from "../contexts/SnackbarContext";
import { getBusinessDemands } from "../service/business.api.service";
import { DemandCard } from "./DemandCard";
import { getBusinessServices, IService } from "../service/service.api.service";

interface BusinessDemandsDialogProps {
    businessId: string | null;
    isOpen: boolean;
    onClose: (open: boolean) => void;
    userId?: number;
}

export const BusinessDemandsDialog: React.FC<BusinessDemandsDialogProps> = ({
    businessId,
    isOpen,
    onClose,
    userId
}) => {

    const [businessDemands, setBusinessDemands] = useState<any[]>([]);
    const [businessServices, setBusinessServices] = useState<IService[]>([]);
    const [isLoadingDemands, setIsLoadingDemands] = useState(false);
    const [isLoadingServices, setIsLoadingServices] = useState(false);
    const { showSuccess, showError } = useSnackbar();

    useEffect(() => {
        if (businessId && userId) {
            handleShowDemands(businessId);
            handleFetchServices(businessId, userId);
        }
    }, [businessId, userId]);

    const handleShowDemands = async (businessId: string) => {
        setIsLoadingDemands(true);
        try {
            const demands = await getBusinessDemands(businessId);
            setBusinessDemands(demands);
        } catch (error) {
            showError('Failed to fetch demands');
        } finally {
            setIsLoadingDemands(false);
        }
    };

    const handleFetchServices = async (businessId: string, userId: number) => {
        setIsLoadingServices(true);
        try {
            const services = await getBusinessServices(userId, businessId);
            setBusinessServices(services);
        } catch (error) {
            showError('Failed to fetch services');
        } finally {
            setIsLoadingServices(false);
        }
    };

    return <Dialog
        open={isOpen}
        onClose={() => onClose(false)}
        maxWidth="md"
        fullWidth
    >
        <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Business Demands</Typography>
                <IconButton onClick={() => onClose(false)}>
                    <CloseIcon />
                </IconButton>
            </Box>
        </DialogTitle>
        <DialogContent>
            {(isLoadingDemands || isLoadingServices) ? (
                <Box display="flex" justifyContent="center" my={4}>
                    <CircularProgress />
                </Box>
            ) : businessDemands.length === 0 ? (
                <Typography variant="body1" color="text.secondary" align="center" sx={{ my: 4 }}>
                    No demands found for this business
                </Typography>
            ) : (
                <Box sx={{ mt: 2 }}>
                    {businessDemands.map((demand) => (
                        <DemandCard 
                            key={demand.id} 
                            demand={demand} 
                            services={businessServices}
                        />
                    ))}
                </Box>
            )}
        </DialogContent>
    </Dialog>
}
