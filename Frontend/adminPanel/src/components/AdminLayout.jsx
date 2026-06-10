import React, { useState } from 'react';
import {
    Box,
    Drawer,
    Toolbar,
    List,
    Typography,
    Divider,
    IconButton,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Avatar,
    useTheme,
    useMediaQuery
} from '@mui/material';
import {
    LayoutDashboard,
    Users,
    PawPrint,
    FileText,
    BarChart3,
    MessageSquare,
    Settings,
    BookOpen,
    TrendingUp,
    CreditCard,
    Menu as MenuIcon,
    HelpCircle,
    Watch
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiService from '../services/apiService';
import Logo from '../assets/Logo.png';

const drawerWidth = 260;

const AdminLayout = ({ children }) => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleLogout = () => {
        apiService.logout();
        navigate('/login');
    };

    const menuItems = [
        { text: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/dashboard' },
        { text: 'Users', icon: <Users size={18} />, path: '/users' },
        { text: 'Pre-Registrations', icon: <Users size={18} />, path: '/pre-registrations' },
        { text: 'Content', icon: <FileText size={18} />, path: '/content' },
        { text: 'Healing Circles', icon: <PawPrint size={18} />, path: '/healing-circles' },
        { text: 'Reports', icon: <BarChart3 size={18} />, path: '/reports' },
        { divider: true },
        { text: 'Expert Queries', icon: <MessageSquare size={18} />, path: '/queries' },
        { text: 'Sacred Guide', icon: <BookOpen size={18} />, path: '/sacred-guide' },
        { text: 'FAQ Management', icon: <HelpCircle size={18} />, path: '/faq' },
        { text: 'Subscriptions', icon: <CreditCard size={18} />, path: '/subscriptions' },
        { text: 'Membership Plans', icon: <Watch size={18} />, path: '/membership-plans' },
        { text: 'Analytics', icon: <TrendingUp size={18} />, path: '/analytics' },
        { text: 'Settings', icon: <Settings size={18} />, path: '/settings' },
        { divider: true },
        { text: '🚀 Travel Club', icon: <LayoutDashboard size={18} />, path: '/travel-club', comingSoon: true },
        { text: '🚀 Wearable Marketplace', icon: <Watch size={18} />, path: '/wearable-marketplace', comingSoon: true },
        { text: '🚀 Books Management', icon: <BookOpen size={18} />, path: '/books', comingSoon: true },
        { text: '🚀 Store', icon: <FileText size={18} />, path: '/store', comingSoon: true },
        { text: '🚀 Charity Partnerships', icon: <BarChart3 size={18} />, path: '/charity', comingSoon: true },
    ];

    const drawer = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'white' }}>
            <Toolbar sx={{ px: 3, py: 3.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <img src={Logo} alt="HoundHeart Logo" style={{ maxHeight: 36 }} />
            </Toolbar>

            <List sx={{ px: 1.5, mt: 1, flexGrow: 1 }}>
                {menuItems.map((item, index) => {
                    if (item.divider) {
                        return <Divider key={`divider-${index}`} sx={{ my: 1.5, mx: 1.5, opacity: 0.5 }} />;
                    }
                    const active = location.pathname === item.path ||
                        (item.path === '/sacred-guide' && location.pathname.startsWith('/sacred-guide'));
                    return (
                        <ListItem key={item.text} disablePadding sx={{ mb: 0.3 }} title={item.comingSoon ? 'Coming Soon - Phase 2 Feature' : ''}>
                            <ListItemButton
                                onClick={() => {
                                    navigate(item.path);
                                    if (isMobile) setMobileOpen(false);
                                }}
                                sx={{
                                    borderRadius: 2,
                                    py: 1,
                                    mx: 0,
                                    background: active ? 'linear-gradient(90deg, #db2777 0%, #f472b6 100%)' : 'transparent',
                                    color: item.comingSoon ? '#fbbf24' : (active ? 'white' : '#64748b'),
                                    opacity: item.comingSoon ? 0.7 : 1,
                                    '&:hover': {
                                        background: active ? 'linear-gradient(90deg, #db2777 0%, #f472b6 100%)' : item.comingSoon ? '#fef3c7' : '#fff1f2',
                                        color: active ? 'white' : (item.comingSoon ? '#f59e0b' : '#db2777'),
                                        opacity: 1
                                    },
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText
                                    primary={
                                        <Typography sx={{ fontWeight: active ? 700 : 500, fontSize: '0.82rem' }}>
                                            {item.text}
                                        </Typography>
                                    }
                                />
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>

            <Divider sx={{ mx: 2, opacity: 0.4 }} />

            <List sx={{ px: 2, pb: 3, pt: 1.5 }}>
                <Box sx={{
                    p: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    borderRadius: 3,
                    bgcolor: '#f8fafc',
                }}>
                    <Avatar
                        sx={{
                            width: 34,
                            height: 34,
                            bgcolor: '#3b82f6',
                            fontWeight: 700,
                            fontSize: '0.75rem'
                        }}
                    >
                        A
                    </Avatar>
                    <Box sx={{ overflow: 'hidden' }}>
                        <Typography variant="body2" fontWeight="700" fontSize="0.8rem" noWrap>Admin User</Typography>
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', fontSize: '0.68rem' }}>admin@houndheart.com</Typography>
                    </Box>
                </Box>
            </List>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', bgcolor: '#f8fafc', minHeight: '100vh', width: '100%' }}>
            {/* Mobile hamburger — only on small screens */}
            {isMobile && (
                <Box sx={{ position: 'fixed', top: 12, left: 12, zIndex: 1300 }}>
                    <IconButton onClick={handleDrawerToggle} sx={{ bgcolor: 'white', boxShadow: 1 }}>
                        <MenuIcon size={20} />
                    </IconButton>
                </Box>
            )}

            <Box
                component="nav"
                sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
            >
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        display: { xs: 'block', sm: 'none' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, border: 'none', boxShadow: '10px 0 15px -3px rgba(0,0,0,0.05)' },
                    }}
                >
                    {drawer}
                </Drawer>
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', sm: 'block' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, border: 'none', borderRight: '1px solid #edf2f7' },
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: { xs: 2, sm: 4 },
                    width: { xs: '100%', sm: `calc(100% - ${drawerWidth}px)` },
                    minHeight: '100vh',
                    overflowX: 'hidden'
                }}
            >
                <Box sx={{ maxWidth: '100%', width: '100%' }}>
                    {children}
                </Box>
            </Box>
        </Box>
    );
};

export default AdminLayout;
