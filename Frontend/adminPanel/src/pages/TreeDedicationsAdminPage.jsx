import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Button, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Select, MenuItem, Chip, CircularProgress, Alert
} from '@mui/material';
import { RefreshCw } from 'lucide-react';


import apiService from '../services/apiService';

const UserSubmissionsManager = ({ sectionKey }) => {
  const [tabValue, setTabValue] = useState(0);
  const [pendingItems, setPendingItems] = useState([]);
  const [liveItems, setLiveItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchItems();
  }, [sectionKey]);

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      let pendingRes, liveRes;
      if (sectionKey === 'forest') {
        pendingRes = await apiService.getPendingTreeDedications();
        liveRes = await apiService.getLiveTreeDedications();
      } else if (sectionKey === 'senior') {
        pendingRes = await apiService.getPendingSeniorDogSubmissions();
        liveRes = await apiService.getLiveSeniorDogSubmissions();
      } else if (sectionKey === 'research') {
        pendingRes = await apiService.getPendingResearchSubmissions();
        liveRes = await apiService.getLiveResearchSubmissions();
      }

      setPendingItems(pendingRes?.data || []);
      setLiveItems(liveRes?.data || []);
    } catch (err) {
      console.error(`Failed to fetch submissions for ${sectionKey}:`, err);
      setError(err.message || 'Failed to load submissions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      if (sectionKey === 'forest') {
        await apiService.updateTreeDedicationStatus(id, status);
      } else if (sectionKey === 'senior') {
        await apiService.updateSeniorDogStatus(id, status);
      } else if (sectionKey === 'research') {
        await apiService.updateResearchStatus(id, status);
      }
      fetchItems();
    } catch (err) {
      alert("Error updating status: " + err.message);
    }
  };

  const handleStageUpdate = async (id, stage) => {
    try {
      if (sectionKey === 'forest') {
        await apiService.updateTreeDedicationStage(id, stage);
        fetchItems();
      }
    } catch (err) {
      alert("Error updating stage: " + err.message);
    }
  };

  const getTitle = () => {
    if (sectionKey === 'forest') return "User Submissions (Memorial Forest)";
    if (sectionKey === 'senior') return "User Submissions (Senior Dog Stories)";
    if (sectionKey === 'research') return "User Submissions (Research Stories)";
    return "User Submissions";
  };

  const ExpandableText = ({ text }) => {
    const [expanded, setExpanded] = useState(false);
    if (!text) return <span style={{ color: '#aaa' }}>—</span>;
    return (
      <Box>
        <Typography
          variant="body2"
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: expanded ? 'unset' : 1,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {text}
        </Typography>
        <Button
          size="small"
          onClick={() => setExpanded(e => !e)}
          sx={{ p: 0, mt: 0.5, fontSize: '0.72rem', textTransform: 'none', minWidth: 'auto' }}
        >
          {expanded ? 'Show less ▲' : 'Show more ▼'}
        </Button>
      </Box>
    );
  };

  const renderTable = (items, isPending) => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
            <TableCell>Date</TableCell>
            <TableCell>User</TableCell>
            <TableCell>{sectionKey === 'research' ? 'Title' : 'Dog Name'}</TableCell>
            {sectionKey === 'forest' && <TableCell>Type</TableCell>}
            <TableCell>Photo</TableCell>
            <TableCell>{sectionKey === 'research' ? 'Description' : (sectionKey === 'senior' ? 'Story' : 'Tribute')}</TableCell>
            {sectionKey === 'forest' && !isPending && <TableCell>Growth Stage</TableCell>}
            {isPending && <TableCell>Actions</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map(item => (
            <TableRow key={item.id}>
              <TableCell>{new Date(item.createdAt).toLocaleDateString()}</TableCell>
              <TableCell>{item.userFullName}</TableCell>
              <TableCell>{item.dogName || item.title}</TableCell>
              {sectionKey === 'forest' && <TableCell><Chip label={item.dedicationType} size="small" /></TableCell>}
              <TableCell>
                <img src={item.photoUrl} alt="Photo" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }} />
              </TableCell>
              <TableCell sx={{ maxWidth: 260 }}>
                <ExpandableText text={item.tributeMessage || item.story || item.description} />
              </TableCell>
              
              {sectionKey === 'forest' && !isPending && (
                <TableCell>
                  <Select
                    size="small"
                    value={item.growthStage || '🌱 Sapling'}
                    onChange={(e) => handleStageUpdate(item.id, e.target.value)}
                    sx={{ minWidth: 150 }}
                  >
                    <MenuItem value="🌱 Sapling">🌱 Sapling</MenuItem>
                    <MenuItem value="🌿 Young Tree">🌿 Young Tree</MenuItem>
                    <MenuItem value="🌳 Established">🌳 Established</MenuItem>
                  </Select>
                </TableCell>
              )}

              {isPending && (
                <TableCell>
                  <Button variant="contained" color="success" size="small" sx={{ mr: 1, mb: 1 }} onClick={() => handleStatusUpdate(item.id, 'Live')}>
                    Approve
                  </Button>
                  <Button variant="outlined" color="error" size="small" onClick={() => handleStatusUpdate(item.id, 'Rejected')}>
                    Reject
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
          {items.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} align="center">No {isPending ? 'pending' : 'live'} items</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box sx={{ mt: 5, pt: 3, borderTop: '1px solid #e2e8f0' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          {getTitle()}
        </Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={loading ? <CircularProgress size={16} /> : <RefreshCw size={16} />}
          onClick={fetchItems}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label={`Pending Review (${pendingItems.length})`} />
              <Tab label={`Live Items (${liveItems.length})`} />
            </Tabs>
          </Box>

          {tabValue === 0 && renderTable(pendingItems, true)}
          {tabValue === 1 && renderTable(liveItems, false)}
        </>
      )}

    </Box>
  );
};

export default UserSubmissionsManager;
