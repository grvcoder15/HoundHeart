import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import Navbar from '../components/Navbar';
import apiService from '../services/apiService';
import toastService from '../services/toastService';
import { jsPDF } from 'jspdf';

const JournalPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all-entries');
  const [selectedTag, setSelectedTag] = useState('all-tags'); // For filter dropdown
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [entryType, setEntryType] = useState('memory-reflection');
  const [entryContent, setEntryContent] = useState('');
  const [selectedEntryTag, setSelectedEntryTag] = useState(null); // Single tag selection for entry editor
  const [availableTags, setAvailableTags] = useState([]); // Tags from API
  // Get dog name from localStorage, fallback to 'jojo' if not available
  const dogName = localStorage.getItem('dogName') || 'My Dog';
  const [letterTo, setLetterTo] = useState(`My Dog (${dogName})`);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [journalEntries, setJournalEntries] = useState([]);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [isYearlyPlan, setIsYearlyPlan] = useState(true);
  const [isCreatingEntry, setIsCreatingEntry] = useState(false);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // Audio Recording State (Source 10 & 15)
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);

  // Image Upload State
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const imageInputRef = React.useRef(null);

  // Timer ref
  const timerRef = React.useRef(null);
  const mediaRecorderRef = React.useRef(null);
  const mediaStreamRef = React.useRef(null);
  const audioChunksRef = React.useRef([]);

  const getSupportedAudioMimeType = () => {
    if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) return '';
    const candidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus'
    ];
    return candidates.find(type => MediaRecorder.isTypeSupported(type)) || '';
  };

  // Start recording audio and log volume to console
  const startRecording = async () => {
    try {
      if (isRecording) return;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedAudioMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);

      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }

      audioChunksRef.current = [];
      mediaStreamRef.current = stream;

      // --- Live volume logging using Web Audio API ---
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      let stopped = false;
      function logVolume() {
        analyser.getByteTimeDomainData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const val = (dataArray[i] - 128) / 128;
          sum += val * val;
        }
        const rms = Math.sqrt(sum / dataArray.length);
        const volume = Math.round(rms * 100);
        console.log('[Voice Volume]', volume);
        if (!stopped && isRecording) requestAnimationFrame(logVolume);
      }
      logVolume();

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        stopped = true;
        audioContext.close();
        const chunkType = audioChunksRef.current[0]?.type;
        const finalType = recorder.mimeType || chunkType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: finalType });

        if (!blob.size) {
          toastService.error('Voice recording was empty. Please record again.');
          stream.getTracks().forEach(track => track.stop());
          mediaStreamRef.current = null;
          audioChunksRef.current = [];
          return;
        }

        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
        audioChunksRef.current = [];
      };

      recorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        toastService.error('Recording failed. Please try again.');
      };

      recorder.start(250);
      setMediaRecorder(recorder);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Error accessing microphone:", err);
      toastService.error("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current || mediaRecorder;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const stopRecordingAndGetBlob = () => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current || mediaRecorder;
      if (!recorder || recorder.state === 'inactive') {
        resolve(audioBlob);
        return;
      }

      const handleStop = () => {
        const chunkType = audioChunksRef.current[0]?.type;
        const finalType = recorder.mimeType || chunkType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: finalType });
        resolve(blob.size ? blob : null);
      };

      recorder.addEventListener('stop', handleStop, { once: true });

      recorder.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    });
  };

  const discardAudio = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [audioUrl]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getCurrentTierLevel = () => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        const tierFromUser = String(parsedUser?.tierLevel || '').toLowerCase().trim();
        if (tierFromUser === 'free' || tierFromUser === 'plus' || tierFromUser === 'premium') {
          return tierFromUser;
        }
      }

      const legacyTier = String(localStorage.getItem('userTier') || 'free').toLowerCase().trim();
      return legacyTier === 'plus' || legacyTier === 'premium' ? legacyTier : 'free';
    } catch {
      return 'free';
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProfileDropdown &&
        !event.target.closest('.profile-dropdown-container') &&
        !event.target.closest('[data-profile-button]') &&
        !event.target.closest('[data-logout-button]')) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileDropdown]);

  // Handle browser back button - redirect to landing page
  useEffect(() => {
    const handlePopState = (event) => {
      event.preventDefault();
      navigate('/', { replace: true });
    };

    window.addEventListener('popstate', handlePopState);

    // Push a state to the history so back button works
    window.history.pushState(null, '', window.location.href);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [navigate]);

  // Load tags from API on component mount
  useEffect(() => {
    const loadTags = async () => {
      try {
        const response = await apiService.getAllJournalTags();
        // Handle both array response and wrapped response
        const tags = Array.isArray(response) ? response : (response?.data || []);
        setAvailableTags(tags);
        console.log('Journal tags loaded:', tags);
      } catch (error) {
        console.error('Error loading journal tags:', error);
        // Fallback to empty array if API fails
        setAvailableTags([]);
      }
    };

    loadTags();
  }, []);

  // Load journal entries on component mount
  useEffect(() => {
    const loadJournalEntries = async (page = 1) => {
      try {
        const userId = localStorage.getItem('userId');
        if (userId) {
          setIsLoadingEntries(true);
          await fetchJournalEntries(page);
        }
      } catch (error) {
        console.error('Error loading journal entries on mount:', error);
      } finally {
        setIsLoadingEntries(false);
      }
    };

    // Reset page to 1 when switching tabs
    setCurrentPage(1);
    loadJournalEntries(1);
  }, [activeTab]);

  // Fetch journal entries from API
  const fetchJournalEntries = async (page = 1) => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        console.warn('No userId found, cannot fetch journal entries');
        return;
      }

      // Determine entry type based on active tab
      let entryType = '';
      if (activeTab === 'all-entries') {
        entryType = 'MemoryReflection';
      } else if (activeTab === 'legacy-archive') {
        entryType = 'Letter';
      }

      const response = await apiService.getUserJournalEntries(userId, page, ITEMS_PER_PAGE, entryType);
      console.log('API Response:', response);

      // Handle both wrapped and direct response shapes
      const payload = response?.data || response || {};
      const entriesRaw =
        payload?.entries ||
        payload?.Entries ||
        response?.entries ||
        response?.Entries ||
        (Array.isArray(payload) ? payload : []);

      const safeEntries = Array.isArray(entriesRaw) ? entriesRaw : [];

      const totalPagesRes =
        payload?.totalPages ||
        payload?.TotalPages ||
        response?.totalPages ||
        response?.TotalPages;
      if (totalPagesRes !== undefined) {
        setTotalPages(totalPagesRes);
      }

      // Ensure we stay on the requested page
      setCurrentPage(page);

      // Transform API response to match expected format
      const transformedEntries = safeEntries.map(entry => {
        // Convert tags string to array
        let tagsArray = [];
        if (entry.tags) {
          if (Array.isArray(entry.tags)) {
            tagsArray = entry.tags;
          } else if (typeof entry.tags === 'string') {
            tagsArray = entry.tags.trim() ? [entry.tags] : [];
          }
        }

        return {
          id: entry.id || entry.entryId || entry.journalEntryId || Date.now(),
          type: entry.entryType === 'MemoryReflection' ? 'memory-reflection' : 'letter',
          content: entry.content || '',
          tags: tagsArray,
          letterTo: entry.letterTo || entry.lettrTo || null,
          createdAt: entry.createdOn || entry.createdAt || entry.dateCreated || new Date().toISOString(),
          title: entry.title || (entry.entryType === 'Letter' ? `Letter to ${entry.letterTo || entry.lettrTo || 'My Dog'}` : 'Memory Reflection'),
          mediaUrl: entry.mediaUrl,
          mediaType: entry.mediaType,
          imageUrl: entry.imageUrl,
          audioUrl: entry.audioUrl || entry.audioPath,
          audioTranscription: entry.audioTranscription || entry.transcription || ''
        };
      });

      setJournalEntries(transformedEntries);
      console.log('Journal entries loaded:', transformedEntries);
    } catch (error) {
      console.error('Error fetching journal entries:', error);
      throw error;
    }
  };

  const handleNewEntry = () => {
    setShowCreateModal(true);
  };

  const downloadJournalPDF = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) { toastService.error('Please log in again.'); return; }

    toastService.show('Preparing your journal PDF...', 'info', 3000);

    // Fetch ALL entries (no type filter, large page size)
    let allEntries = [];
    try {
      const response = await apiService.getUserJournalEntries(userId, 1, 1000, '');
      const payload = response?.data || response || {};
      const raw = payload?.entries || payload?.data || payload?.items || (Array.isArray(payload) ? payload : []);
      allEntries = raw.map(entry => {
        let tagsArray = [];
        if (entry.tags) {
          if (Array.isArray(entry.tags)) tagsArray = entry.tags;
          else if (typeof entry.tags === 'string' && entry.tags.trim()) tagsArray = [entry.tags];
        }
        return {
          type: entry.entryType === 'MemoryReflection' ? 'memory-reflection' : 'letter',
          content: entry.content || '',
          tags: tagsArray,
          letterTo: entry.letterTo || entry.lettrTo || null,
          createdAt: entry.createdOn || entry.createdAt || entry.dateCreated || new Date().toISOString(),
          title: entry.title || (entry.entryType === 'Letter' ? `Letter to ${entry.letterTo || entry.lettrTo || 'My Dog'}` : 'Memory Reflection'),
          imageUrl: entry.imageUrl || entry.mediaUrl,
          audioUrl: entry.audioUrl || entry.audioPath,
          audioTranscription: entry.audioTranscription || entry.transcription || ''
        };
      });
    } catch (e) {
      toastService.error('Failed to load journal entries.');
      return;
    }

    if (allEntries.length === 0) { toastService.show('No journal entries to export.', 'info'); return; }
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 50;
    const contentW = pageW - margin * 2;

    // ── Cover Page ──────────────────────────────────────────────────────────
    // Background gradient simulation (filled rect)
    doc.setFillColor(245, 230, 255);
    doc.rect(0, 0, pageW, pageH, 'F');

    // Decorative top bar
    doc.setFillColor(139, 92, 246);
    doc.rect(0, 0, pageW, 8, 'F');
    doc.setFillColor(236, 72, 153);
    doc.rect(0, 8, pageW, 4, 'F');

    // HoundHeart logo text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(139, 92, 246);
    doc.text('HoundHeart™', pageW / 2, 80, { align: 'center' });

    // Title
    doc.setFontSize(42);
    doc.setTextColor(30, 30, 30);
    doc.text('Your Journal', pageW / 2, 200, { align: 'center' });

    // Subtitle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(16);
    doc.setTextColor(120, 80, 180);
    doc.text('Transform Your Lives Together', pageW / 2, 240, { align: 'center' });

    // Dog name
    doc.setFontSize(18);
    doc.setTextColor(80, 80, 80);
    doc.text(`A Legacy with ${dogName}`, pageW / 2, 290, { align: 'center' });

    // Divider line
    doc.setDrawColor(139, 92, 246);
    doc.setLineWidth(1.5);
    doc.line(margin + 60, 320, pageW - margin - 60, 320);

    // Entry count
    doc.setFontSize(13);
    doc.setTextColor(100, 100, 100);
    doc.text(`${allEntries.length} Journal ${allEntries.length === 1 ? 'Entry' : 'Entries'}`, pageW / 2, 360, { align: 'center' });

    // Date
    doc.setFontSize(12);
    doc.text(`Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageW / 2, 390, { align: 'center' });

    // Bottom bar
    doc.setFillColor(139, 92, 246);
    doc.rect(0, pageH - 8, pageW, 8, 'F');

    // ── Entry Pages ─────────────────────────────────────────────────────────
    for (let index = 0; index < allEntries.length; index++) {
      const entry = allEntries[index];
      doc.addPage();

      // Page background
      doc.setFillColor(252, 250, 255);
      doc.rect(0, 0, pageW, pageH, 'F');

      // Top accent bar
      const isLetter = entry.type === 'letter';
      if (isLetter) {
        doc.setFillColor(254, 243, 199); // yellow for letters
      } else {
        doc.setFillColor(237, 233, 254); // purple for memories
      }
      doc.rect(0, 0, pageW, 6, 'F');

      // Entry number badge
      doc.setFillColor(isLetter ? 249 : 139, isLetter ? 115 : 92, isLetter ? 22 : 246);
      doc.roundedRect(margin, 30, 60, 22, 4, 4, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text(`#${index + 1}`, margin + 30, 45, { align: 'center' });

      // Entry type badge
      const badgeLabel = isLetter ? 'Letter' : 'Memory';
      doc.setFillColor(isLetter ? 253 : 233, isLetter ? 230 : 213, isLetter ? 138 : 255);
      doc.roundedRect(margin + 70, 30, 70, 22, 4, 4, 'F');
      doc.setFontSize(10);
      doc.setTextColor(isLetter ? 146 : 109, isLetter ? 64 : 40, isLetter ? 14 : 217);
      doc.text(badgeLabel, margin + 105, 45, { align: 'center' });

      // Date (top right)
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      const dateStr = new Date(entry.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      doc.text(dateStr, pageW - margin, 45, { align: 'right' });

      // Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(30, 30, 30);
      const titleLines = doc.splitTextToSize(entry.title, contentW);
      doc.text(titleLines, margin, 90);
      let cursorY = 90 + titleLines.length * 26;

      // Letter to
      if (isLetter && entry.letterTo) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(13);
        doc.setTextColor(120, 80, 180);
        doc.text(`To: ${entry.letterTo}`, margin, cursorY + 10);
        cursorY += 30;
      }

      // Dog Image (if available) - fetched via backend proxy to avoid CORS with Azure Blob Storage
      if (entry.imageUrl) {
        try {
          const proxyUrl = `${import.meta.env.VITE_API_URL}/JournalEntry/proxy-image?url=${encodeURIComponent(entry.imageUrl)}`;
          const imgResponse = await fetch(proxyUrl);
          if (imgResponse.ok) {
            const blob = await imgResponse.blob();
            const base64 = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
            const imgHeight = 160;
            const imgWidth = (imgHeight / 3) * 4;
            if (cursorY + imgHeight + 20 > pageH - 80) {
              doc.addPage();
              doc.setFillColor(252, 250, 255);
              doc.rect(0, 0, pageW, pageH, 'F');
              cursorY = margin;
            }
            doc.addImage(base64, 'JPEG', pageW / 2 - imgWidth / 2, cursorY + 8, imgWidth, imgHeight);
            cursorY += imgHeight + 25;
          }
        } catch (e) {
          console.warn('Could not add image to PDF:', e);
        }
      }

      // Voice Note Transcription (if available)
      if (entry.audioTranscription) {
        if (cursorY + 40 > pageH - 80) {
          doc.addPage();
          doc.setFillColor(252, 250, 255);
          doc.rect(0, 0, pageW, pageH, 'F');
          cursorY = margin;
        }
        doc.setFillColor(230, 245, 255);
        doc.roundedRect(margin, cursorY, contentW, 4, 2, 2, 'F');
        cursorY += 16;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(30, 100, 180);
        doc.text('🎙️ Voice Note Transcript:', margin + 8, cursorY);
        cursorY += 18;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(80, 80, 80);
        const transcriptLines = doc.splitTextToSize(entry.audioTranscription, contentW - 16);
        transcriptLines.forEach(line => {
          if (cursorY + 16 > pageH - 80) {
            doc.addPage();
            doc.setFillColor(252, 250, 255);
            doc.rect(0, 0, pageW, pageH, 'F');
            cursorY = margin;
          }
          doc.text(line, margin + 8, cursorY);
          cursorY += 16;
        });
        cursorY += 8;
      }

      // Separator
      doc.setDrawColor(220, 200, 255);
      doc.setLineWidth(0.8);
      doc.line(margin, cursorY + 6, pageW - margin, cursorY + 6);
      cursorY += 22;

      // Content
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.setTextColor(60, 60, 60);
      const contentLines = doc.splitTextToSize(entry.content || '', contentW);
      const lineHeight = 18;
      contentLines.forEach(line => {
        if (cursorY + lineHeight > pageH - 80) {
          doc.addPage();
          doc.setFillColor(252, 250, 255);
          doc.rect(0, 0, pageW, pageH, 'F');
          cursorY = margin;
        }
        doc.text(line, margin, cursorY);
        cursorY += lineHeight;
      });

      // Tags
      if (entry.tags && entry.tags.length > 0) {
        cursorY += 16;
        let tagX = margin;
        entry.tags.forEach(tag => {
          const tagLabel = `#${tag}`;
          const tagW = doc.getTextWidth(tagLabel) + 14;
          if (tagX + tagW > pageW - margin) { tagX = margin; cursorY += 22; }
          doc.setFillColor(237, 233, 254);
          doc.roundedRect(tagX, cursorY - 13, tagW, 18, 4, 4, 'F');
          doc.setFontSize(10);
          doc.setTextColor(109, 40, 217);
          doc.text(tagLabel, tagX + 7, cursorY);
          tagX += tagW + 8;
        });
      }

      // Page number footer
      doc.setFillColor(245, 230, 255);
      doc.rect(0, pageH - 35, pageW, 35, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(150, 100, 200);
      doc.text('HoundHeart™ Journal', margin, pageH - 15);
      doc.text(`Page ${index + 2}`, pageW - margin, pageH - 15, { align: 'right' });
    }

    doc.save(`HoundHeart_Journal_${dogName.replace(/\s+/g, '_')}.pdf`);
    toastService.success('Journal downloaded as PDF!');
  };

  const handleProfileClick = () => {
    console.log('Profile clicked, current state:', showProfileDropdown);
    setShowProfileDropdown(!showProfileDropdown);
    console.log('Profile state after toggle:', !showProfileDropdown);
  };

  const handleProfileClose = () => {
    setShowProfileDropdown(false);
  };

  const handleProfileOption = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Profile option clicked, navigating to profile-settings');
    // Close dropdown first
    setShowProfileDropdown(false);
    // Then navigate after a small delay
    setTimeout(() => {
      navigate('/profile-settings');
    }, 100);
  };

  const handleLogout = (e) => {
    e.preventDefault();
    e.stopPropagation();

    console.log('Logout button clicked');

    try {
      // Close the dropdown first
      setShowProfileDropdown(false);

      // Clear all localStorage and sessionStorage on logout
      localStorage.clear();
      sessionStorage.clear();

      // Show logout message
      console.log('User logged out successfully');

      // Force redirect to landing page using window.location to bypass React Router
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
    } catch (error) {
      console.error('Error during logout:', error);
      // Fallback: still try to redirect
      window.location.href = '/';
    }
  };

  const handleCreateFirstEntry = () => {
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    // Reset form data
    setEntryType('memory-reflection');
    setEntryContent('');
    setSelectedEntryTag(null); // Reset to single tag
    // Reset to dog name from localStorage
    const currentDogName = localStorage.getItem('dogName') || 'My Dog';
    setLetterTo(`My Dog (${currentDogName})`);
    // Clear audio state on close
    discardAudio();
    // Clear image state on close
    setImageFile(null);
    setImagePreview(null);
  };

  // Image Upload Handlers
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toastService.error('Image must be under 5MB.');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const discardImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleTagToggle = (tagName) => {
    // Single tag selection - toggle if already selected, otherwise set
    setSelectedEntryTag(prev => prev === tagName ? null : tagName);
  };

  const handleCreateEntry = async () => {
    // Validation: Require either Content OR Audio
    if (!entryContent.trim() && !audioBlob && !imageFile) {
      toastService.error('Please add some text, record a voice note, or upload a photo.');
      return;
    }

    // Check free tier memory limit (5 memories max for free users)
    const normalizedTier = getCurrentTierLevel();
    
    if (normalizedTier === 'free' && journalEntries.length >= 5) {
      toastService.error('Free tier users can create up to 5 memories. Upgrade to Plus or Premium for unlimited memories!');
      setShowPricingModal(true);
      return;
    }

    // Stop recording if active
    // Stop recording if active and wait for blob
    let finalAudioBlob = audioBlob;
    if (isRecording) {
      finalAudioBlob = await stopRecordingAndGetBlob();
      setAudioBlob(finalAudioBlob); // Update state for consistency
    }

    setIsCreatingEntry(true);

    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        toastService.error('User ID not found. Please login again.');
        return;
      }

      // Use FormData for file upload support
      const formData = new FormData();
      formData.append('UserId', userId);
      formData.append('EntryType', entryType === 'memory-reflection' ? 'MemoryReflection' : 'Letter');
      formData.append('Content', entryContent.trim());
      formData.append('Tags', selectedEntryTag || '');
      if (entryType === 'letter') {
        formData.append('LettrTo', letterTo);
      }

      // Add Audio if available
      if (finalAudioBlob) {
        formData.append('AudioFile', finalAudioBlob, 'voice-note.webm');
        formData.append('MediaType', 'Audio');
      } else {
        formData.append('MediaType', 'Text');
      }

      // Add Image if available
      if (imageFile) {
        formData.append('ImageFile', imageFile, imageFile.name);
      }

      console.log('Creating journal entry with FormData');

      // Call API to create entry
      const response = await apiService.createJournalEntry(formData);
      console.log('Journal entry created successfully:', response);

      // Show success message
      toastService.success('Journal entry created successfully!');

      // Close modal
      handleCloseModal();
      // Clear audio & image
      discardAudio();
      discardImage();

      // Refresh entries list by calling GET API
      setIsLoadingEntries(true);
      try {
        await fetchJournalEntries();
      } finally {
        setIsLoadingEntries(false);
      }

    } catch (error) {
      console.error('Error creating journal entry:', error);
      toastService.error(error?.message || 'Failed to create journal entry. Please try again.');
    } finally {
      setIsCreatingEntry(false);
    }
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const handleUpgrade = () => {
    console.log('Upgrade to Premium clicked');
    setShowPricingModal(true);
  };

  const handleClosePricingModal = () => {
    setShowPricingModal(false);
  };

  const handlePlanToggle = () => {
    setIsYearlyPlan(!isYearlyPlan);
  };

  // Calculate insights data based on journal entries
  const calculateInsights = () => {
    const totalEntries = journalEntries.length;
    const legacyLetters = journalEntries.filter(entry => entry.type === 'letter').length;

    // Calculate most used tags
    const tagCounts = {};
    journalEntries.forEach(entry => {
      entry.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    const mostUsedTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([tag, count]) => ({ tag, count }));

    // Calculate writing streak (simplified - consecutive days with entries)
    const today = new Date();
    const entriesByDate = journalEntries.reduce((acc, entry) => {
      const date = new Date(entry.createdAt).toDateString();
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    let streak = 0;
    let currentDate = new Date(today);
    while (entriesByDate[currentDate.toDateString()]) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    }

    // Calculate this month's entries
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    const thisMonthEntries = journalEntries.filter(entry => {
      const entryDate = new Date(entry.createdAt);
      return entryDate.getMonth() === thisMonth && entryDate.getFullYear() === thisYear;
    }).length;

    return {
      totalEntries,
      legacyLetters,
      thisMonthEntries,
      mostUsedTags,
      writingStreak: streak
    };
  };

  const insights = calculateInsights();

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50 to-pink-50" style={{ overflow: 'visible' }}>
      {/* Top Navigation Bar */}
      <Navbar currentPage="journal" onUpgrade={handleUpgrade} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6" style={{ overflow: 'visible' }}>
        {/* Header Section */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-bold text-gray-900 mb-2">Your Journal</h1>
            <h2 className="text-lg text-gray-600">Transform Your Lives Together</h2>
            {/* <p>HoundHeart™ is designed to help you harness this connection. You'll learn to align with your dog's natural rhythms, sync your energy fields, and support each other's well-being on every level: physical, emotional, and spiritual.
              HoundHeart™ is more than technology. It is a pathway to a deeper relationship with your dog and a healthier, more vibrant you. Together, you and your dog can create a field of love and presence powerful enough to transform both your lives.</p> */}
          </div>
          {activeTab === 'legacy-archive' ? (
            <button
              onClick={() => { setEntryType('letter'); setShowCreateModal(true); }}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>Write a Letter</span>
            </button>
          ) : (
            <button
              onClick={handleNewEntry}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>New Entry</span>
            </button>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex w-full mb-4">
          <button
            onClick={() => setActiveTab('all-entries')}
            className={`flex-1 py-3 rounded-lg font-medium transition-all duration-300 ${activeTab === 'all-entries'
              ? 'bg-white text-purple-600 border-b-2 border-purple-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
          >
            All Entries
          </button>
          <button
            onClick={() => setActiveTab('legacy-archive')}
            className={`flex-1 py-3 rounded-lg font-medium transition-all duration-300 ${activeTab === 'legacy-archive'
              ? 'bg-white text-purple-600 border-b-2 border-purple-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
          >
            Legacy Archive
          </button>
          {/* <button
    onClick={() => setActiveTab('insights')}
    className={`flex-1 py-3 rounded-lg font-medium transition-all duration-300 ${
      activeTab === 'insights'
        ? 'bg-white text-purple-600 border-b-2 border-purple-600 shadow-sm'
        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
    }`}
  >
    Insights
  </button> */}
        </div>


        {/* Search and Filter Section */}
        <div className="flex items-center justify-between mb-4">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search your memories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm"
            />
          </div>

          {/* Tags Filter */}
          <div className="relative">
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-3 pr-8 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm min-w-[150px]"
            >
              <option value="all-tags">All Tags</option>
              {availableTags.map((tag) => (
                <option key={tag.tagId} value={tag.tagName}>
                  {tag.tagName}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Main Content Area - Conditional based on active tab */}
        {activeTab === 'all-entries' && (
          <div>
            {(() => {
              // Use journalEntries directly as they are already filtered by backend
              let memoryEntries = journalEntries;

              // Apply tag filter if a tag is selected
              if (selectedTag !== 'all-tags') {
                memoryEntries = memoryEntries.filter(entry =>
                  entry.tags && entry.tags.includes(selectedTag)
                );
              }

              // Apply search filter if search query exists
              if (searchQuery.trim()) {
                memoryEntries = memoryEntries.filter(entry =>
                  entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  entry.title.toLowerCase().includes(searchQuery.toLowerCase())
                );
              }
              // Show loading state
              if (isLoadingEntries) {
                return (
                  <div className="bg-white rounded-2xl shadow-lg p-4">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading entries...</p>
                    </div>
                  </div>
                );
              }

              return memoryEntries.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-lg p-4">
                  <div className="text-center">
                    {/* Book Icon */}
                    <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-12 h-12 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>

                    {/* No Entries Message */}
                    <h3 className="text-lg font-bold text-gray-900 mb-4">No memory entries found</h3>
                    <p className="text-gray-600 mb-4 text-lg">Start documenting your journey with jojo.</p>

                    {/* Create First Entry Button */}
                    <button
                      onClick={handleCreateFirstEntry}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-4 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                      Create First Entry
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {memoryEntries.map((entry) => (
                    <div key={entry.id} className="bg-white rounded-2xl shadow-lg p-4 hover:shadow-xl transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{entry.title}</h3>
                          <p className="text-sm text-gray-500 mb-3">
                            {new Date(entry.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{entry.content}</p>

                          {/* Photo Attachment — below text, above audio */}
                          {entry.imageUrl && (
                            <div className="mt-4">
                              <img
                                src={entry.imageUrl}
                                alt="Journal photo"
                                style={{ maxHeight: '250px', width: '100%', objectFit: 'cover', borderRadius: '8px' }}
                                className="shadow-sm cursor-pointer hover:opacity-90 transition-opacity duration-200"
                                onClick={() => window.open(entry.imageUrl, '_blank')}
                              />
                            </div>
                          )}

                          {/* Audio Player */}
                          {(entry.mediaType === 'Audio' || entry.mediaType === 3) && entry.mediaUrl && (
                            <div className="mt-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                              <div className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wider flex items-center">
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                                Voice Note
                              </div>
                              <audio controls src={entry.mediaUrl} className="w-full h-8" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                            Memory
                          </span>
                        </div>
                      </div>

                      {entry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {entry.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Pagination Controls (Memory) */}
                  <div className="flex justify-center items-center space-x-4 mt-4">
                    <button
                      onClick={() => {
                        const newPage = Math.max(1, currentPage - 1);
                        setIsLoadingEntries(true);
                        fetchJournalEntries(newPage).finally(() => setIsLoadingEntries(false));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      disabled={currentPage === 1}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-purple-600 hover:bg-purple-50 border border-purple-200'
                        }`}
                    >
                      Previous
                    </button>
                    <span className="text-gray-600 font-medium">
                      Page {currentPage} of {totalPages || 1}
                    </span>
                    <button
                      onClick={() => {
                        const newPage = Math.min(totalPages, currentPage + 1);
                        setIsLoadingEntries(true);
                        fetchJournalEntries(newPage).finally(() => setIsLoadingEntries(false));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${currentPage === totalPages || totalPages === 0
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-purple-600 hover:bg-purple-50 border border-purple-200'
                        }`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Legacy Archive Content */}
        {activeTab === 'legacy-archive' && (
          <div className="space-y-4">
            {/* Legacy Archive Header */}
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Legacy Archive</h2>
                <p className="text-gray-600">Letters and special memories to preserve forever</p>
              </div>
            </div>

            {/* Legacy Archive Content */}
            {(() => {
              // Use journalEntries directly as they are already filtered by backend
              let legacyEntries = journalEntries;

              // Apply tag filter if a tag is selected
              if (selectedTag !== 'all-tags') {
                legacyEntries = legacyEntries.filter(entry =>
                  entry.tags && entry.tags.includes(selectedTag)
                );
              }

              // Apply search filter if search query exists
              if (searchQuery.trim()) {
                legacyEntries = legacyEntries.filter(entry =>
                  entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  entry.title.toLowerCase().includes(searchQuery.toLowerCase())
                );
              }

              return legacyEntries.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-lg p-4">
                  <div className="text-center">
                    {/* Heart Icon */}
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>

                    {/* No Legacy Entries Message */}
                    <h3 className="text-lg font-bold text-gray-900 mb-4">No legacy entries yet</h3>
                    <p className="text-gray-600 mb-4 text-lg">Start writing letters to jojo or your future self.</p>

                    {/* Write First Letter Button */}
                    <button
                      onClick={() => {
                        setEntryType('letter');
                        setShowCreateModal(true);
                      }}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-4 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                      Write First Letter
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {legacyEntries.map((entry) => (
                    <div key={entry.id} className="bg-white rounded-2xl shadow-lg p-4 hover:shadow-xl transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{entry.title}</h3>
                          <p className="text-sm text-gray-500 mb-3">
                            {new Date(entry.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{entry.content}</p>

                          {/* Photo Attachment — below text, above audio */}
                          {entry.imageUrl && (
                            <div className="mt-4">
                              <img
                                src={entry.imageUrl}
                                alt="Journal photo"
                                style={{ maxHeight: '250px', width: '100%', objectFit: 'cover', borderRadius: '8px' }}
                                className="shadow-sm cursor-pointer hover:opacity-90 transition-opacity duration-200"
                                onClick={() => window.open(entry.imageUrl, '_blank')}
                              />
                            </div>
                          )}

                          {/* Audio Player for Letters */}
                          {(entry.mediaType === 'Audio' || entry.mediaType === 3) && entry.mediaUrl && (
                            <div className="mt-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                              <div className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wider flex items-center">
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                                Voice Note
                              </div>
                              <audio controls src={entry.mediaUrl} className="w-full h-8" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-700">
                            Letter
                          </span>
                        </div>
                      </div>

                      {entry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {entry.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Pagination Controls (Legacy Archive) */}
                  <div className="flex justify-center items-center space-x-4 mt-4">
                    <button
                      onClick={() => {
                        const newPage = Math.max(1, currentPage - 1);
                        setIsLoadingEntries(true);
                        fetchJournalEntries(newPage).finally(() => setIsLoadingEntries(false));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      disabled={currentPage === 1}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-purple-600 hover:bg-purple-50 border border-purple-200'
                        }`}
                    >
                      Previous
                    </button>
                    <span className="text-gray-600 font-medium">
                      Page {currentPage} of {totalPages || 1}
                    </span>
                    <button
                      onClick={() => {
                        const newPage = Math.min(totalPages, currentPage + 1);
                        setIsLoadingEntries(true);
                        fetchJournalEntries(newPage).finally(() => setIsLoadingEntries(false));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${currentPage === totalPages || totalPages === 0
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-purple-600 hover:bg-purple-50 border border-purple-200'
                        }`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Export Your Legacy Section */}
            {(() => {
              const user = JSON.parse(localStorage.getItem('user') || '{}');
              const isPremium = user.roleId === 2 || user.RoleId === 2;
              return (
                <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">Export Your Legacy</h3>
                      <p className="text-gray-600">
                        {isPremium
                          ? 'Download your complete journal as a beautiful PDF book'
                          : 'Upgrade to Premium to download your complete journal as a beautiful PDF book'}
                      </p>
                    </div>
                    {isPremium ? (
                      <button
                        onClick={downloadJournalPDF}
                        className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-4 py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-yellow-600 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center space-x-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17v3a1 1 0 001 1h16a1 1 0 001-1v-3" />
                        </svg>
                        <span>Download PDF</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate('/subscription')}
                        className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-4 py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-yellow-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
                      >
                        Upgrade to Export
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Insights Content - Commented out
        {activeTab === 'insights' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl shadow-lg p-4 text-center">
                <div className="text-lg font-bold text-purple-600 mb-2">{insights.totalEntries}</div>
                <div className="text-gray-600">Total Entries</div>
              </div>
              <div className="bg-white rounded-2xl shadow-lg p-4 text-center">
                <div className="text-lg font-bold text-purple-600 mb-2">{insights.legacyLetters}</div>
                <div className="text-gray-600">Legacy Letters</div>
              </div>
              <div className="bg-white rounded-2xl shadow-lg p-4 text-center">
                <div className="text-lg font-bold text-purple-600 mb-2">{insights.thisMonthEntries}</div>
                <div className="text-gray-600">This Month</div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-4">
              <div className="mb-4">
                <h2 className="text-lg font-bold text-gray-900 mb-3">Your Journaling Journey</h2>
                <p className="text-gray-600 leading-relaxed">
                  You've been documenting your bond with jojo and creating lasting memories. Keep writing to strengthen your connection and preserve these precious moments.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Used Tags</h3>
                  <div className="space-y-3">
                    {insights.mostUsedTags.length > 0 ? (
                      insights.mostUsedTags.map(({ tag, count }) => (
                        <div key={tag} className="flex items-center justify-between">
                          <span className="text-gray-700">{tag}</span>
                          <span className="text-gray-500">{count}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-500 italic">No tags used yet</div>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Writing Streak</h3>
                  <div className="flex items-baseline space-x-2 mb-2">
                    <span className="text-lg font-bold text-purple-600">{insights.writingStreak} days</span>
                    <span className="text-gray-500">{insights.totalEntries}</span>
                  </div>
                  <p className="text-gray-600">
                    {insights.writingStreak > 0 ? 'Keep it up!' : 'Start your first entry to begin your streak!'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        */}
      </div>

      {/* Create Entry Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Create New Journal Entry</h2>
                <p className="text-gray-600 mt-1">Document your memories and special moments with your beloved companion</p>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-4">
              {/* Entry Type Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">What type of entry is this?</label>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setEntryType('memory-reflection')}
                    className={`px-4 py-3 rounded-full font-medium transition-colors ${entryType === 'memory-reflection'
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    Memory/Reflection
                  </button>
                  <button
                    onClick={() => setEntryType('letter')}
                    className={`px-4 py-3 rounded-full font-medium transition-colors ${entryType === 'letter'
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    Letter
                  </button>
                  {/* New: Audio Note Button/State (Source 10 & 15) - Just handling it within memory/letter for now, or as a feature */}
                </div>
              </div>

              {/* Media Attachments — Combined Audio & Photo */}
              <div className="bg-gradient-to-br from-purple-50/70 to-pink-50/40 p-4 rounded-2xl border border-purple-100/60">
                <label className="block text-sm font-semibold text-gray-700 mb-4">Media Attachments</label>

                {/* Side-by-side Action Buttons */}
                <div className="flex gap-3 mb-4">
                  {/* Mic Button / Recording Controls */}
                  {!isRecording && !audioBlob && (
                    <button
                      onClick={startRecording}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white border border-purple-200 text-gray-700 hover:bg-purple-50 hover:border-purple-300 transition-all duration-200 shadow-sm"
                    >
                      <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                      <span className="text-sm font-medium">Voice Note</span>
                    </button>
                  )}

                  {isRecording && (
                    <div className="flex-1 flex items-center justify-center gap-3 py-3 rounded-xl bg-red-50 border border-red-200">
                      <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>
                      <span className="text-red-600 font-mono text-sm font-bold">{formatTime(recordingTime)}</span>
                      <button
                        onClick={stopRecording}
                        className="px-3 py-1 bg-red-500 text-white text-xs font-medium rounded-full hover:bg-red-600 transition-colors"
                      >
                        Stop
                      </button>
                    </div>
                  )}

                  {audioBlob && (
                    <div className="flex-1 flex items-center gap-2 py-2 px-3 rounded-xl bg-white border border-purple-200">
                      <audio controls src={audioUrl} className="h-8 flex-1" style={{ maxWidth: '200px' }} />
                      <button
                        onClick={discardAudio}
                        className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                        title="Remove recording"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}

                  {/* Photo Button */}
                  {!imageFile && (
                    <button
                      onClick={() => imageInputRef.current?.click()}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white border border-purple-200 text-gray-700 hover:bg-purple-50 hover:border-purple-300 transition-all duration-200 shadow-sm"
                    >
                      <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm font-medium">Add Photo</span>
                    </button>
                  )}
                </div>

                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />

                {/* Elegant Image Preview */}
                {imagePreview && (
                  <div className="relative group rounded-2xl overflow-hidden border border-purple-100 shadow-sm" style={{ maxWidth: '280px' }}>
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-44 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 flex items-end justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="text-white text-xs">
                        <p className="font-medium truncate" style={{ maxWidth: '180px' }}>{imageFile?.name}</p>
                        <p className="opacity-80">{(imageFile?.size / 1024).toFixed(0)} KB</p>
                      </div>
                      <button
                        onClick={discardImage}
                        className="w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-gray-600 hover:text-red-500 hover:bg-white transition-all shadow-sm"
                        title="Remove photo"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Letter To Field - Only show when Letter is selected */}
              {entryType === 'letter' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Letter to:</label>
                  <div className="relative">
                    <select
                      value={letterTo}
                      onChange={(e) => setLetterTo(e.target.value)}
                      className="appearance-none w-full px-4 py-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value={`My Dog (${dogName})`}>My Dog ({dogName})</option>
                      <option value="My Beloved Companion">My Beloved Companion</option>
                      <option value="My Best Friend">My Best Friend</option>
                      <option value="My Furry Family">My Furry Family</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              {/* Content Section */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Content</label>
                <textarea
                  value={entryContent}
                  onChange={(e) => setEntryContent(e.target.value)}
                  placeholder={entryType === 'letter' ? `Dear ${dogName}...` : `What made today meaningful with ${dogName}?`}
                  className="w-full h-40 p-4 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Tags Section */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
                    <button
                      key={tag.tagId}
                      onClick={() => handleTagToggle(tag.tagName)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedEntryTag === tag.tagName
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      {tag.tagName}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200">
              <button
                onClick={handleCloseModal}
                className="px-4 py-3 bg-white text-gray-700 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateEntry}
                disabled={isCreatingEntry}
                className="px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isCreatingEntry ? 'Creating...' : 'Create Entry'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Modal */}
      {showPricingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Compact Modal Header */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">⭐</span>
                  <h3 className="text-white font-bold text-lg">Upgrade to Premium</h3>
                </div>
                <button
                  onClick={handleClosePricingModal}
                  className="text-white hover:opacity-80 transition-opacity"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Compact Modal Content */}
            <div className="px-4 py-5">
              <p className="text-gray-700 text-center mb-4 font-medium">
                You've reached your free limit. Upgrade to Premium for unlimited access!
              </p>

              {/* Quick Features List */}
              <div className="bg-purple-50 rounded-lg p-4 mb-4 space-y-2">
                <div className="flex items-center space-x-2 text-sm text-gray-700">
                  <span className="text-green-500">✓</span>
                  <span>Unlimited memories & journal entries</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-700">
                  <span className="text-green-500">✓</span>
                  <span>All premium features unlocked</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-700">
                  <span className="text-green-500">✓</span>
                  <span>Priority support & exclusive content</span>
                </div>
              </div>

              {/* Pricing Quick View */}
              <div className="bg-gray-50 rounded-lg p-3 mb-4 text-center text-sm">
                <div className="text-gray-600">Start from</div>
                <div className="text-lg font-bold text-purple-600">$19.99/mo</div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleClosePricingModal}
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors"
                >
                  Not Now
                </button>
                <button
                  onClick={() => {
                    setShowPricingModal(false);
                    navigate('/subscription');
                  }}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg"
                >
                  Upgrade Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JournalPage;
