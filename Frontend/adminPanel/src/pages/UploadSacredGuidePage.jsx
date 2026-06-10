import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    LinearProgress,
    Alert,
    TextField,
    Tooltip,
    Collapse
} from '@mui/material';
import {
    Upload,
    FileText,
    CheckCircle2,
    Info,
    ArrowLeft,
    X,
    RefreshCw,
    Loader2,
    BookOpen,
    AlertCircle,
    FileIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import apiService from '../services/apiService';

const MAX_TITLE = 200;
const MAX_DESC = 1000;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const ACCEPTED_TYPES = [
    'application/pdf'
];
const ACCEPTED_EXT = '.pdf';

const inputSx = {
    '& .MuiOutlinedInput-root': {
        borderRadius: 3,
        bgcolor: '#fff',
        '&:hover fieldset': { borderColor: '#cbd5e1' },
        '&.Mui-focused fieldset': { borderColor: '#8b5cf6', borderWidth: '1.5px' },
    },
    '& .MuiInputLabel-root.Mui-focused': { color: '#8b5cf6' },
};

const errorInputSx = {
    '& .MuiOutlinedInput-root': {
        borderRadius: 3,
        bgcolor: '#fff',
        '& fieldset': { borderColor: '#ef4444' },
        '&:hover fieldset': { borderColor: '#dc2626' },
        '&.Mui-focused fieldset': { borderColor: '#ef4444', borderWidth: '1.5px' },
    },
    '& .MuiInputLabel-root': { color: '#ef4444' },
    '& .MuiInputLabel-root.Mui-focused': { color: '#ef4444' },
};

const UploadSacredGuidePage = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const titleRef = useRef(null);

    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [globalError, setGlobalError] = useState('');
    const [success, setSuccess] = useState(false);

    // Form fields
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [totalPages, setTotalPages] = useState('');
    const [chapters, setChapters] = useState('');
    const [distribution, setDistribution] = useState('Exclusive');

    // Field errors
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});

    // Auto-focus title on mount and fetch existing active guide to prefill
    useEffect(() => {
        titleRef.current?.focus();
        const fetchExistingGuide = async () => {
            try {
                const res = await apiService.getAllSacredGuides();
                if (res?.data && res.data.length > 0) {
                    const activeGuide = res.data.find(g => g.isActive) || res.data[0];
                    if (activeGuide) {
                        setTitle(activeGuide.title || '');
                        setDescription(activeGuide.description || '');
                        setPrice(activeGuide.price !== null && activeGuide.price !== undefined ? activeGuide.price.toString() : '');
                        setTotalPages(activeGuide.totalPages !== null && activeGuide.totalPages !== undefined ? activeGuide.totalPages.toString() : '');
                        setChapters(activeGuide.chapters !== null && activeGuide.chapters !== undefined ? activeGuide.chapters.toString() : '');

                        // We need the full object to get distribution, let's just make a specific status call to get full details if needed, 
                        // or just rely on what's returned. `getAllSacredGuides` returns distribution? Let's check the API. 
                        // Wait, list API does not return distribution. Let's use getSacredGuideStatus(id).
                    }
                }
            } catch (error) {
                console.error("Failed to fetch existing guide to prefill:", error);
            }
        };
        fetchExistingGuide();
    }, []);

    // ─── Validation ───────────────────────────────
    const validateField = (name, value) => {
        switch (name) {
            case 'title':
                if (!value || !value.trim()) return 'Title is required';
                if (value.trim().length < 3) return 'Title must be at least 3 characters';
                if (value.length > MAX_TITLE) return `Title must be under ${MAX_TITLE} characters`;
                return '';
            case 'description':
                if (value && value.length > MAX_DESC) return `Description must be under ${MAX_DESC} characters`;
                return '';
            case 'price':
                if (!value || !value.trim()) return 'Price is required';
                const num = Number(value);
                if (isNaN(num)) return 'Enter a valid number';
                if (num < 0) return 'Price cannot be negative';
                if (num > 99999) return 'Price seems too high';
                return '';
            case 'totalPages':
                if (value && isNaN(Number(value))) return 'Enter a valid number';
                return '';
            case 'chapters':
                if (value && isNaN(Number(value))) return 'Enter a valid number';
                return '';
            case 'distribution':
                if (!value || !value.trim()) return 'Distribution is required';
                return '';
            default:
                return '';
        }
    };

    const handleFieldChange = (name, value) => {
        if (name === 'title') setTitle(value);
        else if (name === 'description') setDescription(value);
        else if (name === 'price') setPrice(value);
        else if (name === 'totalPages') setTotalPages(value);
        else if (name === 'chapters') setChapters(value);
        else if (name === 'distribution') setDistribution(value);

        if (touched[name]) {
            setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
        }
    };

    const handleBlur = (name) => {
        setTouched(prev => ({ ...prev, [name]: true }));
        const value = name === 'title' ? title : name === 'description' ? description : name === 'price' ? price : name === 'totalPages' ? totalPages : name === 'chapters' ? chapters : distribution;
        setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
    };

    const isFormValid = () => {
        const titleErr = validateField('title', title);
        const descErr = validateField('description', description);
        const priceErr = validateField('price', price);
        const pagesErr = validateField('totalPages', totalPages);
        const chapErr = validateField('chapters', chapters);
        const distErr = validateField('distribution', distribution);
        return !titleErr && !descErr && !priceErr && !pagesErr && !chapErr && !distErr && selectedFile;
    };

    // ─── File handling ────────────────────────────
    const validateFile = (file) => {
        if (!file) return 'No file selected';
        const name = file.name.toLowerCase();
        if (!name.endsWith('.pdf')) return 'Only PDF files are accepted (required for user PDF reading capability)';
        if (file.size > MAX_FILE_SIZE) return 'File size must be under 50 MB';
        return null;
    };

    const handleFile = useCallback((file) => {
        setGlobalError('');
        setSuccess(false);
        const err = validateFile(file);
        if (err) { setGlobalError(err); return; }
        setSelectedFile(file);
    }, []);

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
        else if (e.type === 'dragleave') setDragActive(false);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
    }, [handleFile]);

    const handleFileSelect = (e) => {
        if (e.target.files?.[0]) handleFile(e.target.files[0]);
    };

    const removeFile = () => {
        setSelectedFile(null);
        setGlobalError('');
        setSuccess(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const replaceFile = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
            fileInputRef.current.click();
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    // ─── Upload ───────────────────────────────────
    const handleUpload = async () => {
        // Touch all fields to show errors
        setTouched({ title: true, description: true, price: true });
        const titleErr = validateField('title', title);
        const descErr = validateField('description', description);
        const priceErr = validateField('price', price);
        setErrors({ title: titleErr, description: descErr, price: priceErr });

        if (titleErr || descErr || priceErr) {
            setGlobalError('Please fix the errors above before submitting.');
            return;
        }
        if (!selectedFile) {
            setGlobalError('Please upload a document file.');
            return;
        }

        setUploading(true);
        setUploadProgress(0);
        setGlobalError('');

        try {
            const formData = new FormData();
            formData.append('docxFile', selectedFile);
            formData.append('title', title.trim());
            formData.append('description', description.trim());
            formData.append('price', price.trim());
            if (totalPages.trim()) formData.append('totalPages', totalPages.trim());
            if (chapters.trim()) formData.append('chapters', chapters.trim());
            if (distribution.trim()) formData.append('distribution', distribution.trim());

            const progressInterval = setInterval(() => {
                setUploadProgress(prev => Math.min(prev + 8, 88));
            }, 400);

            const res = await apiService.uploadSacredGuide(formData);

            clearInterval(progressInterval);
            setUploadProgress(100);

            if (res?.success) {
                setSuccess(true);
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
                setTimeout(() => navigate('/sacred-guide'), 2500);
            } else {
                setGlobalError(res?.message || 'Upload failed. Please try again.');
            }
        } catch (err) {
            setGlobalError(err.message || 'Upload failed. Please try again.');
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const guidelines = [
        '✓ PDF format is required (DOCX files no longer accepted)',
        '✓ Ensure your document has the correct number of pages',
        '✓ Use high-quality images and readable fonts (minimum 10pt)',
        '✓ Keep file size under 50 MB',
        '✓ Include a table of contents and page numbers',
        '✓ Test the PDF on multiple devices before uploading'
    ];

    return (
        <AdminLayout>
            <Box>
                {/* Back Link */}
                <Box
                    onClick={() => navigate('/sacred-guide')}
                    sx={{
                        display: 'inline-flex', alignItems: 'center', gap: 0.5,
                        color: '#8b5cf6', cursor: 'pointer', mb: 2,
                        fontWeight: 600, fontSize: '0.85rem',
                        '&:hover': { color: '#7c3aed' }, transition: 'color 0.2s'
                    }}
                >
                    <ArrowLeft size={16} />
                    Back to Sacred Guide
                </Box>

                {/* Page Title */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                    <Box sx={{
                        width: 42, height: 42, borderRadius: 3,
                        background: 'linear-gradient(135deg, #8b5cf6, #d946ef)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(139,92,246,0.25)'
                    }}>
                        <BookOpen size={20} color="white" />
                    </Box>
                    <Box>
                        <Typography variant="h5" fontWeight="900" sx={{ color: '#1e293b', lineHeight: 1.2 }}>
                            Upload Sacred Guide
                        </Typography>
                        <Typography variant="caption" color="text.secondary" fontWeight="500">
                            Fill in guide details and upload the PDF file
                        </Typography>
                    </Box>
                </Box>

                {/* Alerts */}
                <Collapse in={success}>
                    <Alert severity="success" sx={{ my: 2, borderRadius: 3, fontWeight: 600 }} onClose={() => setSuccess(false)} icon={<CheckCircle2 size={18} />}>
                        Guide published successfully! Redirecting...
                    </Alert>
                </Collapse>
                <Collapse in={!!globalError}>
                    <Alert severity="error" sx={{ my: 2, borderRadius: 3, fontWeight: 600 }} onClose={() => setGlobalError('')} icon={<AlertCircle size={18} />}>
                        {globalError}
                    </Alert>
                </Collapse>

                {/* ─── Guide Details Card ─── */}
                <Paper elevation={0} sx={{
                    p: 3.5, borderRadius: 5, mb: 3, mt: 2,
                    border: '1px solid #edf2f7',
                    background: 'linear-gradient(180deg, #ffffff 0%, #faf5ff 100%)'
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: 'linear-gradient(135deg, #8b5cf6, #d946ef)' }} />
                        <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: '#1e293b' }}>
                            Guide Details
                        </Typography>
                        <Typography variant="caption" sx={{ ml: 'auto', color: '#94a3b8', fontWeight: 600 }}>
                            * Required
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        {/* Title */}
                        <Box>
                            <TextField
                                inputRef={titleRef}
                                label="Title *"
                                value={title}
                                onChange={(e) => handleFieldChange('title', e.target.value)}
                                onBlur={() => handleBlur('title')}
                                placeholder="e.g. Sacred Guide to Spiritual Bonding"
                                fullWidth
                                size="small"
                                error={!!(touched.title && errors.title)}
                                sx={touched.title && errors.title ? errorInputSx : inputSx}
                            />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5, px: 0.5 }}>
                                <Typography variant="caption" sx={{ color: errors.title && touched.title ? '#ef4444' : 'transparent', fontWeight: 600 }}>
                                    {errors.title || ' '}
                                </Typography>
                                <Typography variant="caption" sx={{ color: title.length > MAX_TITLE ? '#ef4444' : '#94a3b8', fontWeight: 600 }}>
                                    {title.length}/{MAX_TITLE}
                                </Typography>
                            </Box>
                        </Box>

                        {/* Description */}
                        <Box>
                            <TextField
                                label="Description"
                                value={description}
                                onChange={(e) => handleFieldChange('description', e.target.value)}
                                onBlur={() => handleBlur('description')}
                                placeholder="Describe what readers will learn, benefits, transformation, etc."
                                fullWidth
                                multiline
                                rows={3}
                                size="small"
                                error={!!(touched.description && errors.description)}
                                sx={touched.description && errors.description ? errorInputSx : inputSx}
                            />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5, px: 0.5 }}>
                                <Typography variant="caption" sx={{ color: errors.description && touched.description ? '#ef4444' : 'transparent', fontWeight: 600 }}>
                                    {errors.description || ' '}
                                </Typography>
                                <Typography variant="caption" sx={{ color: description.length > MAX_DESC ? '#ef4444' : '#94a3b8', fontWeight: 600 }}>
                                    {description.length}/{MAX_DESC}
                                </Typography>
                            </Box>
                        </Box>

                        {/* Price, Total Pages, Chapters, Distribution in a grid */}
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2.5 }}>
                            {/* Price */}
                            <Box>
                                <TextField
                                    label="Price ($) *"
                                    value={price}
                                    onChange={(e) => handleFieldChange('price', e.target.value)}
                                    onBlur={() => handleBlur('price')}
                                    placeholder="e.g. 12.95"
                                    size="small"
                                    error={!!(touched.price && errors.price)}
                                    helperText={!errors.price ? "Enter 0 if this guide is free" : undefined}
                                    sx={{
                                        width: '100%',
                                        ...(touched.price && errors.price ? errorInputSx : inputSx),
                                        '& .MuiFormHelperText-root': { fontWeight: 500, ml: 0.5 }
                                    }}
                                />
                                {touched.price && errors.price && (
                                    <Typography variant="caption" sx={{ color: '#ef4444', fontWeight: 600, display: 'block', mt: 0.5, pl: 0.5 }}>
                                        {errors.price}
                                    </Typography>
                                )}
                            </Box>

                            {/* Total Pages */}
                            <Box>
                                <TextField
                                    label="Total Pages"
                                    value={totalPages}
                                    onChange={(e) => handleFieldChange('totalPages', e.target.value)}
                                    onBlur={() => handleBlur('totalPages')}
                                    placeholder="e.g. 58"
                                    fullWidth
                                    size="small"
                                    error={!!(touched.totalPages && errors.totalPages)}
                                    sx={touched.totalPages && errors.totalPages ? errorInputSx : inputSx}
                                />
                                {touched.totalPages && errors.totalPages && (
                                    <Typography variant="caption" sx={{ color: '#ef4444', fontWeight: 600, display: 'block', mt: 0.5, pl: 0.5 }}>
                                        {errors.totalPages}
                                    </Typography>
                                )}
                            </Box>

                            {/* Total Chapters */}
                            <Box>
                                <TextField
                                    label="Total Chapters"
                                    value={chapters}
                                    onChange={(e) => handleFieldChange('chapters', e.target.value)}
                                    onBlur={() => handleBlur('chapters')}
                                    placeholder="e.g. 12"
                                    fullWidth
                                    size="small"
                                    error={!!(touched.chapters && errors.chapters)}
                                    sx={touched.chapters && errors.chapters ? errorInputSx : inputSx}
                                />
                                {touched.chapters && errors.chapters && (
                                    <Typography variant="caption" sx={{ color: '#ef4444', fontWeight: 600, display: 'block', mt: 0.5, pl: 0.5 }}>
                                        {errors.chapters}
                                    </Typography>
                                )}
                            </Box>

                            {/* Distribution */}
                            <Box>
                                <TextField
                                    label="Distribution"
                                    value={distribution}
                                    onChange={(e) => handleFieldChange('distribution', e.target.value)}
                                    onBlur={() => handleBlur('distribution')}
                                    placeholder="e.g. Exclusive"
                                    fullWidth
                                    size="small"
                                    error={!!(touched.distribution && errors.distribution)}
                                    sx={touched.distribution && errors.distribution ? errorInputSx : inputSx}
                                />
                                {touched.distribution && errors.distribution && (
                                    <Typography variant="caption" sx={{ color: '#ef4444', fontWeight: 600, display: 'block', mt: 0.5, pl: 0.5 }}>
                                        {errors.distribution}
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                    </Box>
                </Paper>

                {/* ─── Upload Zone ─── */}
                <Paper elevation={0} sx={{
                    p: 4, borderRadius: 5, mb: 3,
                    border: '1px solid #edf2f7',
                    background: 'linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%)'
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: 'linear-gradient(135deg, #22c55e, #10b981)' }} />
                        <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: '#1e293b' }}>
                            Upload Guide File
                        </Typography>
                        <Typography variant="caption" sx={{ ml: 'auto', color: '#94a3b8', fontWeight: 600 }}>
                            Max 50 MB
                        </Typography>
                    </Box>

                    {/* Drag & Drop */}
                    <Box
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => !selectedFile && fileInputRef.current?.click()}
                        sx={{
                            border: dragActive ? '2px dashed #8b5cf6' : selectedFile ? '2px solid #22c55e' : '2px dashed #d1d5db',
                            borderRadius: 4, p: selectedFile ? 3 : 5,
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            cursor: selectedFile ? 'default' : 'pointer',
                            bgcolor: dragActive ? 'rgba(139,92,246,0.06)' : selectedFile ? '#f0fdf4' : '#fafbfc',
                            transition: 'all 0.3s ease',
                            '&:hover': !selectedFile ? { borderColor: '#8b5cf6', bgcolor: 'rgba(139,92,246,0.03)', transform: 'translateY(-1px)' } : {},
                            minHeight: selectedFile ? 'auto' : 200,
                        }}
                    >
                        <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileSelect} style={{ display: 'none' }} />

                        {!selectedFile ? (
                            <>
                                <Box sx={{
                                    width: 64, height: 64, borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    mb: 2.5, boxShadow: '0 8px 24px rgba(139,92,246,0.3)',
                                    animation: dragActive ? 'pulse 1s infinite' : 'none'
                                }}>
                                    <Upload size={28} color="white" />
                                </Box>
                                <Typography variant="body1" fontWeight="800" sx={{ mb: 0.5, color: '#1e293b' }}>
                                    {dragActive ? 'Drop your file here!' : 'Drop your document here'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" fontWeight="500" sx={{ mb: 2.5 }}>
                                    or click to browse from your computer
                                </Typography>
                                <Button
                                    variant="contained"
                                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                                    sx={{
                                        background: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)',
                                        '&:hover': { background: 'linear-gradient(135deg, #7c3aed 0%, #c026d3 100%)' },
                                        borderRadius: 3, px: 3.5, py: 1.2, fontWeight: 700,
                                        textTransform: 'none', boxShadow: '0 4px 14px rgba(139,92,246,0.35)',
                                        fontSize: '0.85rem'
                                    }}
                                >
                                    Select Document
                                </Button>
                            </>
                        ) : (
                            /* ── File Preview ── */
                            <Box sx={{ width: '100%' }}>
                                <Box sx={{
                                    display: 'flex', alignItems: 'center', gap: 2, p: 2,
                                    borderRadius: 3, bgcolor: '#ffffff', border: '1px solid #d1fae5'
                                }}>
                                    <Box sx={{
                                        width: 48, height: 48, borderRadius: 3,
                                        background: 'linear-gradient(135deg, #fef2f2, #fee2e2)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                    }}>
                                        <FileIcon size={24} color="#3b82f6" />
                                    </Box>
                                    <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                                        <Typography variant="body2" fontWeight="700" noWrap sx={{ color: '#1e293b' }}>
                                            {selectedFile.name}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                                            {formatFileSize(selectedFile.size)} • Document
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                        <Tooltip title="Replace file" arrow>
                                            <Box onClick={replaceFile} sx={{
                                                cursor: 'pointer', color: '#8b5cf6', p: 1, borderRadius: 2,
                                                '&:hover': { bgcolor: '#f5f3ff' }, display: 'flex', transition: 'all 0.2s'
                                            }}>
                                                <RefreshCw size={16} />
                                            </Box>
                                        </Tooltip>
                                        <Tooltip title="Remove file" arrow>
                                            <Box onClick={removeFile} sx={{
                                                cursor: 'pointer', color: '#94a3b8', p: 1, borderRadius: 2,
                                                '&:hover': { color: '#ef4444', bgcolor: '#fef2f2' }, display: 'flex', transition: 'all 0.2s'
                                            }}>
                                                <X size={16} />
                                            </Box>
                                        </Tooltip>
                                    </Box>
                                </Box>

                                {/* Upload Progress */}
                                {uploading && (
                                    <Box sx={{ mt: 2 }}>
                                        <LinearProgress
                                            variant="determinate"
                                            value={uploadProgress}
                                            sx={{
                                                height: 6, borderRadius: 3, bgcolor: '#f1f5f9',
                                                '& .MuiLinearProgress-bar': {
                                                    borderRadius: 3,
                                                    background: 'linear-gradient(90deg, #8b5cf6 0%, #d946ef 100%)'
                                                }
                                            }}
                                        />
                                        <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ mt: 0.5, display: 'block', textAlign: 'right' }}>
                                            {uploadProgress < 100 ? `Uploading... ${uploadProgress}%` : 'Processing...'}
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        )}
                    </Box>

                    {/* Requirements */}
                    {!selectedFile && (
                        <Box sx={{
                            mt: 2.5, p: 2.5, borderRadius: 3,
                            bgcolor: '#fef3c7', border: '1px solid #fcd34d',
                            display: 'flex', gap: 1.5
                        }}>
                            <AlertCircle size={16} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
                            <Box>
                                <Typography variant="subtitle2" fontWeight="700" sx={{ color: '#b45309', mb: 0.5 }}>
                                    📄 PDF Format Required
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#92400e', fontWeight: 600, lineHeight: 1.8, display: 'block' }}>
                                    Users can now read PDF files directly in-app. Please always upload your guide as a PDF file to enable the free trial reading experience (1-2 free pages, then upgrade popup).
                                </Typography>
                            </Box>
                        </Box>
                    )}
                </Paper>

                {/* ─── Publish Button ─── */}
                <Button
                    fullWidth
                    variant="contained"
                    onClick={handleUpload}
                    disabled={uploading || !isFormValid()}
                    startIcon={uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                    sx={{
                        background: isFormValid() ? 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)' : '#e2e8f0',
                        '&:hover': { background: 'linear-gradient(135deg, #7c3aed 0%, #c026d3 100%)' },
                        '&.Mui-disabled': { background: '#e2e8f0', color: '#94a3b8' },
                        borderRadius: 4, py: 1.6, fontWeight: 800,
                        textTransform: 'none', fontSize: '0.95rem',
                        boxShadow: isFormValid() ? '0 6px 20px rgba(139,92,246,0.35)' : 'none',
                        transition: 'all 0.3s ease',
                        mb: 3
                    }}
                >
                    {uploading ? 'Publishing Guide...' : 'Publish Guide'}
                </Button>

                {/* ─── Guidelines ─── */}
                <Paper elevation={0} sx={{ p: 3.5, borderRadius: 5, border: '1px solid #e2e8f0', mb: 4 }}>
                    <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, mb: 2.5, color: '#1e293b' }}>
                        Upload Guidelines
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {guidelines.map((g, i) => (
                            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <CheckCircle2 size={17} color="#22c55e" style={{ flexShrink: 0 }} />
                                <Typography variant="body2" fontWeight="600" color="text.secondary">
                                    {g}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                </Paper>
            </Box>

            {/* Pulse animation for drag state */}
            <style>{`
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
            `}</style>
        </AdminLayout>
    );
};

export default UploadSacredGuidePage;
