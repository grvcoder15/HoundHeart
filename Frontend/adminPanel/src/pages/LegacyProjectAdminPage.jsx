import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  IconButton,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Paper,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack
} from '@mui/material';
import { Trash2, Upload, Plus, Edit } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import apiService from '../services/apiService';
import UserSubmissionsManager from './TreeDedicationsAdminPage';

const SECTIONS = [
  { key: 'forest', label: 'Memorial Forest' },
  { key: 'senior', label: 'Senior Dog Project' },
  { key: 'research', label: 'Research Initiative' },
];

export default function LegacyProjectAdminPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);

  // Content
  const [description, setDescription] = useState('');
  const [stats, setStats] = useState({
    beds: 0,
    dogs: 0,
    medical: 0,
    adopted: 0
  });

  // Updates
  const [updates, setUpdates] = useState([]);
  const [newUpdate, setNewUpdate] = useState('');

  // Photos
  const [photos, setPhotos] = useState([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const currentSectionKey = SECTIONS[activeTab].key;

  useEffect(() => {
    fetchSectionData();
  }, [activeTab]);

  const fetchSectionData = async () => {
    setLoading(true);
    try {
      const [contentRes, updatesRes, photosRes] = await Promise.all([
        apiService.getLegacyContent(currentSectionKey),
        apiService.getLegacyUpdates(currentSectionKey),
        apiService.getLegacyPhotos(currentSectionKey)
      ]);

      if (contentRes.success) {
        setDescription(contentRes.data?.description || '');
        if (currentSectionKey === 'senior' && contentRes.data?.impactStatsJson) {
          try {
            const parsed = JSON.parse(contentRes.data.impactStatsJson);
            setStats(parsed || { beds: 0, dogs: 0, medical: 0, adopted: 0 });
          } catch (e) { }
        }
      }
      if (updatesRes.success) setUpdates(updatesRes.data || []);
      if (photosRes.success) setPhotos(photosRes.data || []);
    } catch (error) {
      console.error("Error fetching legacy data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveContent = async () => {
    try {
      const data = {
        sectionKey: currentSectionKey,
        description,
        impactStatsJson: currentSectionKey === 'senior' ? JSON.stringify(stats) : '{}'
      };
      await apiService.updateLegacyContent(data);
      alert('Content saved successfully');
    } catch (error) {
      alert('Failed to save content');
    }
  };

  const handleAddUpdate = async () => {
    if (!newUpdate.trim()) return;
    try {
      await apiService.createLegacyUpdate({
        sectionKey: currentSectionKey,
        content: newUpdate
      });
      setNewUpdate('');
      fetchSectionData();
    } catch (error) {
      alert('Failed to add update');
    }
  };

  const handleDeleteUpdate = async (id) => {
    if (window.confirm('Delete this update?')) {
      try {
        await apiService.deleteLegacyUpdate(id);
        fetchSectionData();
      } catch (error) {
        alert('Failed to delete update');
      }
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result;
        
        await apiService.addLegacyPhoto({
          sectionKey: currentSectionKey,
          photoUrl: base64String,
          displayOrder: 0
        });
        fetchSectionData();
      };
      reader.readAsDataURL(file);

    } catch (error) {
      console.error(error);
      alert('Upload failed');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = async (id) => {
    if (window.confirm('Delete this photo?')) {
      try {
        await apiService.deleteLegacyPhoto(id);
        fetchSectionData();
      } catch (error) {
        alert('Failed to delete photo');
      }
    }
  };

  return (
    <AdminLayout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" fontWeight="700" sx={{ mb: 3 }}>
          Legacy Project Management
        </Typography>

        <Paper sx={{ mb: 4 }}>
          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} variant="fullWidth">
            {SECTIONS.map((s, i) => (
              <Tab key={s.key} label={s.label} />
            ))}
          </Tabs>
        </Paper>

        {loading ? (
          <Box display="flex" justifyContent="center" p={5}><CircularProgress /></Box>
        ) : (
          <Box>
            {/* <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                variant="contained" 
                startIcon={<Edit size={18} />} 
                onClick={() => setIsModalOpen(true)}
              >
                Manage Page Content & Photos
              </Button>
            </Box> */}

            <UserSubmissionsManager sectionKey={currentSectionKey} />

            <Dialog 
              open={isModalOpen} 
              onClose={() => setIsModalOpen(false)} 
              maxWidth="md" 
              fullWidth
            >
              <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6">Manage {SECTIONS.find(s => s.key === currentSectionKey)?.label}</Typography>
                  <IconButton onClick={() => setIsModalOpen(false)} size="small">
                    x
                  </IconButton>
                </Box>
              </DialogTitle>
              <DialogContent dividers sx={{ p: 4, bgcolor: '#fbfbfb' }}>
                <Stack spacing={5} sx={{ maxWidth: '800px', mx: 'auto' }}>
                  
                  {/* --- SECTION 1: Page Content --- */}
                  <Box>
                    <Typography variant="h6" fontWeight="700" color="primary.main" mb={2}>
                      Main Page Content
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 3, bgcolor: 'white', borderRadius: 2 }}>
                      <Typography variant="subtitle2" fontWeight="600" mb={1} color="textSecondary">Description Text</Typography>
                      <TextField
                        fullWidth
                        multiline
                        rows={4}
                        variant="outlined"
                        placeholder="Write the main description for this section..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        sx={{ mb: 3 }}
                      />
                      
                      {currentSectionKey === 'senior' && (
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="subtitle2" fontWeight="600" mb={2} color="textSecondary">Program Impact Stats</Typography>
                          <Grid container spacing={3}>
                            <Grid item xs={12} sm={6} md={3}>
                              <TextField fullWidth size="small" type="number" label="Beds Donated" value={stats.beds} onChange={e => setStats({...stats, beds: parseInt(e.target.value) || 0})} />
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                              <TextField fullWidth size="small" type="number" label="Dogs Supported" value={stats.dogs} onChange={e => setStats({...stats, dogs: parseInt(e.target.value) || 0})} />
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                              <TextField fullWidth size="small" type="number" label="Medical Assists" value={stats.medical} onChange={e => setStats({...stats, medical: parseInt(e.target.value) || 0})} />
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                              <TextField fullWidth size="small" type="number" label="Adopted This Year" value={stats.adopted} onChange={e => setStats({...stats, adopted: parseInt(e.target.value) || 0})} />
                            </Grid>
                          </Grid>
                        </Box>
                      )}

                      <Box display="flex" justifyContent="flex-end">
                        <Button variant="contained" disableElevation onClick={handleSaveContent}>
                          Save Content Updates
                        </Button>
                      </Box>
                    </Paper>
                  </Box>

                  {/* --- SECTION 2: Project Updates --- */}
                  <Box>
                    <Typography variant="h6" fontWeight="700" color="primary.main" mb={2}>
                      Project Updates feed
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 3, bgcolor: 'white', borderRadius: 2 }}>
                      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                        <TextField 
                          fullWidth 
                          size="small"
                          placeholder="E.g. We just planted 10 new trees this spring!" 
                          value={newUpdate}
                          onChange={e => setNewUpdate(e.target.value)}
                        />
                        <Button variant="contained" disableElevation onClick={handleAddUpdate} startIcon={<Plus size={18}/>} sx={{ minWidth: '100px' }}>
                          Add
                        </Button>
                      </Box>
                      <List sx={{ bgcolor: '#f8fafc', borderRadius: 1, border: '1px solid #e2e8f0' }}>
                        {updates.length === 0 && <Typography p={3} color="textSecondary" align="center" fontStyle="italic">No updates posted yet</Typography>}
                        {updates.map((u, index) => (
                          <React.Fragment key={u.id}>
                            <ListItem>
                              <ListItemText 
                                primary={u.content} 
                                secondary={new Date(u.date).toLocaleDateString()} 
                                primaryTypographyProps={{ fontWeight: 500 }}
                              />
                              <ListItemSecondaryAction>
                                <IconButton edge="end" color="error" size="small" onClick={() => handleDeleteUpdate(u.id)}>
                                  <Trash2 size={18} />
                                </IconButton>
                              </ListItemSecondaryAction>
                            </ListItem>
                            {index < updates.length - 1 && <Divider />}
                          </React.Fragment>
                        ))}
                      </List>
                    </Paper>
                  </Box>

                  {/* --- SECTION 3: Admin Photo Gallery --- */}
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" fontWeight="700" color="primary.main">
                        Admin Photo Gallery
                      </Typography>
                      <Button variant="outlined" component="label" disabled={uploadingPhoto} startIcon={uploadingPhoto ? <CircularProgress size={16} /> : <Upload size={18}/>}>
                        Upload New Photo
                        <input type="file" hidden accept="image/*" onChange={handlePhotoUpload} />
                      </Button>
                    </Box>
                    <Paper variant="outlined" sx={{ p: 3, bgcolor: 'white', borderRadius: 2 }}>
                      <Grid container spacing={3}>
                        {photos.length === 0 && (
                          <Grid item xs={12}>
                            <Box sx={{ p: 4, textAlign: 'center' }}>
                              <Typography color="textSecondary" fontStyle="italic">No photos uploaded yet</Typography>
                            </Box>
                          </Grid>
                        )}
                        {photos.map(p => (
                          <Grid item xs={12} sm={4} md={3} key={p.id}>
                            <Box sx={{ position: 'relative', paddingTop: '100%', borderRadius: 2, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                              <img src={p.photoUrl} alt="Admin gallery" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                              <IconButton 
                                size="small" 
                                color="error" 
                                onClick={() => handleDeletePhoto(p.id)}
                                sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'rgba(255,255,255,0.9)', '&:hover': { bgcolor: 'white' }, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                              >
                                <Trash2 size={16} />
                              </IconButton>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </Paper>
                  </Box>

                </Stack>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setIsModalOpen(false)}>Close</Button>
              </DialogActions>
            </Dialog>
          </Box>
        )}
      </Box>
    </AdminLayout>
  );
}
