import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Chip, CircularProgress, Alert, IconButton, Tooltip
} from '@mui/material';
import { BookOpen, ChevronRight, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import apiService from '../services/apiService';

const normalizeCourse = (c) => ({
    id: c.id || c.Id,
    title: c.title || c.Title || '',
    description: c.description || c.Description || '',
    price: c.price ?? c.Price ?? 0,
    isFreeWithPlus: c.isFreeWithPlus ?? c.IsFreeWithPlus ?? false,
    displayOrder: c.displayOrder ?? c.DisplayOrder ?? 0,
    status: c.status || c.Status || 'ComingSoon',
    contentSummary: {
        bookCount: c.contentSummary?.bookCount ?? c.ContentSummary?.BookCount ?? 0,
        videoCount: c.contentSummary?.videoCount ?? c.ContentSummary?.VideoCount ?? 0,
        visualCount: c.contentSummary?.visualCount ?? c.ContentSummary?.VisualCount ?? 0,
        quizCount: c.contentSummary?.quizCount ?? c.ContentSummary?.QuizCount ?? 0,
        testCount: c.contentSummary?.testCount ?? c.ContentSummary?.TestCount ?? 0,
        audioCount: c.contentSummary?.audioCount ?? c.ContentSummary?.AudioCount ?? 0,
        resourceCount: c.contentSummary?.resourceCount ?? c.ContentSummary?.ResourceCount ?? 0,
    }
});

const totalContent = (s) =>
    s.bookCount + s.videoCount + s.visualCount + s.quizCount + s.testCount + s.audioCount + s.resourceCount;

const CoursesAdminPage = () => {
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadCourses = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await apiService.getAdminCourses();
            const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
            setCourses(list.map(normalizeCourse));
        } catch (err) {
            console.error(err);
            setError('Failed to load courses. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadCourses(); }, []);

    const statusColor = (status) => {
        if (status === 'Live') return 'success';
        if (status === 'ComingSoon') return 'warning';
        return 'default';
    };

    return (
        <AdminLayout>
            <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: 'auto' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Box>
                        <Typography variant="h5" fontWeight={700} color="#1e293b">
                            Course Management
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mt={0.5}>
                            Select a course to upload and manage book content, videos, visuals, quizzes, and tests.
                        </Typography>
                    </Box>
                    <Tooltip title="Refresh">
                        <IconButton onClick={loadCourses} disabled={loading}>
                            <RefreshCw size={18} />
                        </IconButton>
                    </Tooltip>
                </Box>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                            <CircularProgress size={36} sx={{ color: '#8b5cf6' }} />
                        </Box>
                    ) : courses.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 8 }}>
                            <BookOpen size={40} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
                            <Typography color="text.secondary">No courses found.</Typography>
                        </Box>
                    ) : (
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                        <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Course Title</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Price</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Content Items</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }} align="right">Action</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {courses.map((course, idx) => (
                                        <TableRow
                                            key={course.id}
                                            hover
                                            sx={{ cursor: 'pointer' }}
                                            onClick={() => navigate(`/courses/${course.id}`)}
                                        >
                                            <TableCell>{course.displayOrder || idx + 1}</TableCell>
                                            <TableCell>
                                                <Typography fontWeight={600} fontSize={14}>{course.title}</Typography>
                                                <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 360, display: 'block' }}>
                                                    {course.description}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip label={course.status} size="small" color={statusColor(course.status)} variant="outlined" />
                                            </TableCell>
                                            <TableCell>
                                                {course.isFreeWithPlus ? 'Free w/ Plus' : `$${Number(course.price).toFixed(2)}`}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={`${totalContent(course.contentSummary)} items`}
                                                    size="small"
                                                    sx={{ bgcolor: '#f3e8ff', color: '#7c3aed', fontWeight: 600 }}
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/courses/${course.id}`); }}>
                                                    <ChevronRight size={18} />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Paper>
            </Box>
        </AdminLayout>
    );
};

export default CoursesAdminPage;
