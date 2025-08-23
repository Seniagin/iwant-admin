import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Snackbar, Alert, AlertColor } from '@mui/material';

interface SnackbarMessage {
    text: string;
    type: AlertColor;
}

interface SnackbarContextType {
    showMessage: (text: string, type: AlertColor) => void;
    showSuccess: (text: string) => void;
    showError: (text: string) => void;
    showWarning: (text: string) => void;
    showInfo: (text: string) => void;
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);

interface SnackbarProviderProps {
    children: ReactNode;
}

export const SnackbarProvider: React.FC<SnackbarProviderProps> = ({ children }) => {
    const [message, setMessage] = useState<SnackbarMessage | null>(null);

    const showMessage = (text: string, type: AlertColor) => {
        setMessage({ text, type });
    };

    const showSuccess = (text: string) => showMessage(text, 'success');
    const showError = (text: string) => showMessage(text, 'error');
    const showWarning = (text: string) => showMessage(text, 'warning');
    const showInfo = (text: string) => showMessage(text, 'info');

    const handleClose = () => {
        setMessage(null);
    };

    return (
        <SnackbarContext.Provider value={{
            showMessage,
            showSuccess,
            showError,
            showWarning,
            showInfo
        }}>
            {children}
            <Snackbar
                open={!!message}
                autoHideDuration={6000}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={handleClose} severity={message?.type} sx={{ width: '100%' }}>
                    {message?.text}
                </Alert>
            </Snackbar>
        </SnackbarContext.Provider>
    );
};

export const useSnackbar = (): SnackbarContextType => {
    const context = useContext(SnackbarContext);
    if (!context) {
        throw new Error('useSnackbar must be used within a SnackbarProvider');
    }
    return context;
}; 