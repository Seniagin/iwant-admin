import React from "react";
import { Drawer, IconButton, Typography, Box } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';

export function RightDrawer({ children, setIsDrawerOpen, isOpen, name }: {
    children: React.ReactNode,
    name: string,
    setIsDrawerOpen: (isOpen: boolean) => void,
    isOpen: boolean
}): React.ReactElement {
    return <Drawer
        anchor="right"
        open={isOpen}
        onClose={() => {
            setIsDrawerOpen(false);
        }}
    >
        <Box sx={{ width: 400, p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">{name}</Typography>
                <IconButton onClick={() => {
                    setIsDrawerOpen(false);
                }}>
                    <CloseIcon />
                </IconButton>
            </Box>
            {children}
        </Box>
    </Drawer>
}
