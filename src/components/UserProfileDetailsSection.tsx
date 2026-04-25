import React from 'react';
import { Box, Divider, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { LocationMapPreview } from './LocationPicker/LocationPicker';
import type { AdminUserDetailResponseDto } from '../service/users.api.service';

export interface UserProfileDetailsSectionProps {
    user: AdminUserDetailResponseDto;
}

function formatDate(dateString: string) {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(dateString));
}

export const UserProfileDetailsSection: React.FC<UserProfileDetailsSectionProps> = ({ user }) => {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                    Profile
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr', sm: '120px 1fr' } }}>
                    <Typography color="text.secondary">Email</Typography>
                    <Typography>{user.email ?? '—'}</Typography>
                    <Typography color="text.secondary">Telegram ID</Typography>
                    <Typography sx={{ fontFamily: 'monospace' }}>{user.telegramId ?? '—'}</Typography>
                    <Typography color="text.secondary">Username</Typography>
                    <Typography>{user.telegramUsername ? `@${user.telegramUsername}` : '—'}</Typography>
                    <Typography color="text.secondary">First / last name</Typography>
                    <Typography>
                        {[user.telegramFirstName, user.telegramLastName].filter(Boolean).join(' ') || '—'}
                    </Typography>
                    <Typography color="text.secondary">Language</Typography>
                    <Typography>{user.telegramLanguageCode ?? '—'}</Typography>
                    <Typography color="text.secondary">Photo URL</Typography>
                    <Typography sx={{ wordBreak: 'break-all' }}>{user.telegramPhotoUrl ?? '—'}</Typography>
                    <Typography color="text.secondary">Created</Typography>
                    <Typography>{formatDate(user.createdAt)}</Typography>
                    <Typography color="text.secondary">Updated</Typography>
                    <Typography>{formatDate(user.updatedAt)}</Typography>
                </Box>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                    Location
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <LocationMapPreview
                    location={
                        user.location
                            ? { latitude: user.location.latitude, longitude: user.location.longitude }
                            : null
                    }
                    height={240}
                />
            </Paper>

            <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                    Contacts
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {user.contacts.length === 0 ? (
                    <Typography color="text.secondary">No contacts</Typography>
                ) : (
                    <TableContainer sx={{ maxWidth: '100%' }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>ID</TableCell>
                                    <TableCell>Email</TableCell>
                                    <TableCell>Phone</TableCell>
                                    <TableCell>Updated</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {user.contacts.map((c) => (
                                    <TableRow key={c.id}>
                                        <TableCell sx={{ fontFamily: 'monospace' }}>{c.id}</TableCell>
                                        <TableCell>{c.email ?? '—'}</TableCell>
                                        <TableCell>{c.phone ?? '—'}</TableCell>
                                        <TableCell>{formatDate(c.updatedAt)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>
        </Box>
    );
};
