import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Paper, Button, TextField, IconButton, Dialog, DialogTitle,
    DialogContent, DialogActions, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Chip, CircularProgress, Alert, Switch, FormControlLabel,
    Grid, Tooltip, Divider
} from '@mui/material';
import {
    ArrowLeft, Plus, Edit2, Trash2, BookOpen, Video, Image, HelpCircle,
    CheckCircle, Volume2, FileText, Upload, X
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import apiService from '../services/apiService';

const CONTENT_TYPES = [
    { key: 'books', label: 'Book Content', icon: BookOpen, color: '#6366f1', desc: 'PDFs, chapters, reading material' },
    { key: 'videos', label: 'Videos', icon: Video, color: '#ec4899', desc: 'Lesson videos & tutorials' },
    { key: 'visuals', label: 'Visuals', icon: Image, color: '#14b8a6', desc: 'Infographics & images' },
    { key: 'quizzes', label: 'Quizzes', icon: HelpCircle, color: '#f59e0b', desc: 'Interactive knowledge checks' },
    { key: 'tests', label: 'MCQ Tests', icon: CheckCircle, color: '#ef4444', desc: 'Multiple-choice assessments' },
    { key: 'audios', label: 'Audio Lessons', icon: Volume2, color: '#8b5cf6', desc: 'Guided audio content' },
    { key: 'resources', label: 'Resources', icon: FileText, color: '#64748b', desc: 'Downloads & external links' },
];

const emptyForm = () => ({
    title: '', description: '', fileUrl: '', videoUrl: '', thumbnailUrl: '',
    imageUrl: '', audioUrl: '', externalUrl: '', durationSeconds: '',
    displayOrder: 0, isPublished: false
});

const emptyAssessment = () => ({
    title: '', description: '', passingScorePercent: 70,
    displayOrder: 0, isPublished: false,
    questions: [{ questionText: '', displayOrder: 0, options: [
        { optionText: '', isCorrect: true },
        { optionText: '', isCorrect: false },
        { optionText: '', isCorrect: false },
        { optionText: '', isCorrect: false },
    ]}]
});

const norm = (item) => ({
    id: item.id || item.Id,
    title: item.title || item.Title || '',
    description: item.description || item.Description || '',
    fileUrl: item.fileUrl || item.FileUrl || '',
    videoUrl: item.videoUrl || item.VideoUrl || '',
    thumbnailUrl: item.thumbnailUrl || item.ThumbnailUrl || '',
    imageUrl: item.imageUrl || item.ImageUrl || '',
    audioUrl: item.audioUrl || item.AudioUrl || '',
    externalUrl: item.externalUrl || item.ExternalUrl || '',
    durationSeconds: item.durationSeconds ?? item.DurationSeconds ?? '',
    displayOrder: item.displayOrder ?? item.DisplayOrder ?? 0,
    isPublished: item.isPublished ?? item.IsPublished ?? false,
    passingScorePercent: item.passingScorePercent ?? item.PassingScorePercent ?? 70,
    questions: (item.questions || item.Questions || []).map(q => ({
        id: q.id || q.Id,
        questionText: q.questionText || q.QuestionText || '',
        displayOrder: q.displayOrder ?? q.DisplayOrder ?? 0,
        options: (q.options || q.Options || []).map(o => ({
            id: o.id || o.Id,
            optionText: o.optionText || o.OptionText || '',
            isCorrect: o.isCorrect ?? o.IsCorrect ?? false,
        }))
    }))
});

const isAssessment = (type) => type === 'quizzes' || type === 'tests';

const CourseContentAdminPage = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();

    const [course, setCourse] = useState(null);
    const [activeType, setActiveType] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [itemsLoading, setItemsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptyForm());
    const [assessmentForm, setAssessmentForm] = useState(emptyAssessment());
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    const loadCourse = useCallback(async () => {
        try {
            setLoading(true);
            const res = await apiService.getAdminCourse(courseId);
            const data = res?.data || res;
            setCourse({
                id: data.id || data.Id,
                title: data.title || data.Title || 'Course',
                description: data.description || data.Description || '',
                status: data.status || data.Status || '',
                contentSummary: data.contentSummary || data.ContentSummary || {}
            });
        } catch (err) {
            setError('Failed to load course.');
        } finally {
            setLoading(false);
        }
    }, [courseId]);

    const loadItems = useCallback(async (type) => {
        if (!type) return;
        try {
            setItemsLoading(true);
            setError(null);
            const res = await apiService.getCourseContent(courseId, type);
            const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
            setItems(list.map(norm));
        } catch (err) {
            setError(`Failed to load ${type}.`);
            setItems([]);
        } finally {
            setItemsLoading(false);
        }
    }, [courseId]);

    useEffect(() => { loadCourse(); }, [loadCourse]);
    useEffect(() => { if (activeType) loadItems(activeType); }, [activeType, loadItems]);

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm());
        setAssessmentForm(emptyAssessment());
        setDialogOpen(true);
    };

    const openEdit = (item) => {
        setEditing(item);
        if (isAssessment(activeType)) {
            setAssessmentForm({
                title: item.title,
                description: item.description || '',
                passingScorePercent: item.passingScorePercent || 70,
                displayOrder: item.displayOrder,
                isPublished: item.isPublished,
                questions: item.questions?.length ? item.questions : emptyAssessment().questions
            });
        } else {
            setForm({
                title: item.title,
                description: item.description || '',
                fileUrl: item.fileUrl || '',
                videoUrl: item.videoUrl || '',
                thumbnailUrl: item.thumbnailUrl || '',
                imageUrl: item.imageUrl || '',
                audioUrl: item.audioUrl || '',
                externalUrl: item.externalUrl || '',
                durationSeconds: item.durationSeconds || '',
                displayOrder: item.displayOrder,
                isPublished: item.isPublished
            });
        }
        setDialogOpen(true);
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            if (isAssessment(activeType)) {
                const payload = {
                    title: assessmentForm.title,
                    description: assessmentForm.description,
                    passingScorePercent: Number(assessmentForm.passingScorePercent) || 70,
                    displayOrder: Number(assessmentForm.displayOrder) || 0,
                    isPublished: assessmentForm.isPublished,
                    questions: assessmentForm.questions.filter(q => q.questionText.trim())
                };
                if (editing) {
                    await apiService.updateCourseContent(courseId, activeType, editing.id, payload);
                } else {
                    await apiService.createCourseContent(courseId, activeType, payload);
                }
            } else {
                const payload = {
                    ...form,
                    durationSeconds: form.durationSeconds ? Number(form.durationSeconds) : null,
                    displayOrder: Number(form.displayOrder) || 0
                };
                if (editing) {
                    await apiService.updateCourseContent(courseId, activeType, editing.id, payload);
                } else {
                    await apiService.createCourseContent(courseId, activeType, payload);
                }
            }
            setDialogOpen(false);
            loadItems(activeType);
            loadCourse();
        } catch (err) {
            setError(err.message || 'Save failed.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!editing) return;
        try {
            setSaving(true);
            await apiService.deleteCourseContent(courseId, activeType, editing.id);
            setDeleteOpen(false);
            setEditing(null);
            loadItems(activeType);
            loadCourse();
        } catch (err) {
            setError('Delete failed.');
        } finally {
            setSaving(false);
        }
    };

    const handleFileUpload = async (e, field) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            setUploading(true);
            const folder = activeType || 'general';
            const res = await apiService.uploadCourseFile(courseId, file, folder);
            const url = res?.data?.url || res?.url;
            if (url) {
                if (isAssessment(activeType)) return;
                setForm(prev => ({ ...prev, [field]: url }));
            }
        } catch (err) {
            setError('File upload failed.');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const getCount = (key) => {
        const s = course?.contentSummary || {};
        const map = {
            books: s.bookCount ?? s.BookCount ?? 0,
            videos: s.videoCount ?? s.VideoCount ?? 0,
            visuals: s.visualCount ?? s.VisualCount ?? 0,
            quizzes: s.quizCount ?? s.QuizCount ?? 0,
            tests: s.testCount ?? s.TestCount ?? 0,
            audios: s.audioCount ?? s.AudioCount ?? 0,
            resources: s.resourceCount ?? s.ResourceCount ?? 0,
        };
        return map[key] ?? 0;
    };

    const renderUrlField = (label, field, accept) => (
        <Box key={field}>
            <TextField fullWidth size="small" label={label} value={form[field]} onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))} sx={{ mb: 1 }} />
            <Button component="label" size="small" variant="outlined" startIcon={<Upload size={14} />} disabled={uploading}>
                Upload file
                <input type="file" hidden accept={accept} onChange={e => handleFileUpload(e, field)} />
            </Button>
        </Box>
    );

    const renderContentForm = () => {
        switch (activeType) {
            case 'books':
                return renderUrlField('Book File URL (PDF/DOCX)', 'fileUrl', '.pdf,.doc,.docx');
            case 'videos':
                return (<>
                    {renderUrlField('Video URL', 'videoUrl', 'video/*')}
                    {renderUrlField('Thumbnail URL', 'thumbnailUrl', 'image/*')}
                    <TextField fullWidth size="small" label="Duration (seconds)" type="number" value={form.durationSeconds} onChange={e => setForm(p => ({ ...p, durationSeconds: e.target.value }))} />
                </>);
            case 'visuals':
                return renderUrlField('Image URL', 'imageUrl', 'image/*');
            case 'audios':
                return (<>
                    {renderUrlField('Audio URL', 'audioUrl', 'audio/*')}
                    <TextField fullWidth size="small" label="Duration (seconds)" type="number" value={form.durationSeconds} onChange={e => setForm(p => ({ ...p, durationSeconds: e.target.value }))} />
                </>);
            case 'resources':
                return (<>
                    {renderUrlField('Download File URL', 'fileUrl', '.pdf,.doc,.docx,.zip')}
                    <TextField fullWidth size="small" label="External Link (optional)" value={form.externalUrl} onChange={e => setForm(p => ({ ...p, externalUrl: e.target.value }))} sx={{ mt: 1 }} />
                </>);
            default:
                return null;
        }
    };

    const updateQuestion = (qi, field, val) => {
        setAssessmentForm(prev => {
            const questions = [...prev.questions];
            questions[qi] = { ...questions[qi], [field]: val };
            return { ...prev, questions };
        });
    };

    const updateOption = (qi, oi, field, val) => {
        setAssessmentForm(prev => {
            const questions = [...prev.questions];
            const options = [...questions[qi].options];
            options[oi] = { ...options[oi], [field]: val };
            questions[qi] = { ...questions[qi], options };
            return { ...prev, questions };
        });
    };

    const addQuestion = () => {
        setAssessmentForm(prev => ({
            ...prev,
            questions: [...prev.questions, { questionText: '', displayOrder: prev.questions.length, options: [
                { optionText: '', isCorrect: true }, { optionText: '', isCorrect: false }
            ]}]
        }));
    };

    const addOption = (qi) => {
        setAssessmentForm(prev => {
            const questions = [...prev.questions];
            questions[qi] = { ...questions[qi], options: [...questions[qi].options, { optionText: '', isCorrect: false }] };
            return { ...prev, questions };
        });
    };

    const activeMeta = CONTENT_TYPES.find(t => t.key === activeType);

    if (loading) {
        return (
            <AdminLayout>
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress sx={{ color: '#8b5cf6' }} /></Box>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: 'auto' }}>
                <Button startIcon={<ArrowLeft size={16} />} onClick={() => navigate('/courses')} sx={{ mb: 2, color: '#64748b' }}>
                    Back to Courses
                </Button>

                <Typography variant="h5" fontWeight={700}>{course?.title}</Typography>
                <Typography variant="body2" color="text.secondary" mb={3}>{course?.description}</Typography>

                {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

                {/* Content type cards */}
                <Grid container spacing={2} mb={3}>
                    {CONTENT_TYPES.map(({ key, label, icon: Icon, color, desc }) => (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={key}>
                            <Paper
                                elevation={0}
                                onClick={() => setActiveType(key)}
                                sx={{
                                    p: 2, cursor: 'pointer', border: '2px solid',
                                    borderColor: activeType === key ? color : '#e2e8f0',
                                    borderRadius: 2, bgcolor: activeType === key ? `${color}08` : 'white',
                                    transition: 'all 0.15s', '&:hover': { borderColor: color, boxShadow: 1 }
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                                    <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: `${color}18`, color }}>
                                        <Icon size={20} />
                                    </Box>
                                    <Box flex={1}>
                                        <Typography fontWeight={700} fontSize={14}>{label}</Typography>
                                        <Chip label={`${getCount(key)} items`} size="small" sx={{ height: 20, fontSize: 11, mt: 0.5 }} />
                                    </Box>
                                </Box>
                                <Typography variant="caption" color="text.secondary">{desc}</Typography>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>

                {/* CRUD panel */}
                {activeType && (
                    <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
                        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {activeMeta && <activeMeta.icon size={18} color={activeMeta.color} />}
                                <Typography fontWeight={700}>{activeMeta?.label} — Manage</Typography>
                            </Box>
                            <Button variant="contained" size="small" startIcon={<Plus size={16} />} onClick={openCreate}
                                sx={{ bgcolor: '#8b5cf6', '&:hover': { bgcolor: '#7c3aed' } }}>
                                Add New
                            </Button>
                        </Box>

                        {itemsLoading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={32} sx={{ color: '#8b5cf6' }} /></Box>
                        ) : items.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 6 }}>
                                <Typography color="text.secondary">No {activeMeta?.label?.toLowerCase()} yet. Click "Add New" to create one.</Typography>
                            </Box>
                        ) : (
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 700 }}>Order</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Title</TableCell>
                                            {isAssessment(activeType) && <TableCell sx={{ fontWeight: 700 }}>Questions</TableCell>}
                                            <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {items.map(item => (
                                            <TableRow key={item.id} hover>
                                                <TableCell>{item.displayOrder}</TableCell>
                                                <TableCell>
                                                    <Typography fontSize={13} fontWeight={600}>{item.title}</Typography>
                                                    {item.description && <Typography variant="caption" color="text.secondary">{item.description}</Typography>}
                                                </TableCell>
                                                {isAssessment(activeType) && <TableCell>{item.questions?.length || 0}</TableCell>}
                                                <TableCell>
                                                    <Chip label={item.isPublished ? 'Published' : 'Draft'} size="small"
                                                        color={item.isPublished ? 'success' : 'default'} variant="outlined" />
                                                </TableCell>
                                                <TableCell align="right">
                                                    <IconButton size="small" onClick={() => openEdit(item)}><Edit2 size={15} /></IconButton>
                                                    <IconButton size="small" color="error" onClick={() => { setEditing(item); setDeleteOpen(true); }}><Trash2 size={15} /></IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </Paper>
                )}

                {!activeType && (
                    <Paper elevation={0} sx={{ p: 4, textAlign: 'center', border: '1px dashed #cbd5e1', borderRadius: 2 }}>
                        <Typography color="text.secondary">Select a content type above to start managing course content.</Typography>
                    </Paper>
                )}
            </Box>

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>{editing ? 'Edit' : 'Add'} {activeMeta?.label}</DialogTitle>
                <DialogContent dividers>
                    {isAssessment(activeType) ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                            <TextField fullWidth label="Title *" value={assessmentForm.title} onChange={e => setAssessmentForm(p => ({ ...p, title: e.target.value }))} />
                            <TextField fullWidth label="Description" multiline rows={2} value={assessmentForm.description} onChange={e => setAssessmentForm(p => ({ ...p, description: e.target.value }))} />
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <TextField label="Passing Score %" type="number" value={assessmentForm.passingScorePercent} onChange={e => setAssessmentForm(p => ({ ...p, passingScorePercent: e.target.value }))} sx={{ width: 160 }} />
                                <TextField label="Display Order" type="number" value={assessmentForm.displayOrder} onChange={e => setAssessmentForm(p => ({ ...p, displayOrder: e.target.value }))} sx={{ width: 140 }} />
                                <FormControlLabel control={<Switch checked={assessmentForm.isPublished} onChange={e => setAssessmentForm(p => ({ ...p, isPublished: e.target.checked }))} />} label="Published" />
                            </Box>
                            <Divider />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography fontWeight={700}>Questions</Typography>
                                <Button size="small" startIcon={<Plus size={14} />} onClick={addQuestion}>Add Question</Button>
                            </Box>
                            {assessmentForm.questions.map((q, qi) => (
                                <Paper key={qi} variant="outlined" sx={{ p: 2 }}>
                                    <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                                        <TextField fullWidth size="small" label={`Question ${qi + 1}`} value={q.questionText} onChange={e => updateQuestion(qi, 'questionText', e.target.value)} />
                                        <IconButton size="small" onClick={() => setAssessmentForm(p => ({ ...p, questions: p.questions.filter((_, i) => i !== qi) }))}><X size={16} /></IconButton>
                                    </Box>
                                    {q.options.map((o, oi) => (
                                        <Box key={oi} sx={{ display: 'flex', gap: 1, mb: 0.5, alignItems: 'center' }}>
                                            <TextField fullWidth size="small" placeholder={`Option ${oi + 1}`} value={o.optionText} onChange={e => updateOption(qi, oi, 'optionText', e.target.value)} />
                                            <FormControlLabel
                                                control={<Switch size="small" checked={o.isCorrect} onChange={e => updateOption(qi, oi, 'isCorrect', e.target.checked)} />}
                                                label="Correct" sx={{ mr: 0, minWidth: 90 }}
                                            />
                                        </Box>
                                    ))}
                                    <Button size="small" onClick={() => addOption(qi)}>+ Add Option</Button>
                                </Paper>
                            ))}
                        </Box>
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                            <TextField fullWidth label="Title *" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
                            <TextField fullWidth label="Description" multiline rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                            {renderContentForm()}
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                <TextField label="Display Order" type="number" value={form.displayOrder} onChange={e => setForm(p => ({ ...p, displayOrder: e.target.value }))} sx={{ width: 140 }} />
                                <FormControlLabel control={<Switch checked={form.isPublished} onChange={e => setForm(p => ({ ...p, isPublished: e.target.checked }))} />} label="Published" />
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleSave} disabled={saving || uploading}
                        sx={{ bgcolor: '#8b5cf6', '&:hover': { bgcolor: '#7c3aed' } }}>
                        {saving ? 'Saving...' : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete confirm */}
            <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
                <DialogTitle>Delete item?</DialogTitle>
                <DialogContent><Typography>This action cannot be undone.</Typography></DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
                    <Button color="error" variant="contained" onClick={handleDelete} disabled={saving}>Delete</Button>
                </DialogActions>
            </Dialog>
        </AdminLayout>
    );
};

export default CourseContentAdminPage;
