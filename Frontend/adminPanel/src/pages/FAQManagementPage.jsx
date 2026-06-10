import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    TextField,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Chip,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    MenuItem,
    Select,
    InputAdornment,
    CircularProgress,
    Alert
} from '@mui/material';
import {
    Plus,
    Edit2,
    Trash2,
    HelpCircle,
    ChevronDown,
    Search,
    CheckCircle
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import apiService from '../services/apiService';

const FAQManagementPage = () => {
    const [faqs, setFaqs] = useState([]);
    const [stats, setStats] = useState({ totalFAQs: 0, publishedFAQs: 0, draftFAQs: 0, categoriesCount: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingFAQ, setEditingFAQ] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All Categories');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [faqToDelete, setFaqToDelete] = useState(null);
    const [saving, setSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        question: '',
        answer: '',
        category: 'General',
        status: 'published',
        order: faqs.length + 1
    });

    const categories = ['General', 'Account', 'Subscription', 'Features', 'Support', 'Billing'];

    // Load FAQs and stats on mount
    useEffect(() => {
        loadFAQs();
        loadStats();
    }, []);

    const loadFAQs = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await apiService.getAllFAQsAdmin();
            const faqList = Array.isArray(response?.data)
                ? response.data
                : Array.isArray(response)
                    ? response
                    : [];

            // Convert API response to match frontend format
            const convertedFAQs = faqList.map(faq => ({
                id: faq.faqId || faq.FAQId,
                question: faq.question || faq.Question || '',
                answer: faq.answer || faq.Answer || '',
                category: faq.category || faq.Category || 'General',
                status: faq.status || faq.Status || 'draft',
                order: faq.displayOrder || faq.DisplayOrder || 1,
                createdAt: faq.createdAt || faq.CreatedAt
                    ? new Date(faq.createdAt || faq.CreatedAt).toISOString().split('T')[0]
                    : ''
            }));
            setFaqs(convertedFAQs);
        } catch (err) {
            console.error('Error loading FAQs:', err);
            setError('Failed to load FAQs. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const response = await apiService.getFAQStats();
            const statsData = response?.data || response || {};
            setStats({
                totalFAQs: statsData.totalFAQs ?? statsData.TotalFAQs ?? 0,
                publishedFAQs: statsData.publishedFAQs ?? statsData.PublishedFAQs ?? 0,
                draftFAQs: statsData.draftFAQs ?? statsData.DraftFAQs ?? 0,
                categoriesCount: statsData.categoriesCount ?? statsData.CategoriesCount ?? 0
            });
        } catch (err) {
            console.error('Error loading stats:', err);
        }
    };

    const statsDisplay = [
        { label: 'Total FAQs', value: stats.totalFAQs, color: '#1e293b' },
        { label: 'Published', value: stats.publishedFAQs, color: '#22c55e' },
        { label: 'Categories', value: stats.categoriesCount, color: '#a855f7' },
        { label: 'Drafts', value: stats.draftFAQs, color: '#f59e0b' }
    ];

    const handleOpenDialog = (faq = null) => {
        if (faq) {
            setEditingFAQ(faq);
            setFormData({
                question: faq.question,
                answer: faq.answer,
                category: faq.category,
                status: faq.status,
                order: faq.order
            });
        } else {
            setEditingFAQ(null);
            setFormData({
                question: '',
                answer: '',
                category: 'General',
                status: 'published',
                order: faqs.length + 1
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingFAQ(null);
        setFormData({
            question: '',
            answer: '',
            category: 'General',
            status: 'published',
            order: faqs.length + 1
        });
    };

    const handleSaveFAQ = async () => {
        try {
            setSaving(true);
            setError(null);

            if (editingFAQ) {
                // Update existing FAQ
                await apiService.updateFAQ(editingFAQ.id, formData);
            } else {
                // Create new FAQ
                await apiService.createFAQ(formData);
            }

            handleCloseDialog();
            await loadFAQs();
            await loadStats();
        } catch (err) {
            console.error('Error saving FAQ:', err);
            setError(err.message || 'Failed to save FAQ. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteClick = (faq) => {
        setFaqToDelete(faq);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        try {
            setSaving(true);
            setError(null);

            if (faqToDelete) {
                await apiService.deleteFAQ(faqToDelete.id);
                await loadFAQs();
                await loadStats();
            }

            setDeleteDialogOpen(false);
            setFaqToDelete(null);
        } catch (err) {
            console.error('Error deleting FAQ:', err);
            setError(err.message || 'Failed to delete FAQ. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const filteredFAQs = faqs.filter(faq => {
        const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === 'All Categories' || faq.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    return (
        <AdminLayout>
            <Box>
                {/* Header */}
                <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                        <Typography variant="h4" fontWeight="800" sx={{ color: '#1a1a1a', mb: 1 }}>
                            FAQ Management
                        </Typography>
                        <Typography variant="body2" color="#666" fontWeight="500">
                            Manage frequently asked questions for your users
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<Plus size={18} />}
                        onClick={() => handleOpenDialog()}
                        disabled={loading}
                        sx={{
                            bgcolor: '#a855f7',
                            color: 'white',
                            fontWeight: 700,
                            textTransform: 'none',
                            px: 3,
                            py: 1.2,
                            borderRadius: '12px',
                            '&:hover': { bgcolor: '#9333ea' }
                        }}
                    >
                        Add New FAQ
                    </Button>
                </Box>

                {/* Error Display */}
                {error && (
                    <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {/* Stats Cards */}
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                    gap: 3,
                    mb: 4,
                    width: '100%'
                }}>
                    {statsDisplay.map((stat, i) => (
                        <Paper key={i} elevation={0} sx={{
                            p: 3,
                            borderRadius: '20px',
                            border: '1px solid #edf2f7',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            bgcolor: 'white',
                            '&:hover': {
                                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
                                transform: 'translateY(-4px)'
                            }
                        }}>
                            <Typography variant="caption" sx={{
                                color: '#64748b',
                                fontWeight: 700,
                                mb: 1,
                                display: 'block',
                                textTransform: 'uppercase'
                            }}>
                                {stat.label}
                            </Typography>
                            <Typography variant="h3" fontWeight="800" sx={{ color: stat.color }}>
                                {stat.value}
                            </Typography>
                        </Paper>
                    ))}
                </Box>

                {/* Filters */}
                <Paper elevation={0} sx={{
                    p: 3,
                    borderRadius: '20px',
                    border: '1px solid #edf2f7',
                    mb: 3
                }}>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <TextField
                            size="small"
                            placeholder="Search FAQs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            sx={{
                                flexGrow: 1,
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '12px',
                                    bgcolor: '#f8fafc'
                                }
                            }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search size={18} color="#94a3b8" />
                                    </InputAdornment>
                                )
                            }}
                        />
                        <Select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            size="small"
                            sx={{
                                minWidth: 180,
                                borderRadius: '12px',
                                bgcolor: '#f8fafc',
                                '& fieldset': { border: 'none' },
                                fontWeight: 600
                            }}
                        >
                            <MenuItem value="All Categories">All Categories</MenuItem>
                            {categories.map(cat => (
                                <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                            ))}
                        </Select>
                    </Box>
                </Paper>

                {/* FAQ List */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {loading ? (
                        <Paper elevation={0} sx={{
                            p: 6,
                            borderRadius: '20px',
                            border: '1px solid #edf2f7',
                            textAlign: 'center'
                        }}>
                            <CircularProgress sx={{ color: '#a855f7' }} />
                            <Typography variant="body2" color="#94a3b8" sx={{ mt: 2 }}>
                                Loading FAQs...
                            </Typography>
                        </Paper>
                    ) : filteredFAQs.length === 0 ? (
                        <Paper elevation={0} sx={{
                            p: 6,
                            borderRadius: '20px',
                            border: '1px solid #edf2f7',
                            textAlign: 'center'
                        }}>
                            <HelpCircle size={48} color="#94a3b8" style={{ margin: '0 auto 16px' }} />
                            <Typography variant="h6" fontWeight="700" color="#64748b" sx={{ mb: 1 }}>
                                No FAQs found
                            </Typography>
                            <Typography variant="body2" color="#94a3b8">
                                {searchQuery || categoryFilter !== 'All Categories'
                                    ? 'Try adjusting your filters'
                                    : 'Get started by adding your first FAQ'
                                }
                            </Typography>
                        </Paper>
                    ) : (
                        filteredFAQs.map((faq, index) => (
                            <Accordion
                                key={faq.id}
                                elevation={0}
                                sx={{
                                    borderRadius: '20px !important',
                                    border: '1px solid #edf2f7',
                                    '&:before': { display: 'none' },
                                    overflow: 'hidden',
                                    mb: 0
                                }}
                            >
                                <AccordionSummary
                                    expandIcon={<ChevronDown size={20} />}
                                    sx={{
                                        '& .MuiAccordionSummary-content': {
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: 2
                                        }
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                                        <Box sx={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: '8px',
                                            bgcolor: '#f0fdf4',
                                            color: '#22c55e',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 700,
                                            fontSize: '0.85rem'
                                        }}>
                                            {faq.order}
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="body1" fontWeight="700" sx={{ color: '#1a1a1a' }}>
                                                {faq.question}
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                                <Chip
                                                    label={faq.category}
                                                    size="small"
                                                    sx={{
                                                        height: '20px',
                                                        fontSize: '0.7rem',
                                                        fontWeight: 600,
                                                        bgcolor: '#f0f9ff',
                                                        color: '#3b82f6',
                                                        '& .MuiChip-label': { px: 1 }
                                                    }}
                                                />
                                                <Chip
                                                    label={faq.status}
                                                    size="small"
                                                    icon={<CheckCircle size={12} />}
                                                    sx={{
                                                        height: '20px',
                                                        fontSize: '0.7rem',
                                                        fontWeight: 600,
                                                        bgcolor: '#f0fdf4',
                                                        color: '#22c55e',
                                                        '& .MuiChip-label': { px: 1 },
                                                        '& .MuiChip-icon': { ml: 1 }
                                                    }}
                                                />
                                            </Box>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 1 }} onClick={(e) => e.stopPropagation()}>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleOpenDialog(faq)}
                                            sx={{
                                                color: '#64748b',
                                                '&:hover': { bgcolor: '#f1f5f9', color: '#a855f7' }
                                            }}
                                        >
                                            <Edit2 size={16} />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleDeleteClick(faq)}
                                            sx={{
                                                color: '#64748b',
                                                '&:hover': { bgcolor: '#fef2f2', color: '#ef4444' }
                                            }}
                                        >
                                            <Trash2 size={16} />
                                        </IconButton>
                                    </Box>
                                </AccordionSummary>
                                <AccordionDetails sx={{ pt: 0, pb: 3, px: 3 }}>
                                    <Box sx={{
                                        pl: 6,
                                        pt: 2,
                                        borderTop: '1px solid #f1f5f9'
                                    }}>
                                        <Typography variant="body2" sx={{ color: '#64748b', lineHeight: 1.7 }}>
                                            {faq.answer}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#94a3b8', mt: 2, display: 'block' }}>
                                            Created: {faq.createdAt}
                                        </Typography>
                                    </Box>
                                </AccordionDetails>
                            </Accordion>
                        ))
                    )}
                </Box>
            </Box>

            {/* Add/Edit Dialog */}
            <Dialog
                open={openDialog}
                onClose={handleCloseDialog}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: '20px',
                        p: 1
                    }
                }}
            >
                <DialogTitle sx={{ fontWeight: 800, fontSize: '1.5rem', pb: 1 }}>
                    {editingFAQ ? 'Edit FAQ' : 'Add New FAQ'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
                        <TextField
                            label="Question"
                            fullWidth
                            value={formData.question}
                            onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                            placeholder="Enter the FAQ question"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '12px'
                                }
                            }}
                        />
                        <TextField
                            label="Answer"
                            fullWidth
                            multiline
                            rows={4}
                            value={formData.answer}
                            onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                            placeholder="Enter the detailed answer"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '12px'
                                }
                            }}
                        />
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                            <TextField
                                label="Category"
                                select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '12px'
                                    }
                                }}
                            >
                                {categories.map((cat) => (
                                    <MenuItem key={cat} value={cat}>
                                        {cat}
                                    </MenuItem>
                                ))}
                            </TextField>
                            <TextField
                                label="Status"
                                select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '12px'
                                    }
                                }}
                            >
                                <MenuItem value="published">Published</MenuItem>
                                <MenuItem value="draft">Draft</MenuItem>
                            </TextField>
                            <TextField
                                label="Order"
                                type="number"
                                value={formData.order}
                                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '12px'
                                    }
                                }}
                            />
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 2 }}>
                    <Button
                        onClick={handleCloseDialog}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 600,
                            color: '#64748b',
                            px: 3
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSaveFAQ}
                        variant="contained"
                        disabled={!formData.question || !formData.answer || saving}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 700,
                            bgcolor: '#a855f7',
                            px: 4,
                            borderRadius: '12px',
                            '&:hover': { bgcolor: '#9333ea' }
                        }}
                    >
                        {saving ? (
                            <><CircularProgress size={20} sx={{ color: 'white', mr: 1 }} /> Saving...</>
                        ) : (
                            editingFAQ ? 'Update FAQ' : 'Create FAQ'
                        )}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                PaperProps={{
                    sx: {
                        borderRadius: '20px',
                        p: 1
                    }
                }}
            >
                <DialogTitle sx={{ fontWeight: 800, fontSize: '1.25rem' }}>
                    Delete FAQ
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body1" color="#64748b">
                        Are you sure you want to delete this FAQ? This action cannot be undone.
                    </Typography>
                    {faqToDelete && (
                        <Box sx={{ mt: 2, p: 2, bgcolor: '#fef2f2', borderRadius: '12px', border: '1px solid #fecaca' }}>
                            <Typography variant="body2" fontWeight="700" color="#1a1a1a">
                                {faqToDelete.question}
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 2 }}>
                    <Button
                        onClick={() => setDeleteDialogOpen(false)}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 600,
                            color: '#64748b',
                            px: 3
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDeleteConfirm}
                        variant="contained"
                        disabled={saving}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 700,
                            bgcolor: '#ef4444',
                            px: 4,
                            borderRadius: '12px',
                            '&:hover': { bgcolor: '#dc2626' }
                        }}
                    >
                        {saving ? (
                            <><CircularProgress size={20} sx={{ color: 'white', mr: 1 }} /> Deleting...</>
                        ) : (
                            'Delete'
                        )}
                    </Button>
                </DialogActions>
            </Dialog>
        </AdminLayout>
    );
};

export default FAQManagementPage;
