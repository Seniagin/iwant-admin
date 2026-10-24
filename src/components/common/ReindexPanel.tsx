import React from 'react';
import { Box, Button, CircularProgress, LinearProgress, Typography } from '@mui/material';
import { ReindexStatus } from '../../service/reindex.api.service';

interface ReindexPanelProps {
    status: ReindexStatus | null;
    error?: string | null;
    onStart: () => void;
    /** Why this page offers the button — differs between the playground and the parameters page. */
    hint?: string;
}

const CONFIRM_TEXT =
    'Re-derive translations, categories, matching vectors and parameter values for EVERY business? ' +
    'This makes several OpenAI calls per business and can take a while.';

/**
 * Start button plus live progress for the background reindex. Shared because
 * both the playground and the parameters page need the same run: extraction is
 * part of the same reconcile pass, so there is one reindex, not one per page.
 */
export const ReindexPanel: React.FC<ReindexPanelProps> = ({ status, error, onStart, hint }) => {
    const handleClick = () => {
        if (window.confirm(CONFIRM_TEXT)) onStart();
    };

    return (
        <Box>
            <Button
                variant="outlined"
                color="warning"
                fullWidth
                onClick={handleClick}
                disabled={!!status?.running}
                startIcon={status?.running ? <CircularProgress size={18} color="inherit" /> : undefined}
            >
                {status?.running ? 'Reindexing…' : 'Reindex all businesses'}
            </Button>

            {hint && (
                <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                    {hint}
                </Typography>
            )}

            {error && (
                <Typography variant="caption" color="error" display="block" mt={0.5}>
                    {error}
                </Typography>
            )}

            {status && (status.running || status.finishedAt) && (
                <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" display="block">
                        {status.processed}/{status.total} processed
                        {status.failed > 0 && ` · ${status.failed} failed`}
                        {!status.running && ' · done'}
                    </Typography>
                    {status.total > 0 && (
                        <LinearProgress
                            variant="determinate"
                            value={Math.min(100, (status.processed / status.total) * 100)}
                            sx={{ mt: 0.5 }}
                        />
                    )}
                    {status.lastError && (
                        <Typography variant="caption" color="error" display="block" mt={0.5}>
                            Last error: {status.lastError}
                        </Typography>
                    )}
                </Box>
            )}
        </Box>
    );
};
