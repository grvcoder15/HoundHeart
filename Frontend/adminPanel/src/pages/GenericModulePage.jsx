import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import AdminLayout from '../components/AdminLayout';

const GenericModulePage = ({ title, description }) => {
    return (
        <AdminLayout>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight="900" sx={{ letterSpacing: '-0.03em', mb: 1 }}>
                    {title}
                </Typography>
                <Typography variant="body1" color="text.secondary" fontWeight="500">
                    {description || 'This module is under development and will be available soon.'}
                </Typography>
            </Box>

            <Paper
                elevation={0}
                sx={{
                    p: 10,
                    borderRadius: 5,
                    border: '1px solid #e2e8f0',
                    textAlign: 'center',
                    bgcolor: '#f8fafc'
                }}
            >
                <Typography variant="h6" fontWeight="700" color="#94a3b8">
                    Module Interface Placeholder
                </Typography>
                <Typography variant="body2" color="#94a3b8" mt={1}>
                    Full management functionality for {title} flow is being implemented.
                </Typography>
            </Paper>
        </AdminLayout>
    );
};

export default GenericModulePage;
