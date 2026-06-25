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
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    InputAdornment
} from '@mui/material';
import { Plus, Edit2, Trash2, Image as ImageIcon } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';

const StoreManagementPage = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form state
    const [currentId, setCurrentId] = useState(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [displayOrder, setDisplayOrder] = useState('0');
    const [imageFile, setImageFile] = useState(null);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/store/products`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });
            const data = await response.json();
            if (data.success) {
                setProducts(data.data);
            }
        } catch (err) {
            console.error('Error fetching products:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const resetForm = () => {
        setCurrentId(null);
        setName('');
        setDescription('');
        setPrice('');
        setDisplayOrder('0');
        setImageFile(null);
        setIsEditing(false);
    };

    const handleOpenModal = (product = null) => {
        if (product) {
            setCurrentId(product.id);
            setName(product.name);
            setDescription(product.description || '');
            setPrice(product.price);
            setDisplayOrder(product.displayOrder);
            setIsEditing(true);
        } else {
            resetForm();
        }
        setOpenDialog(true);
    };

    const handleCloseModal = () => {
        setOpenDialog(false);
        resetForm();
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setSaving(true);
        
        const formData = new FormData();
        formData.append('name', name);
        formData.append('description', description);
        formData.append('price', price);
        formData.append('displayOrder', displayOrder);
        if (imageFile) {
            formData.append('imageFile', imageFile);
        }

        try {
            let url = `${import.meta.env.VITE_API_URL}/admin/store/products`;
            let method = 'POST';

            if (isEditing) {
                url = `${import.meta.env.VITE_API_URL}/admin/store/products/${currentId}`;
                method = 'PUT';
            }

            const token = localStorage.getItem('adminToken'); 
            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json();
            if (data.success) {
                handleCloseModal();
                fetchProducts();
            } else {
                alert(data.message || 'Error saving product');
            }
        } catch (err) {
            console.error(err);
            alert('Network error while saving product');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this merchandise item?")) {
            try {
                const token = localStorage.getItem('adminToken');
                const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/store/products/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = await response.json();
                if (data.success) {
                    fetchProducts();
                } else {
                    alert(data.message);
                }
            } catch (err) {
                console.error(err);
            }
        }
    };

    return (
        <AdminLayout>
            <Box sx={{ p: 3 }}>
                {/* Header Section */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1e293b' }}>
                        Merchandise Management
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<Plus size={20} />}
                        onClick={() => handleOpenModal()}
                        sx={{
                            backgroundColor: '#8b5cf6',
                            '&:hover': { backgroundColor: '#7c3aed' },
                            textTransform: 'none',
                            fontWeight: 600,
                            borderRadius: 2,
                            px: 3
                        }}
                    >
                        Add New Item
                    </Button>
                </Box>

                {/* Table Section */}
                <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 2, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                    <TableContainer sx={{ maxHeight: 'calc(100vh - 200px)' }}>
                        <Table stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f8fafc', color: '#64748b' }}>Image</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f8fafc', color: '#64748b' }}>Name</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f8fafc', color: '#64748b' }}>Price</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f8fafc', color: '#64748b' }}>Order</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f8fafc', color: '#64748b', textAlign: 'right' }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                                            <CircularProgress size={30} />
                                        </TableCell>
                                    </TableRow>
                                ) : products.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py: 3, color: '#64748b' }}>
                                            No merchandise items found. Click 'Add New Item' to begin.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    products.map(product => (
                                        <TableRow key={product.id} hover>
                                            <TableCell>
                                                {product.imageUrl ? (
                                                    <Box
                                                        component="img"
                                                        src={product.imageUrl}
                                                        alt={product.name}
                                                        sx={{ width: 48, height: 48, borderRadius: 1, objectFit: 'cover' }}
                                                    />
                                                ) : (
                                                    <Box sx={{ width: 48, height: 48, borderRadius: 1, backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <ImageIcon size={20} color="#94a3b8" />
                                                    </Box>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body1" sx={{ fontWeight: 600, color: '#334155' }}>
                                                    {product.name}
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: '#64748b', maxWidth: 250, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {product.description}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a' }}>
                                                    ${Number(product.price).toFixed(2)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ color: '#64748b' }}>
                                                    {product.displayOrder}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <IconButton onClick={() => handleOpenModal(product)} size="small" sx={{ color: '#3b82f6', mr: 1 }}>
                                                    <Edit2 size={18} />
                                                </IconButton>
                                                <IconButton onClick={() => handleDelete(product.id)} size="small" sx={{ color: '#ef4444' }}>
                                                    <Trash2 size={18} />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>

                {/* Create/Edit Dialog */}
                <Dialog open={openDialog} onClose={handleCloseModal} maxWidth="sm" fullWidth>
                    <DialogTitle sx={{ fontWeight: 'bold', borderBottom: '1px solid #e2e8f0' }}>
                        {isEditing ? 'Edit Merchandise Item' : 'Add New Item'}
                    </DialogTitle>
                    <DialogContent sx={{ pt: 3 }}>
                        <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                            <TextField
                                label="Item Name"
                                fullWidth
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                            <TextField
                                label="Price"
                                type="number"
                                fullWidth
                                required
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                }}
                            />
                            <TextField
                                label="Short Description"
                                fullWidth
                                multiline
                                rows={3}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                            <TextField
                                label="Display Order"
                                type="number"
                                fullWidth
                                value={displayOrder}
                                onChange={(e) => setDisplayOrder(e.target.value)}
                            />
                            <Box sx={{ mt: 1 }}>
                                <Typography variant="subtitle2" sx={{ mb: 1, color: '#64748b' }}>Product Image</Typography>
                                <Button
                                    variant="outlined"
                                    component="label"
                                    fullWidth
                                    sx={{ textTransform: 'none', justifyContent: 'flex-start', color: '#64748b', borderColor: '#cbd5e1' }}
                                >
                                    {imageFile ? imageFile.name : 'Choose file...'}
                                    <input
                                        type="file"
                                        hidden
                                        accept="image/*"
                                        onChange={(e) => setImageFile(e.target.files[0])}
                                    />
                                </Button>
                                {isEditing && !imageFile && (
                                    <Typography variant="caption" sx={{ color: '#94a3b8', mt: 0.5, display: 'block' }}>
                                        Leave empty to keep current image
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ p: 3, borderTop: '1px solid #e2e8f0' }}>
                        <Button onClick={handleCloseModal} sx={{ color: '#64748b' }}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            variant="contained"
                            disabled={saving}
                            sx={{
                                backgroundColor: '#8b5cf6',
                                '&:hover': { backgroundColor: '#7c3aed' },
                            }}
                        >
                            {saving ? <CircularProgress size={24} sx={{ color: 'white' }} /> : (isEditing ? 'Save Changes' : 'Upload Item')}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </AdminLayout>
    );
};

export default StoreManagementPage;
