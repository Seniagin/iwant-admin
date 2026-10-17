import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    Checkbox,
    Chip,
    CircularProgress,
    FormControlLabel,
    Link as MuiLink,
    Switch,
    Typography,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import {
    approveDemand,
    getReviewQueue,
    getSettings,
    previewRecipients,
    rejectDemand,
    updateSettings,
    type ReviewItem,
    type ReviewRecipients,
} from '../service/moderation.api.service';

/** Tells the navigation's counter to recount. */
export const MODERATION_CHANGED_EVENT = 'iwant:moderation-changed';
const announce = () => window.dispatchEvent(new Event(MODERATION_CHANGED_EVENT));

const REFRESH_MS = 20_000;

/**
 * Manual moderation of requests: the switch, and the requests waiting for an
 * answer. Approving sends a request to the businesses left ticked; rejecting
 * closes it and the client gets a push.
 */
export const ModerationPage: React.FC = () => {
    const [enabled, setEnabled] = useState<boolean | null>(null);
    const [savingSwitch, setSavingSwitch] = useState(false);
    const [queue, setQueue] = useState<ReviewItem[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        try {
            setQueue(await getReviewQueue());
        } catch (e: any) {
            setError(e.message ?? 'Failed to load the queue');
        }
    }, []);

    useEffect(() => {
        getSettings()
            .then((s) => setEnabled(s.demandReview))
            .catch((e: any) => setError(e.message ?? 'Failed to load settings'));
        void load();
        const timer = setInterval(() => void load(), REFRESH_MS);
        return () => clearInterval(timer);
    }, [load]);

    const toggle = async (next: boolean) => {
        setSavingSwitch(true);
        setError(null);
        try {
            setEnabled((await updateSettings({ demandReview: next })).demandReview);
            announce();
        } catch (e: any) {
            setError(e.message ?? 'Failed to save');
        } finally {
            setSavingSwitch(false);
        }
    };

    const answered = (id: number) => {
        setQueue((prev) => prev?.filter((item) => item.id !== id) ?? prev);
        announce();
    };

    return (
        <Box sx={{ p: 3, maxWidth: 900 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
                🛡️ Request moderation
            </Typography>

            <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={!!enabled}
                                disabled={enabled === null || savingSwitch}
                                onChange={(e) => void toggle(e.target.checked)}
                            />
                        }
                        label={
                            <Typography fontWeight={600}>
                                Manual moderation {enabled ? 'on' : 'off'}
                            </Typography>
                        }
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {enabled
                            ? 'Every new request waits here. Businesses hear nothing until you approve it; the client sees “being checked”.'
                            : 'Requests go to their businesses as soon as they pass the automatic text check. Turn on to review each one first.'}
                    </Typography>
                    {!enabled && queue && queue.length > 0 && (
                        <Alert severity="info" sx={{ mt: 1.5 }}>
                            {queue.length} {queue.length === 1 ? 'request is' : 'requests are'} still waiting from when moderation was on —
                            answer them below; turning moderation off doesn’t send them.
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5, gap: 1 }}>
                <Typography variant="subtitle1" fontWeight={700}>
                    Waiting {queue ? `(${queue.length})` : ''}
                </Typography>
                <Button size="small" onClick={() => void load()}>Refresh</Button>
            </Box>

            {queue === null ? (
                <CircularProgress size={24} />
            ) : queue.length === 0 ? (
                <Typography variant="body2" color="text.secondary">Nothing waiting.</Typography>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {queue.map((item) => (
                        <ReviewCard key={item.id} item={item} onAnswered={() => answered(item.id)} onError={setError} />
                    ))}
                </Box>
            )}
        </Box>
    );
};

