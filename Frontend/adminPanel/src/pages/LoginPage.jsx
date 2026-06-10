import React, { useState } from 'react';
import {
    Box,
    Button,
    Container,
    CssBaseline,
    TextField,
    Typography,
    Paper,
    InputAdornment,
    IconButton,
    Alert,
    CircularProgress,
    ThemeProvider,
    createTheme,
    Link
} from '@mui/material';
import {
    User,
    Lock,
    Eye,
    EyeOff,
    Shield,
    ChevronRight,
    ArrowLeft
} from 'lucide-react';
import { motion } from 'framer-motion';
import apiService from '../services/apiService';
import { useNavigate } from 'react-router-dom';

// Custom Theme matching the screenshot aesthetics
const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#d946ef', // Fuchsia 500
        },
        secondary: {
            main: '#8b5cf6', // Violet 500
        },
        background: {
            default: '#f3f4f6', // Gray 100
            paper: '#ffffff',
        },
    },
    typography: {
        fontFamily: '"Inter", "Outfit", "Roboto", sans-serif',
    },
    shape: {
        borderRadius: 20,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    textTransform: 'none',
                    fontWeight: 600,
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 12,
                        backgroundColor: '#f9fafb',
                    },
                },
            },
        },
    },
});

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await apiService.login({ email, password });
            console.log('Login successful:', response);
            navigate('/dashboard');
        } catch (err) {
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: '#f3f4f6',
                    px: 2,
                    py: 4
                }}
            >
                {/* Logo and Header Section */}
                <Box sx={{ mb: 4, textAlign: 'center' }}>
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Box
                            sx={{
                                width: 80,
                                height: 80,
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto',
                                mb: 2,
                                boxShadow: '0 8px 16px rgba(139, 92, 246, 0.3)',
                                color: 'white'
                            }}
                        >
                            <Shield size={40} />
                        </Box>
                    </motion.div>

                    <Typography
                        variant="h3"
                        fontWeight="800"
                        sx={{
                            background: 'linear-gradient(90deg, #8b5cf6 0%, #d946ef 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            letterSpacing: '-0.02em',
                            mb: 0.5
                        }}
                    >
                        HoundHeart™ Admin
                    </Typography>
                    <Typography variant="body1" color="text.secondary" fontWeight="500">
                        Secure access to platform management
                    </Typography>
                </Box>

                <Container maxWidth="xs">
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <Paper
                            elevation={0}
                            sx={{
                                p: 4,
                                border: '1px solid #e5e7eb',
                                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)',
                                textAlign: 'center'
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3, gap: 1 }}>
                                <Shield size={20} color="#d946ef" />
                                <Typography variant="h6" fontWeight="700" color="#374151">
                                    Administrator Login
                                </Typography>
                            </Box>

                            {error && (
                                <Alert severity="error" sx={{ mb: 3, borderRadius: 2, textAlign: 'left' }}>
                                    {error}
                                </Alert>
                            )}

                            <Box component="form" onSubmit={handleLogin} sx={{ mt: 1 }}>
                                <Box sx={{ mb: 3, textAlign: 'left' }}>
                                    <Typography variant="body2" fontWeight="700" color="#374151" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <User size={16} color="#d946ef" /> Username
                                    </Typography>
                                    <TextField
                                        required
                                        fullWidth
                                        id="email"
                                        placeholder="Enter admin username"
                                        name="email"
                                        autoComplete="email"
                                        autoFocus
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        variant="outlined"
                                        size="medium"
                                    />
                                </Box>

                                <Box sx={{ mb: 4, textAlign: 'left' }}>
                                    <Typography variant="body2" fontWeight="700" color="#374151" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Lock size={16} color="#d946ef" /> Password
                                    </Typography>
                                    <TextField
                                        required
                                        fullWidth
                                        name="password"
                                        placeholder="Enter admin password"
                                        type={showPassword ? 'text' : 'password'}
                                        id="password"
                                        autoComplete="current-password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        edge="end"
                                                        size="small"
                                                    >
                                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Box>

                                <Button
                                    type="submit"
                                    fullWidth
                                    variant="contained"
                                    disabled={loading}
                                    sx={{
                                        py: 1.8,
                                        fontSize: '1rem',
                                        background: 'linear-gradient(90deg, #8b5cf6 0%, #ec4899 100%)',
                                        boxShadow: '0 4px 15px rgba(217, 70, 239, 0.4)',
                                        '&:hover': {
                                            background: 'linear-gradient(90deg, #7c3aed 0%, #db2777 100%)',
                                            transform: 'translateY(-1px)',
                                            boxShadow: '0 6px 20px rgba(217, 70, 239, 0.5)',
                                        },
                                        transition: 'all 0.2s',
                                        mb: 3
                                    }}
                                >
                                    {loading ? (
                                        <CircularProgress size={24} color="inherit" />
                                    ) : (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Shield size={20} /> Access Admin Panel
                                        </Box>
                                    )}
                                </Button>

                                <Button
                                    fullWidth
                                    variant="outlined"
                                    onClick={() => navigate('/')}
                                    sx={{
                                        py: 1.5,
                                        borderColor: '#e5e7eb',
                                        color: '#6366f1',
                                        '&:hover': {
                                            borderColor: '#8b5cf6',
                                            bgcolor: 'rgba(139, 92, 246, 0.04)'
                                        }
                                    }}
                                >
                                    Back to HoundHeart™
                                </Button>
                            </Box>
                        </Paper>

                        <Box sx={{ mt: 4, textAlign: 'center' }}>
                            <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 300, display: 'block', margin: '0 auto', lineHeight: 1.6 }}>
                                This admin panel is protected by advanced security measures. All actions are logged and monitored.
                            </Typography>
                        </Box>
                    </motion.div>
                </Container>
            </Box>
        </ThemeProvider>
    );
};

export default LoginPage;