function ReviewCard({ item, onAnswered, onError }: {
    item: ReviewItem;
    onAnswered(): void;
    onError(message: string): void;
}) {
    const [recipients, setRecipients] = useState<ReviewRecipients | null>(item.recipients);
    const [ticked, setTicked] = useState<Set<string>>(
        () => new Set(item.recipients?.businesses.map((b) => b.id) ?? []),
    );
    const [busy, setBusy] = useState<'approve' | 'reject' | 'preview' | null>(null);
    const chosen = !!item.recipients;
    const reaching = recipients?.businesses.filter((b) => b.hasOwner && (!chosen || ticked.has(b.id))).length ?? 0;

    const preview = async () => {
        setBusy('preview');
        try {
            setRecipients(await previewRecipients(item.id));
        } catch (e: any) {
            onError(e.message ?? 'Preview failed');
        } finally {
            setBusy(null);
        }
    };

    const approve = async () => {
        setBusy('approve');
        try {
            const all = item.recipients?.businesses.map((b) => b.id) ?? [];
            const subset = chosen && ticked.size < all.length ? Array.from(ticked) : undefined;
            await approveDemand(item.id, subset);
            onAnswered();
        } catch (e: any) {
            onError(e.message ?? 'Approve failed');
            setBusy(null);
        }
    };

    const reject = async () => {
        if (!window.confirm('Reject this request? The client is told it was not published.')) return;
        setBusy('reject');
        try {
            await rejectDemand(item.id);
            onAnswered();
        } catch (e: any) {
            onError(e.message ?? 'Reject failed');
            setBusy(null);
        }
    };

    const toggle = (id: string) =>
        setTicked((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });

    return (
        <Card variant="outlined">
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'baseline' }}>
                    <Typography variant="caption" color="text.secondary">
                        #{item.id} · {new Date(item.createdAt).toLocaleString()} ·{' '}
                        {item.client ? (
                            <MuiLink component={RouterLink} to={`/users/${item.client.id}`}>
                                {item.client.email ?? `client #${item.client.id}`}
                            </MuiLink>
                        ) : 'unknown client'}
                        {item.client?.languageCode ? ` · ${item.client.languageCode}` : ''}
                    </Typography>
                    {item.timing?.raw && <Chip size="small" label={item.timing.raw} />}
                </Box>

                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{item.text}</Typography>
                <Typography variant="caption" color="text.secondary">
                    Businesses read these words translated into their own language, with the original a tap away.
                    {item.translation && item.translation !== item.text && <> EN (for matching): {item.translation}</>}
                </Typography>

                <Box sx={{ mt: 1 }}>
                    <Typography variant="subtitle2" fontWeight={700}>
                        {recipients
                            ? `Goes to ${chosen ? `${ticked.size} of ${recipients.businesses.length} chosen` : `${recipients.businesses.length} matched`} businesses`
                            : 'Goes to: the matcher picks businesses on approval'}
                    </Typography>
                    {!recipients && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            <Typography variant="body2" color="text.secondary">
                                The client chose no businesses.
                            </Typography>
                            <Button size="small" onClick={() => void preview()} disabled={busy !== null}>
                                {busy === 'preview' ? 'Matching…' : 'Preview who (runs the matcher)'}
                            </Button>
                        </Box>
                    )}
                    {recipients && recipients.businesses.length === 0 && (
                        <Typography variant="body2" color="error">Nobody matches — approving sends it to no one.</Typography>
                    )}
                    {recipients && recipients.businesses.map((b) => (
                        <Box key={b.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.25 }}>
                            {chosen && (
                                <Checkbox size="small" checked={ticked.has(b.id)} onChange={() => toggle(b.id)} sx={{ p: 0.5 }} />
                            )}
                            <Avatar src={b.logoUrl ?? undefined} sx={{ width: 28, height: 28, fontSize: 13 }}>
                                {b.name[0]}
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                                <MuiLink component={RouterLink} to={`/businesses/${b.id}`} fontWeight={600} variant="body2">
                                    {b.name}
                                </MuiLink>
                                <Typography variant="caption" color="text.secondary" display="block" noWrap>
                                    {[b.distanceKm != null ? `${b.distanceKm} km` : null, b.address, b.phone].filter(Boolean).join(' · ')}
                                </Typography>
                            </Box>
                            {!b.hasOwner && <Chip size="small" variant="outlined" label="no owner — won’t hear" sx={{ ml: 'auto' }} />}
                        </Box>
                    ))}
                    {recipients && recipients.businesses.length > 0 && (
                        <Typography variant="caption" color="text.secondary">
                            {reaching} with an owner will get it (push and dashboard).
                        </Typography>
                    )}
                </Box>

                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Button
                        variant="contained"
                        color="success"
                        size="small"
                        disabled={busy !== null || (chosen && ticked.size === 0)}
                        onClick={() => void approve()}
                    >
                        {busy === 'approve' ? 'Sending…' : 'Approve and send'}
                    </Button>
                    <Button color="error" size="small" disabled={busy !== null} onClick={() => void reject()}>
                        {busy === 'reject' ? 'Rejecting…' : 'Reject'}
                    </Button>
                </Box>
            </CardContent>
        </Card>
    );
}
