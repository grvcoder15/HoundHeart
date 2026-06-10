import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import Navbar from '../components/Navbar';
import apiService from '../services/apiService';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

const CommunityPage = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState({});
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [newPost, setNewPost] = useState('');

  // Community Feed State
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [expandedComments, setExpandedComments] = useState({}); // { postId: { comments: [], loading: false, page: 1 } }
  const [commentTexts, setCommentTexts] = useState({}); // { postId: '' }
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Posts');
  const [selectedMood, setSelectedMood] = useState(null);
  const [sortBy, setSortBy] = useState('newest');
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Edit / Delete / Report State
  const [showPostMenu, setShowPostMenu] = useState(null); // postId
  const [showCommentMenu, setShowCommentMenu] = useState(null); // commentId
  const [editingPostId, setEditingPostId] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editContent, setEditContent] = useState('');

  const [reportModal, setReportModal] = useState({ isOpen: false, postId: null, commentId: null });
  const [reportReason, setReportReason] = useState('');
  const [joinCircleModal, setJoinCircleModal] = useState({ isOpen: false, circleId: null, circleName: '' });
  const [joiningCircle, setJoiningCircle] = useState(false);
  const [leaveCircleModal, setLeaveCircleModal] = useState({ isOpen: false, circleId: null, circleName: '' });
  const [leavingCircle, setLeavingCircle] = useState(false);
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyTexts, setReplyTexts] = useState({});
  const [isSticky, setIsSticky] = useState(false);

  // Current user ID (safely retrieved from local storage, fallback to null)
  const currentUserId = (() => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return null;
      const user = JSON.parse(userStr);
      return user.userId || user.UserId || user.id || null;
    } catch (e) {
      return null;
    }
  })();

  // Community Stats & Sidebar State
  const [stats, setStats] = useState({ activeMembers: 0, storiesShared: 0, healingCircles: 0, avgBondGrowth: '0%' });
  const [summaryStats, setSummaryStats] = useState(null);
  const [circlesCount, setCirclesCount] = useState(0);
  const [circlesData, setCirclesData] = useState([]);
  const [loadingCircles, setLoadingCircles] = useState(false);
  const [joinedCircles, setJoinedCircles] = useState(new Set());
  const [totalPostCount, setTotalPostCount] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [isYearlyPlan, setIsYearlyPlan] = useState(true);
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'success' });

  const getAuthorKey = (post) => {
    const author = post?.author || post?.Author || {};
    return String(
      author.userId ||
      author.UserId ||
      author.id ||
      author.Id ||
      author.authorName ||
      author.fullName ||
      'unknown'
    ).trim().toLowerCase();
  };

  const computePostTags = (post) => {
    const allTags = ['Chakra', 'Meditation', 'Energy Work', 'Healing', 'Ritual', 'Soul Bond', 'Companion', 'Journey', 'Peace', 'Zen', 'Aura'];
    const contentLower = String(post?.content || '').toLowerCase();
    let selectedTags = [];

    if (contentLower.includes('heal') || contentLower.includes('feel')) selectedTags.push('Healing');
    if (contentLower.includes('ritual') || contentLower.includes('circle')) selectedTags.push('Ritual');
    if (contentLower.includes('peace') || contentLower.includes('calm')) selectedTags.push('Peace');
    if (contentLower.includes('energy') || contentLower.includes('aura')) selectedTags.push('Aura');
    if (contentLower.includes('bond') || contentLower.includes('dog')) selectedTags.push('Soul Bond');

    let seed = contentLower.length || 42;
    while (selectedTags.length < 3) {
      const tag = allTags[seed % allTags.length];
      if (!selectedTags.includes(tag)) selectedTags.push(tag);
      seed += 5;
    }

    return selectedTags.slice(0, 3).map(t => t.toLowerCase());
  };

  const doesPostMatchCategory = (post, category) => {
    if (!category || category === 'All Posts') return true;

    const normalizedCategory = String(category).toLowerCase();
    const computedTags = computePostTags(post);
    const content = String(post?.content || '').toLowerCase();

    const healingTags = ['healing', 'peace', 'zen', 'aura', 'energy work', 'calm'];
    const ritualTags = ['ritual', 'chakra', 'meditation', 'energy work'];
    const successTags = ['journey', 'soul bond', 'companion'];

    if (normalizedCategory === 'healing') {
      return computedTags.some(t => healingTags.includes(t)) ||
        content.includes('heal') || content.includes('feel') || content.includes('calm') || content.includes('peace');
    }

    if (normalizedCategory === 'rituals') {
      return computedTags.some(t => ritualTags.includes(t)) ||
        content.includes('ritual') || content.includes('chakra') || content.includes('meditation') || content.includes('circle');
    }

    if (normalizedCategory === 'success stories') {
      return computedTags.some(t => successTags.includes(t)) ||
        content.includes('success') || content.includes('milestone') || content.includes('progress') || content.includes('achievement') || content.includes('growth');
    }

    if (normalizedCategory === 'questions') {
      return content.includes('?') || content.includes('how') || content.includes('help') || content.includes('advice') || content.includes('question');
    }

    return true;
  };

  const filteredPosts = posts.filter(post => doesPostMatchCategory(post, selectedCategory));

  const calculateEngagementGrowth = (postsArray = []) => {
    if (!Array.isArray(postsArray) || postsArray.length === 0) return '0%';

    const totalEngagement = postsArray.reduce((acc, post) => {
      const likeCount = Number(post?.likeCount || post?.LikeCount || 0);
      const commentCount = Number(post?.commentCount || post?.CommentCount || 0);
      return acc + likeCount + commentCount;
    }, 0);

    const averageEngagement = totalEngagement / postsArray.length;
    // Keep percentage stable and meaningful in UI without hardcoded card values.
    const growth = Math.min(100, Math.max(0, averageEngagement * 2));
    return `${growth.toFixed(1)}%`;
  };

  const syncStats = (postsArray = posts, summary = summaryStats, circles = circlesCount, totalPosts = totalPostCount) => {
    const uniqueMembers = new Set((postsArray || []).map(getAuthorKey).filter(Boolean)).size;
    const normalizedSummary = summary || {};

    const activeMembers = Number(
      normalizedSummary.activeMembers ?? normalizedSummary.ActiveMembers ?? uniqueMembers ?? 0
    );

    const storiesShared = Number(
      normalizedSummary.storiesShared ??
      normalizedSummary.StoriesShared ??
      normalizedSummary.totalPosts ??
      normalizedSummary.TotalPosts ??
      totalPosts ??
      postsArray.length
    );

    const healingCircles = Number(
      normalizedSummary.healingCircles ?? normalizedSummary.HealingCircles ?? circles ?? 0
    );

    const avgBondGrowth =
      normalizedSummary.avgBondGrowth ??
      normalizedSummary.AvgBondGrowth ??
      calculateEngagementGrowth(postsArray);

    setStats({
      activeMembers: Number.isFinite(activeMembers) ? activeMembers : 0,
      storiesShared: Number.isFinite(storiesShared) ? storiesShared : 0,
      healingCircles: Number.isFinite(healingCircles) ? healingCircles : 0,
      avgBondGrowth: String(avgBondGrowth || '0%')
    });
  };

  // Check authentication on component mount
  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    const user = localStorage.getItem('user');

    if (!isAuthenticated || !user) {
      console.log('User not authenticated, redirecting to landing page');
      navigate('/', { replace: true });
      return;
    }

    fetchPosts();
    fetchCommunityData();
  }, [navigate]);

  useEffect(() => {
    syncStats(posts, summaryStats, circlesCount, totalPostCount);
  }, [posts, summaryStats, circlesCount, totalPostCount]);

  // Handle scroll for sticky share card
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerWidth >= 1024) {
        setIsSticky(window.scrollY > 200);
      } else {
        setIsSticky(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Refetch posts when search or category changes, with debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchPosts(1, false);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery, sortBy]);

  const fetchCommunityData = async () => {
    try {
      const [statsRes, circlesRes, joinedRes] = await Promise.all([
        apiService.getCommunitySummary(),
        apiService.getCommunityCircles(),
        apiService.getMyJoinedCircles()
      ]);

      if (statsRes && statsRes.success) {
        setSummaryStats(statsRes.data || null);
      }

      if (circlesRes && circlesRes.success) {
        const circles = Array.isArray(circlesRes.data)
          ? circlesRes.data
          : (Array.isArray(circlesRes.data?.circles) ? circlesRes.data.circles : []);
        setCirclesCount(circles.length);
        setCirclesData(circles);
      }

      if (joinedRes && joinedRes.success) {
        const joinedIds = Array.isArray(joinedRes.data) ? joinedRes.data : [];
        setJoinedCircles(new Set(joinedIds.map(id => normalizeCircleId(id)).filter(Boolean)));
      }
    } catch (error) {
      console.error('Error fetching community data:', error);
    }
  };

  const getPostUniqueId = (post) => {
    if (!post) return `temp-${Math.random()}`;
    const id = post.postId || post.id || post.Id || post.PostId || post.ID;
    if (id) return String(id).trim().toLowerCase();
    const author = (post.author?.fullName || post.Author?.fullName || post.author?.authorName || post.Author?.authorName || 'anon').trim().toLowerCase();
    // Signature: Only compare alphanumeric chars after mood stripping
    const content = (post.content || '').trim().replace(/^.*I'm feeling.*: /, '').replace(/[^a-z0-9]/gi, '').substring(0, 100);
    return `sig-${author}-${content}`;
  };

  const getUniquePosts = (postsArray) => {
    if (!Array.isArray(postsArray)) return [];
    const seenIds = new Set();
    const seenSigs = new Set();
    const unique = [];

    for (const post of postsArray) {
      if (!post) continue;
      const id = post.postId || post.id || post.Id || post.PostId || post.ID;
      const normalizedId = id ? String(id).trim().toLowerCase() : null;

      const author = (post.author?.fullName || post.Author?.fullName || post.author?.authorName || post.Author?.authorName || 'anon').trim().toLowerCase();
      const content = (post.content || '').trim().replace(/^.*I'm feeling.*: /, '').replace(/[^a-z0-9]/gi, '').substring(0, 100);
      const signature = `sig-${author}-${content}`;

      const isIdDuplicate = normalizedId && seenIds.has(normalizedId);
      const isSigDuplicate = seenSigs.has(signature);

      if (!isIdDuplicate && !isSigDuplicate) {
        if (normalizedId) seenIds.add(normalizedId);
        seenSigs.add(signature);
        unique.push(post);
      }
    }
    return unique;
  };

  const fetchPosts = async (pageNumber = 1, append = false) => {
    setLoadingPosts(true);
    try {
      const response = await apiService.getCommunityPosts(pageNumber, 10, searchQuery, '', sortBy);
      if (response && response.success) {
        const responseData = response.data || {};
        const newPosts = Array.isArray(responseData.posts) ? responseData.posts : [];
        const totalPostsFromApi =
          responseData.totalPosts ??
          responseData.TotalPosts ??
          responseData.totalCount ??
          responseData.TotalCount;

        if (totalPostsFromApi !== undefined) {
          setTotalPostCount(Number(totalPostsFromApi) || 0);
        }

        if (append) {
          setPosts(prev => {
            const combined = [...prev, ...newPosts];
            return getUniquePosts(combined);
          });
        } else {
          setPosts(getUniquePosts(newPosts));
        }
        setTotalPages(response.data.totalPages);
        setPage(pageNumber);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoadingPosts(false);
    }
  };

  // Scroll animation effect
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(prev => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    const elements = document.querySelectorAll('[data-animate]');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProfileDropdown &&
        !event.target.closest('.profile-dropdown-container') &&
        !event.target.closest('[data-profile-button]') &&
        !event.target.closest('[data-logout-button]')) {
        setShowProfileDropdown(false);
      }

      if (showPostMenu && !event.target.closest(`[data-post-menu="${showPostMenu}"]`)) {
        setShowPostMenu(null);
      }
      if (showCommentMenu && !event.target.closest(`[data-comment-menu="${showCommentMenu}"]`)) {
        setShowCommentMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileDropdown, showPostMenu, showCommentMenu]);

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

  const handleUpgrade = () => {
    setShowPricingModal(true);
  };

  const handleClosePricingModal = () => {
    setShowPricingModal(false);
  };

  const handlePlanToggle = () => {
    setIsYearlyPlan(!isYearlyPlan);
  };

  const showToast = (message, type = 'success') => {
    setToast({ isOpen: true, message, type });
    setTimeout(() => {
      setToast({ isOpen: false, message: '', type: 'success' });
    }, 3000);
  };

  const normalizeCircleId = (circleId) => String(circleId || '').trim().toLowerCase();

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

  const handleOpenJoinCircleModal = (circleId, circleName) => {
    setJoinCircleModal({ isOpen: true, circleId, circleName });
  };

  const handleConfirmJoinCircle = async () => {
    if (!joinCircleModal.circleId) return;

    // Check free tier community trial limit (1-2 circle joins max for free users)
    const normalizedTier = getCurrentTierLevel();
    
    if (normalizedTier === 'free') {
      const circleJoinsTrialUsed = parseInt(localStorage.getItem('circleJoinsTrialUsed') || '0', 10);
      
      if (circleJoinsTrialUsed >= 2) {
        showToast('Free tier users can join up to 2 circles. Upgrade to Plus for unlimited circle access!', 'error');
        setJoinCircleModal({ isOpen: false, circleId: null, circleName: '' });
        setShowPricingModal(true);
        return;
      }
    }

    setJoiningCircle(true);
    try {
      const response = await apiService.joinCircle(joinCircleModal.circleId);
      if (response && response.success) {
        // Track trial usage for free users
        if (normalizedTier === 'free') {
          const circleJoinsTrialUsed = parseInt(localStorage.getItem('circleJoinsTrialUsed') || '0', 10);
          localStorage.setItem('circleJoinsTrialUsed', String(circleJoinsTrialUsed + 1));
        }

        showToast('You have successfully joined the healing circle!', 'success');
        const normalizedId = normalizeCircleId(joinCircleModal.circleId);
        setJoinedCircles(prev => new Set([...prev, normalizedId]));
        setJoinCircleModal({ isOpen: false, circleId: null, circleName: '' });
        fetchCommunityData(); // Refresh to update participant count
      } else {
        showToast(response?.message || 'Failed to join circle', 'error');
      }
    } catch (error) {
      console.error('Error joining circle:', error);
      showToast('An unexpected error occurred.', 'error');
    } finally {
      setJoiningCircle(false);
    }
  };

  const handleCancelJoinCircle = () => {
    setJoinCircleModal({ isOpen: false, circleId: null, circleName: '' });
  };

  const handleOpenLeaveCircleModal = (circleId, circleName) => {
    setLeaveCircleModal({ isOpen: true, circleId, circleName });
  };

  const handleConfirmLeaveCircle = async () => {
    if (!leaveCircleModal.circleId) return;
    setLeavingCircle(true);
    try {
      const response = await apiService.leaveCircle(leaveCircleModal.circleId);
      if (response && response.success) {
        const normalizedId = normalizeCircleId(leaveCircleModal.circleId);
        setJoinedCircles(prev => {
          const updated = new Set(prev);
          updated.delete(normalizedId);
          return updated;
        });
        showToast('You left the healing circle.', 'success');
        setLeaveCircleModal({ isOpen: false, circleId: null, circleName: '' });
        fetchCommunityData();
      } else {
        showToast(response?.message || 'Failed to leave circle', 'error');
      }
    } catch (error) {
      console.error('Error leaving circle:', error);
      showToast('An unexpected error occurred.', 'error');
    } finally {
      setLeavingCircle(false);
    }
  };

  const handleCancelLeaveCircle = () => {
    setLeaveCircleModal({ isOpen: false, circleId: null, circleName: '' });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSharePost = async () => {
    if (!newPost.trim() && !selectedImage) return;

    // Check free tier community trial limit (1-2 posts max for free users)
    const normalizedTier = getCurrentTierLevel();
    
    if (normalizedTier === 'free') {
      const communityTrialUsed = parseInt(localStorage.getItem('communityTrialUsed') || '0', 10);
      
      if (communityTrialUsed >= 2) {
        showToast('Free tier users can share up to 2 posts. Upgrade to Plus for unlimited sharing!', 'error');
        setShowPricingModal(true);
        return;
      }
    }

    try {
      setIsUploading(true);
      // Prepend mood to content if selected
      const contentToShare = selectedMood
        ? `${selectedMood.emoji} I'm feeling ${selectedMood.label}: ${newPost}`
        : newPost;

      const response = await apiService.createCommunityPost(contentToShare, selectedImage);

      if (response && response.success) {
        // Track trial usage for free users
        if (normalizedTier === 'free') {
          const communityTrialUsed = parseInt(localStorage.getItem('communityTrialUsed') || '0', 10);
          localStorage.setItem('communityTrialUsed', String(communityTrialUsed + 1));
        }

        // Add new post to the top of the feed and ensure no duplicates
        const postData = {
          ...response.data,
          author: response.data.author || response.data.Author,
          postId: response.data.postId || response.data.id || response.data.Id // Normalize ID
        };

        setPosts(prev => getUniquePosts([postData, ...prev]));

        setNewPost('');
        setSelectedImage(null);
        setSelectedMood(null);
        setTotalPostCount(prev => prev + 1);
      } else {
        const errorMsg = response?.message || 'Failed to share post';
        alert(`Could not post: ${errorMsg}`);
      }
    } catch (error) {
      console.error('Error in handleSharePost:', error);
      alert('An unexpected error occurred while posting.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleLike = async (postId) => {
    const response = await apiService.toggleCommunityLike(postId);
    if (response && response.success) {
      setPosts(prev => prev.map(p =>
        getPostUniqueId(p) === postId
          ? { ...p, likeCount: response.data.likeCount, isLikedByMe: response.data.isLiked }
          : p
      ));
    }
  };

  const handleComment = async (postId) => {
    if (expandedComments[postId]) {
      const newExpanded = { ...expandedComments };
      delete newExpanded[postId];
      setExpandedComments(newExpanded);
      return;
    }

    setExpandedComments(prev => ({
      ...prev,
      [postId]: { comments: [], loading: true, page: 1 }
    }));

    const response = await apiService.getCommunityComments(postId);
    if (response && response.success) {
      setExpandedComments(prev => ({
        ...prev,
        [postId]: {
          comments: response.data.comments,
          loading: false,
          page: 1,
          totalPages: response.data.totalPages
        }
      }));
    } else {
      setExpandedComments(prev => ({
        ...prev,
        [postId]: { ...prev[postId], loading: false }
      }));
    }
  };

  const handleAddComment = async (postId) => {
    const text = commentTexts[postId];
    if (!text || !text.trim()) return;

    const response = await apiService.addCommunityComment(postId, text);
    if (response && response.success) {
      if (expandedComments[postId]) {
        setExpandedComments(prev => ({
          ...prev,
          [postId]: {
            ...prev[postId],
            comments: [response.data, ...prev[postId].comments]
          }
        }));
      }

      setPosts(prev => prev.map(p =>
        getPostUniqueId(p) === postId ? { ...p, commentCount: response.data.commentCount } : p
      ));

      setCommentTexts(prev => ({ ...prev, [postId]: '' }));
    }
  };

  // --- Edit, Delete, Report Handlers ---
  const handleEditPost = async (postId) => {
    if (!editContent.trim()) return;
    const response = await apiService.editPost(postId, editContent);
    if (response && response.success) {
      setPosts(prev => prev.map(p =>
        getPostUniqueId(p) === postId ? { ...p, content: editContent } : p
      ));
      setEditingPostId(null);
      setEditContent('');
    } else {
      alert(response?.message || 'Failed to edit post');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    const response = await apiService.deletePost(postId);
    if (response && response.success) {
      setPosts(prev => prev.filter(p => getPostUniqueId(p) !== postId));
    } else {
      alert(response?.message || 'Failed to delete post');
    }
  };

  const handleEditComment = async (postId, commentId) => {
    if (!editContent.trim()) return;
    const response = await apiService.editComment(commentId, editContent);
    if (response && response.success) {
      setExpandedComments(prev => ({
        ...prev,
        [postId]: {
          ...prev[postId],
          comments: prev[postId].comments.map(c =>
            c.commentId === commentId ? { ...c, content: editContent } : c
          )
        }
      }));
      setEditingCommentId(null);
      setEditContent('');
    } else {
      alert(response?.message || 'Failed to edit comment');
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;
    const response = await apiService.deleteComment(commentId);
    if (response && response.success) {
      setExpandedComments(prev => ({
        ...prev,
        [postId]: {
          ...prev[postId],
          comments: prev[postId].comments.filter(c => c.commentId !== commentId)
        }
      }));
      setPosts(prev => prev.map(p =>
        getPostUniqueId(p) === postId ? { ...p, commentCount: Math.max(0, p.commentCount - 1) } : p
      ));
    } else {
      alert(response?.message || 'Failed to delete comment');
    }
  };

  const handleAddReply = async (postId, parentCommentId) => {
    const text = replyTexts[parentCommentId];
    if (!text || !text.trim()) return;

    const response = await apiService.addCommunityComment(postId, text, parentCommentId);
    if (response && response.success) {
      if (expandedComments[postId]) {
        setExpandedComments(prev => ({
          ...prev,
          [postId]: {
            ...prev[postId],
            comments: [...prev[postId].comments, response.data]
          }
        }));
      }

      setPosts(prev => prev.map(p =>
        getPostUniqueId(p) === postId ? { ...p, commentCount: response.data.commentCount } : p
      ));

      setReplyTexts(prev => ({ ...prev, [parentCommentId]: '' }));
      setReplyingToId(null);
    } else {
      alert(response?.message || 'Failed to add reply');
    }
  };

  const handleReportContent = async () => {
    if (!reportReason.trim()) {
      alert("Please provide a reason for reporting.");
      return;
    }
    const { postId, commentId } = reportModal;
    const response = await apiService.reportContent(postId, commentId, reportReason);
    if (response && response.success) {
      alert("Report submitted successfully. We will review it shortly.");
      setReportModal({ isOpen: false, postId: null, commentId: null });
      setReportReason('');
    } else {
      alert(response?.message || 'Failed to submit report');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 font-['Outfit',sans-serif] selection:bg-purple-100 selection:text-purple-900 pb-20 relative">
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          {/* Subtle Background Glow */}
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-purple-100/30 blur-[120px] rounded-full"></div>
          <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-indigo-100/20 blur-[100px] rounded-full"></div>
        </div>

        {/* Subtle Noise Texture Overlay */}
        <div className="fixed inset-0 z-[1] opacity-[0.03] pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }}></div>

        {/* Top Navigation Bar */}
        <Navbar currentPage="community" onUpgrade={handleUpgrade} />

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
          {/* Community Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-12"
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">
              Community
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl leading-relaxed">
              Connect with fellow spiritual companions on their HoundHeart journey
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-20"
          >
            {[
              { label: 'Active Members', value: stats.activeMembers, icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', color: 'bg-[#9333ea]' },
              { label: 'Stories Shared', value: stats.storiesShared, icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z', color: 'bg-[#d9018c]' },
              { label: 'Healing Circles', value: stats.healingCircles, icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z', color: 'bg-[#ff6b00]' },
              { label: 'Avg. Bond Growth', value: stats.avgBondGrowth, icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6', color: 'bg-[#00b368]' }
            ].map((stat, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                className="relative group"
              >
                <div className={`relative ${stat.color} rounded-[1.5rem] p-6 shadow-lg hover:shadow-xl transition-all duration-300 text-white flex items-center gap-5 border border-white/10`}>
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={stat.icon} />
                    </svg>
                  </div>
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-[0.1em] opacity-80 mb-1">{stat.label}</div>
                    <div className="text-3xl font-black tracking-tight leading-none">
                      {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Healing Circles Section */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6 mb-12"
          >
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Upcoming Healing Circles</h2>
            {loadingCircles ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="bg-white/50 rounded-[1.5rem] p-6 animate-pulse border border-gray-100">
                    <div className="h-6 bg-gray-200 rounded-md mb-4 w-3/4"></div>
                    <div className="h-4 bg-gray-100 rounded-md mb-3"></div>
                    <div className="h-4 bg-gray-100 rounded-md mb-6 w-1/2"></div>
                    <div className="h-10 bg-purple-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : circlesData.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {circlesData.map((circle) => {
                  const circleDate = circle.time ? new Date(circle.time) : null;
                  const isUpcoming = circleDate && circleDate > new Date();
                  const isJoined = joinedCircles.has(normalizeCircleId(circle.id));
                  
                  return (
                    <motion.div
                      key={circle.id}
                      variants={itemVariants}
                      whileHover={{ y: -8, scale: 1.02 }}
                      className="relative group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-indigo-500/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                      <div className="relative bg-white rounded-[1.5rem] p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                        {/* Circle Header */}
                        <div className="mb-4">
                          {isJoined && (
                            <div className="flex justify-end mb-3">
                              <button
                                onClick={() => handleOpenLeaveCircleModal(circle.id, circle.title)}
                                className="text-xs font-bold uppercase tracking-wide text-red-600 bg-red-50 px-3 py-1 rounded-full hover:bg-red-100 transition-colors"
                              >
                                Leave
                              </button>
                            </div>
                          )}
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{circle.title}</h3>
                              {circle.description && (
                                <p className="text-sm text-gray-600 line-clamp-2 mb-3">{circle.description}</p>
                              )}
                            </div>
                            {circle.isPremium && (
                              <div className="ml-2 px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full whitespace-nowrap">Premium</div>
                            )}
                          </div>
                        </div>

                        {/* Circle Details */}
                        <div className="space-y-2 mb-4 flex-1">
                          {circleDate && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span>{circleDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                          )}
                          {circleDate && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>{circleDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <span>{circle.participantsCount || 0} / {circle.maxParticipants || 100} joined</span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-4">
                          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300"
                              style={{ width: `${((circle.participantsCount || 0) / (circle.maxParticipants || 100)) * 100}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Join Button */}
                        {isJoined ? (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            disabled
                            className="w-full py-3 px-4 bg-green-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-green-500/20 uppercase tracking-wide flex items-center justify-center gap-2 cursor-not-allowed opacity-90"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Already Joined
                          </motion.button>
                        ) : (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleOpenJoinCircleModal(circle.id, circle.title)}
                            className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-purple-500/20 uppercase tracking-wide"
                          >
                            Join Circle
                          </motion.button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white/50 backdrop-blur-sm rounded-[2rem] p-12 text-center border border-gray-100">
                <div className="text-5xl mb-4">🕉️</div>
                <p className="text-gray-600 font-medium">No healing circles available yet. Check back soon!</p>
              </div>
            )}
          </motion.div>
          <motion.div variants={itemVariants} className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 mt-12 mb-12 relative z-10">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-8">
              <div className="flex-1 relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400 group-focus-within:text-purple-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && fetchPosts()}
                  placeholder="Search moments, stories, wisdom..."
                  className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-purple-500/10 focus:bg-white focus:border-purple-200 transition-all outline-none text-[15px] font-medium shadow-none placeholder:text-gray-400"
                />
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowSortMenu(!showSortMenu)}
                  className="h-full flex items-center space-x-3 px-8 py-4 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all font-bold text-gray-700 shadow-none"
                >
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  <span className="text-sm">{sortBy === 'newest' ? 'Newest First' : sortBy === 'top' ? 'Trending' : 'Oldest'}</span>
                </button>

                <AnimatePresence>
                  {showSortMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-20 py-2"
                    >
                      {[
                        { id: 'newest', label: 'Newest Posts' },
                        { id: 'top', label: 'Top Liked' },
                        { id: 'oldest', label: 'Oldest Posts' }
                      ].map(option => (
                        <button
                          key={option.id}
                          onClick={() => {
                            setSortBy(option.id);
                            setShowSortMenu(false);
                          }}
                          className={`w-full text-left px-5 py-3 text-sm font-bold transition-colors ${sortBy === option.id ? 'bg-purple-50 text-purple-600' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 px-2">
              {['All Posts', 'Healing', 'Rituals', 'Success Stories', 'Questions'].map((cat, i) => (
                <motion.button
                  key={i}
                  whileHover={{ y: -4, scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-8 py-3 rounded-full text-[13px] font-bold uppercase tracking-wider transition-all duration-300 relative overflow-hidden group/cat ${selectedCategory === cat
                    ? 'text-white shadow-md'
                    : 'bg-gray-100 text-gray-500 hover:text-purple-600 hover:bg-gray-200'
                    }`}
                >
                  {selectedCategory === cat && (
                    <motion.div
                      layoutId="activeCategory"
                      className="absolute inset-0 bg-purple-600 z-0"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10">{cat}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Main Content Area */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-24"
          >
            {/* Redundant Tabs Removed */}

            <div className="w-full space-y-16">
              {/* Share Your Journey Box */}
              <div className={`transition-all duration-700 z-[40] ${isSticky ? 'sticky top-24' : 'relative'}`}>
                <motion.div
                  variants={itemVariants}
                  className="relative group h-full"
                >
                  <div className="relative bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-sm overflow-hidden">
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black text-gray-900 tracking-tight flex items-center">
                          <span className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mr-4 shadow-inner">
                            <span className="animate-pulse text-xl">✨</span>
                          </span>
                          Share Your Divine Moment
                        </h3>
                      </div>

                      <div className="space-y-8">
                        <div className="relative group/textarea">
                          <textarea
                            value={newPost}
                            onChange={(e) => setNewPost(e.target.value)}
                            placeholder="What beautiful miracle did you encounter today?"
                            className="w-full p-8 bg-gray-50 border border-gray-100 rounded-[2rem] resize-none focus:ring-2 focus:ring-purple-500/10 focus:bg-white transition-all text-lg text-gray-800 placeholder:text-gray-400 font-medium tracking-tight"
                            rows="3"
                          />
                        </div>

                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                          {[
                            { emoji: '💖', label: 'Grateful' },
                            { emoji: '✨', label: 'Peaceful' },
                            { emoji: '😇', label: 'Energized' },
                            { emoji: '🙏', label: 'Blessed' },
                            { emoji: '🤝', label: 'Connected' }
                          ].map((mood, i) => (
                            <motion.button
                              key={i}
                              whileHover={{ y: -5, scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setSelectedMood(selectedMood?.label === mood.label ? null : mood)}
                              className={`flex flex-col items-center justify-center p-4 rounded-3xl transition-all border-2 ${selectedMood?.label === mood.label
                                ? 'bg-white border-purple-500 shadow-lg shadow-purple-500/10'
                                : 'bg-white border-transparent hover:bg-gray-50'}`}
                            >
                              <span className="text-2xl mb-2">{mood.emoji}</span>
                              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{mood.label}</span>
                            </motion.button>
                          ))}
                        </div>

                        <div className="flex items-center justify-between pt-8">
                          <div className="flex items-center space-x-4">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              onClick={() => document.getElementById('photo-upload').click()}
                              className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100 text-gray-400 hover:text-purple-600 hover:bg-white transition-all"
                            >
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </motion.button>
                            <input id="photo-upload" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100 text-gray-400 hover:text-indigo-600 hover:bg-white transition-all"
                            >
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </motion.button>
                          </div>

                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleSharePost}
                            disabled={isUploading}
                            className="px-10 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-purple-500/20 transition-all disabled:opacity-50"
                          >
                            {isUploading ? 'Publishing...' : 'Publish Journey'}
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Dynamic Feed Posts Section */}
            <div className="custom-scrollbar overflow-y-auto pr-4" style={{ maxHeight: '900px' }}>
              {loadingPosts && posts.length === 0 ? (
                <div className="space-y-8">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="premium-card rounded-[20px] overflow-hidden bg-white/50 backdrop-blur-sm border border-white/40 p-6 animate-pulse">
                      <div className="flex items-center space-x-4 mb-6">
                        <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                        <div className="space-y-2">
                          <div className="w-32 h-4 bg-gray-200 rounded-md"></div>
                          <div className="w-20 h-2 bg-gray-100 rounded-md"></div>
                        </div>
                      </div>
                      <div className="space-y-3 mb-6">
                        <div className="w-full h-4 bg-gray-200 rounded-md"></div>
                        <div className="w-[90%] h-4 bg-gray-200 rounded-md"></div>
                        <div className="w-[40%] h-4 bg-gray-100 rounded-md"></div>
                      </div>
                      <div className="w-full aspect-[16/9] bg-gray-200 rounded-2xl mb-6"></div>
                      <div className="flex space-x-6">
                        <div className="w-16 h-6 bg-gray-100 rounded-full"></div>
                        <div className="w-16 h-6 bg-gray-100 rounded-full"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredPosts.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="premium-card rounded-[3rem] p-24 text-center border-white/40 shadow-inner bg-white/30 backdrop-blur-3xl"
                >
                  <div className="text-7xl mb-10 animate-bounce">🌿</div>
                  <h3 className="text-3xl text-gray-900 font-black tracking-tighter mb-4">No moments shared yet</h3>
                  <p className="text-lg text-gray-500 font-bold max-w-md mx-auto mb-12 leading-relaxed">Be the first to inspire the community with your story of connection and spirituality.</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="bg-[#9333ea] text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-purple-200"
                  >
                    Share Your Journey
                  </motion.button>
                </motion.div>
              ) : (
                <>
                  <div className="space-y-8 pb-12">
                    <AnimatePresence mode="popLayout">
                      {filteredPosts.map((post) => (
                        <motion.div
                          key={getPostUniqueId(post)}
                          layout
                          initial={{ opacity: 0, y: 40, scale: 0.95 }}
                          whileInView={{ opacity: 1, y: 0, scale: 1 }}
                          viewport={{ once: true }}
                          whileHover={{ y: -12, scale: 1.01 }}
                          className="relative group/post mb-12"
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-indigo-500/5 blur-3xl opacity-0 group-hover/post:opacity-100 transition-opacity duration-1000"></div>

                          <div className="relative bg-white/10 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden border border-white/20 shadow-[0_20px_80px_-15px_rgba(0,0,0,0.1)] hover:shadow-[0_40px_100px_-20px_rgba(147,51,234,0.3)] transition-all duration-700">
                            {/* Inner Glass Highlight */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none"></div>
                            {/* Header section */}
                            <div className="p-6 flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center overflow-hidden ring-2 ring-white shadow-sm">
                                  {post.author?.profilePhoto || post.Author?.profilePhoto ? (
                                    <img src={post.author?.profilePhoto || post.Author?.profilePhoto} alt="User" className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-purple-600 font-bold text-base">{(post.author?.fullName || post.Author?.fullName || '?').charAt(0)}</span>
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <span className="font-bold text-gray-900 leading-none tracking-tight text-[15.5px] hover:text-purple-600 transition-colors cursor-pointer">{post.author?.fullName || post.Author?.fullName || 'Guardian'}</span>
                                    <div className="relative group/badge">
                                      <span className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 text-purple-600 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-purple-200/30 shadow-[0_0_15px_rgba(147,51,234,0.1)]">Premium</span>
                                      <div className="absolute inset-0 bg-purple-400 blur-sm opacity-0 group-hover/badge:opacity-20 transition-opacity rounded-full"></div>
                                    </div>
                                  </div>
                                  <div className="text-[10px] text-gray-400 mt-1 flex items-center space-x-2 uppercase tracking-widest font-medium">
                                    <span>{new Date(post.createdOn).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Post Options Menu */}
                              <div className="relative" data-post-menu={post.postId}>
                                <button
                                  onClick={() => setShowPostMenu(showPostMenu === post.postId ? null : post.postId)}
                                  className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
                                >
                                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                  </svg>
                                </button>

                                <AnimatePresence>
                                  {showPostMenu === post.postId && (
                                    <motion.div
                                      initial={{ opacity: 0, scale: 0.95 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      exit={{ opacity: 0, scale: 0.95 }}
                                      className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-20"
                                    >
                                      <div className="py-1">
                                        {currentUserId === post.userId ? (
                                          <>
                                            <button
                                              onClick={() => {
                                                setEditingPostId(post.postId);
                                                setEditContent(post.content);
                                                setShowPostMenu(null);
                                              }}
                                              className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-purple-600 flex items-center space-x-2"
                                            >
                                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                              <span>Edit Post</span>
                                            </button>
                                            <button
                                              onClick={() => {
                                                handleDeletePost(post.postId);
                                                setShowPostMenu(null);
                                              }}
                                              className="w-full text-left px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 flex items-center space-x-2"
                                            >
                                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                              <span>Delete Post</span>
                                            </button>
                                          </>
                                        ) : (
                                          <button
                                            onClick={() => {
                                              setReportModal({ isOpen: true, postId: post.postId, commentId: null });
                                              setShowPostMenu(null);
                                            }}
                                            className="w-full text-left px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 flex items-center space-x-2"
                                          >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                            <span>Report Post</span>
                                          </button>
                                        )}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>

                            <div className="px-8 py-4">
                              {editingPostId === post.postId ? (
                                <div className="mb-6 space-y-4">
                                  <textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    className="w-full p-6 bg-white/40 backdrop-blur-md border border-purple-200/50 rounded-2xl resize-none focus:ring-4 focus:ring-purple-500/10 focus:bg-white transition-all text-gray-700 font-medium text-lg leading-relaxed"
                                    rows="3"
                                  />
                                  <div className="flex justify-end space-x-4">
                                    <button
                                      onClick={() => { setEditingPostId(null); setEditContent(''); }}
                                      className="px-6 py-2.5 text-sm font-black text-gray-400 hover:text-gray-600 transition-all uppercase tracking-widest"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      onClick={() => handleEditPost(post.postId)}
                                      className="px-8 py-2.5 text-sm font-black text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-lg hover:shadow-purple-200/50 transition-all uppercase tracking-widest"
                                    >
                                      Save Divine Changes
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-gray-900 text-lg leading-[1.8] mb-6 font-medium tracking-tight">
                                  <span className="font-black text-transparent bg-clip-text bg-gradient-to-br from-purple-600 to-indigo-600 mr-2 opacity-60 text-2xl leading-none">@</span>
                                  {post.content}
                                </div>
                              )}
                            </div>

                            {post.imageUrl && (
                              <div className="w-full aspect-square bg-gray-100 relative overflow-hidden ring-1 ring-black/5">
                                <img
                                  src={post.imageUrl}
                                  alt="Journey Moment"
                                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                                />
                              </div>
                            )}

                            <div className="flex flex-wrap gap-3 px-8 py-6 border-t border-white/10 bg-black/[0.02]">
                              {computePostTags(post).map((tag, i) => (
                                <span
                                  key={i}
                                  className="px-4 py-1.5 bg-white/40 backdrop-blur-md rounded-full text-[10px] font-black text-gray-500 uppercase tracking-widest border border-white/60 hover:bg-white hover:text-purple-600 transition-all cursor-default shadow-sm"
                                >
                                  # {tag}
                                </span>
                              ))}
                            </div>

                            {/* Engagement Section */}
                            <div className="px-8 py-6 flex items-center justify-between border-t border-white/10 bg-black/5 backdrop-blur-3xl">
                              <div className="flex items-center space-x-12">
                                <motion.button
                                  whileHover={{ scale: 1.25 }}
                                  whileTap={{ scale: 0.8, rotate: -15 }}
                                  onClick={() => handleLike(post.postId)}
                                  className={`flex items-center space-x-3 transition-all ${post.isLikedByMe ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                                >
                                  <svg className={`w-8 h-8 transition-all duration-500 ${post.isLikedByMe ? 'fill-current filter drop-shadow-[0_0_12px_rgba(239,68,68,0.7)]' : 'fill-none'}`} stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                  </svg>
                                  <span className="text-sm font-black tracking-tighter">{post.likeCount}</span>
                                </motion.button>

                                <motion.button
                                  whileHover={{ scale: 1.25 }}
                                  whileTap={{ scale: 0.8 }}
                                  onClick={() => handleComment(post.postId)}
                                  className={`flex items-center space-x-3 transition-all ${expandedComments[post.postId] ? 'text-indigo-600' : 'text-gray-400 hover:text-indigo-600'}`}
                                >
                                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                  </svg>
                                  <span className="text-sm font-black tracking-tighter">{post.commentCount}</span>
                                </motion.button>
                              </div>

                              <motion.button
                                whileHover={{ rotate: 180, scale: 1.2, color: '#f43f5e' }}
                                onClick={() => setReportModal({ isOpen: true, postId: post.postId, commentId: null })}
                                className="text-gray-300 transition-all p-2"
                              >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                              </motion.button>
                            </div>

                            <AnimatePresence>
                              {expandedComments[post.postId] && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="px-6 pb-8 pt-8 border-t border-gray-100 bg-[#fafafa]"
                                >
                                  {/* Comment Section Header */}
                                  <div className="flex items-center justify-between mb-8 px-2">
                                    <div className="flex items-center space-x-2">
                                      <h4 className="text-[17px] font-bold text-gray-900">Comments</h4>
                                      <span className="bg-[#ff6b00] text-white px-2.5 py-0.5 rounded-full text-[11px] font-bold">{post.commentCount}</span>
                                    </div>
                                    <div className="flex items-center space-x-1.5 text-[13px] font-semibold text-gray-500 hover:text-[#ff6b00] transition-colors cursor-pointer">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                                      </svg>
                                      <span>Most Recent</span>
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    </div>
                                  </div>

                                  {/* Rich Comment Input */}
                                  <div className="mb-10 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-[#ff6b00]/10 focus-within:border-[#ff6b00]/30 transition-all">
                                    <textarea
                                      value={commentTexts[post.postId] || ''}
                                      onChange={(e) => setCommentTexts(prev => ({ ...prev, [post.postId]: e.target.value }))}
                                      placeholder="Add comment..."
                                      className="w-full px-5 py-4 text-[15px] text-gray-800 placeholder:text-gray-400 focus:outline-none resize-none min-h-[100px]"
                                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleAddComment(post.postId))}
                                    />
                                    <div className="px-4 py-3 bg-[#fcfcfc] border-t border-gray-100 flex items-center justify-between">
                                      <div className="flex items-center space-x-4">
                                        {['B', 'I', 'U'].map((tool) => (
                                          <button key={tool} className="text-gray-400 hover:text-gray-600 font-serif text-sm font-bold w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 transition-all">{tool}</button>
                                        ))}
                                        <div className="w-[1px] h-4 bg-gray-200 mx-1"></div>
                                        {[
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.414a4 4 0 00-5.656-5.656l-6.415 6.415a6 6 0 108.486 8.486L20.5 13" /></svg>,
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
                                          <span className="text-gray-400 hover:text-gray-600 text-sm font-bold cursor-pointer">@</span>
                                        ].map((icon, i) => (
                                          <button key={i} className="text-gray-400 hover:text-gray-600 w-6 h-6 flex items-center justify-center transition-all">{icon}</button>
                                        ))}
                                      </div>
                                      <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleAddComment(post.postId)}
                                        className="bg-[#ff6b00] text-white px-7 py-2.5 rounded-full text-[14px] font-bold shadow-md hover:bg-[#e66000] transition-all flex items-center space-x-2"
                                      >
                                        <span>Submit</span>
                                      </motion.button>
                                    </div>
                                  </div>

                                  <div className="space-y-10 px-2 max-h-[600px] overflow-y-auto custom-scrollbar pr-4">
                                    {(() => {
                                      const postComments = (expandedComments[post.postId]?.comments || []);
                                      const topLevelComments = postComments.filter(c => !c.parentCommentId);

                                      return topLevelComments.map((comment) => {
                                        const replies = postComments.filter(r => r.parentCommentId === comment.commentId);
                                        return (
                                          <div key={comment.commentId} className="relative">
                                            {/* Main Comment */}
                                            <div className="flex space-x-4 group/comment">
                                              {/* Left Profile */}
                                              <div className="flex-shrink-0 relative z-10">
                                                <div className="w-11 h-11 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden border border-gray-100 shadow-sm">
                                                  {comment.author?.profilePhoto ? (
                                                    <img src={comment.author.profilePhoto} alt="User" className="w-full h-full object-cover" />
                                                  ) : (
                                                    <span className="text-gray-500 text-base font-bold">{(comment.author?.authorName || '?').charAt(0)}</span>
                                                  )}
                                                </div>
                                                {/* Vertical Connector Line */}
                                                {replies.length > 0 && (
                                                  <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[2px] h-[calc(100%-8px)] bg-gray-100 rounded-full"></div>
                                                )}
                                              </div>

                                              {/* Side content */}
                                              <div className="flex-1 space-y-1.5">
                                                <div className="flex items-center space-x-2.5 mb-1 text-[14px]">
                                                  <span className="font-bold text-gray-900">{comment.author?.fullName || comment.author?.authorName || 'Guardian'}</span>
                                                  <span className="text-gray-400 font-medium text-[13px]">{formatDistanceToNow(new Date(comment.createdOn), { addSuffix: true })}</span>
                                                </div>
                                                <div className="text-[15px] text-gray-700 leading-relaxed font-medium mb-3">{comment.content}</div>

                                                {/* Engagement Row */}
                                                <div className="flex items-center space-x-5 text-[13px] font-bold text-gray-500">
                                                  <button onClick={() => setReplyingToId(comment.commentId)} className="flex items-center space-x-1.5 hover:text-[#ff6b00] transition-colors">
                                                    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                                                    <span>Reply</span>
                                                  </button>
                                                  <div className="relative">
                                                    <button onClick={() => setShowCommentMenu(comment.commentId)} className="hover:text-gray-800 transition-all text-lg leading-none transform translate-y-[-2px]">···</button>
                                                    <AnimatePresence>
                                                      {showCommentMenu === comment.commentId && (
                                                        <motion.div
                                                          initial={{ opacity: 0, scale: 0.95 }}
                                                          animate={{ opacity: 1, scale: 1 }}
                                                          exit={{ opacity: 0, scale: 0.95 }}
                                                          className="absolute left-0 mt-2 w-36 bg-white rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden z-20 py-1"
                                                        >
                                                          {currentUserId === comment.userId ? (
                                                            <>
                                                              <button onClick={() => { setEditingCommentId(comment.commentId); setEditContent(comment.content); setShowCommentMenu(null); }} className="w-full text-left px-4 py-2 text-[12px] font-bold text-gray-700 hover:bg-gray-50 flex items-center space-x-2 transition-colors">
                                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                                <span>Edit</span>
                                                              </button>
                                                              <button onClick={() => { handleDeleteComment(post.postId, comment.commentId); setShowCommentMenu(null); }} className="w-full text-left px-4 py-2 text-[12px] font-bold text-red-600 hover:bg-red-50 flex items-center space-x-2 transition-colors">
                                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                                <span>Delete</span>
                                                              </button>
                                                            </>
                                                          ) : (
                                                            <button onClick={() => { setReportModal({ isOpen: true, postId: post.postId, commentId: comment.commentId }); setShowCommentMenu(null); }} className="w-full text-left px-4 py-2 text-[12px] font-bold text-red-600 hover:bg-red-50 flex items-center space-x-2 transition-colors">
                                                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                                              <span>Report</span>
                                                            </button>
                                                          )}
                                                        </motion.div>
                                                      )}
                                                    </AnimatePresence>
                                                  </div>
                                                </div>

                                                {/* Inline Reply Form */}
                                                <AnimatePresence>
                                                  {replyingToId === comment.commentId && (
                                                    <motion.div
                                                      initial={{ opacity: 0, height: 0 }}
                                                      animate={{ opacity: 1, height: 'auto' }}
                                                      exit={{ opacity: 0, height: 0 }}
                                                      className="mt-4 bg-white rounded-xl border border-gray-100 p-3 shadow-sm"
                                                    >
                                                      <textarea
                                                        value={replyTexts[comment.commentId] || ''}
                                                        onChange={(e) => setReplyTexts(prev => ({ ...prev, [comment.commentId]: e.target.value }))}
                                                        placeholder="Write a souls-inspired reply..."
                                                        className="w-full p-3 bg-gray-50/50 border-none rounded-lg text-[14px] font-medium focus:ring-0 focus:bg-white outline-none transition-all resize-none min-h-[80px]"
                                                        autoFocus
                                                      />
                                                      <div className="flex justify-end space-x-3 mt-2">
                                                        <button onClick={() => setReplyingToId(null)} className="text-[12px] font-bold text-gray-400 hover:text-gray-600 px-3 py-1.5 transition-all">Cancel</button>
                                                        <button onClick={() => handleAddReply(post.postId, comment.commentId)} className="bg-[#ff6b00] text-white px-5 py-1.5 rounded-full text-[12px] font-bold hover:bg-[#e66000] shadow-sm transition-all">Submit</button>
                                                      </div>
                                                    </motion.div>
                                                  )}
                                                </AnimatePresence>

                                                {/* Replies Section */}
                                                {replies.length > 0 && (
                                                  <div className="mt-8 space-y-8">
                                                    {replies.map(reply => (
                                                      <div key={reply.commentId} className="flex space-x-3 group/reply relative">
                                                        {/* L-shaped connection line */}
                                                        <div className="absolute -left-7 top-0 w-6 h-5 border-l-[2px] border-b-[2px] border-gray-100 rounded-bl-xl"></div>

                                                        <div className="flex-shrink-0 relative z-10 pt-1">
                                                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden border border-gray-100 shadow-sm">
                                                            {reply.author?.profilePhoto ? (
                                                              <img src={reply.author.profilePhoto} alt="User" className="w-full h-full object-cover" />
                                                            ) : (
                                                              <span className="text-gray-500 text-[13px] font-black">{(reply.author?.authorName || '?').charAt(0)}</span>
                                                            )}
                                                          </div>
                                                        </div>
                                                        <div className="flex-1 space-y-1">
                                                          <div className="flex items-center space-x-2.5 text-[13px]">
                                                            <span className="font-bold text-gray-900">{reply.author?.fullName || reply.author?.authorName || 'Soul Mate'}</span>
                                                            <span className="text-gray-400 font-medium">{formatDistanceToNow(new Date(reply.createdOn), { addSuffix: true })}</span>
                                                          </div>
                                                          <p className="text-[14px] text-gray-700 leading-normal font-medium mb-2">{reply.content}</p>

                                                          <div className="flex items-center space-x-5 text-[11px] font-bold text-gray-500">
                                                            <button onClick={() => setReplyingToId(reply.commentId)} className="hover:text-[#ff6b00] transition-colors">Reply</button>
                                                            <div className="relative">
                                                              <button onClick={() => setShowCommentMenu(reply.commentId)} className="hover:text-gray-800 transition-all text-base transform translate-y-[-1.5px]">···</button>
                                                              <AnimatePresence>
                                                                {showCommentMenu === reply.commentId && (
                                                                  <motion.div
                                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                                    animate={{ opacity: 1, scale: 1 }}
                                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                                    className="absolute left-0 mt-1 w-32 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-20 py-1"
                                                                  >
                                                                    {currentUserId === reply.userId ? (
                                                                      <>
                                                                        <button onClick={() => { setEditingCommentId(reply.commentId); setEditContent(reply.content); setShowCommentMenu(null); }} className="w-full text-left px-3 py-1.5 text-[11px] font-bold text-gray-700 hover:bg-gray-50 flex items-center space-x-2 transition-colors border-b border-gray-50">
                                                                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                                          <span>Edit</span>
                                                                        </button>
                                                                        <button onClick={() => { handleDeleteComment(post.postId, reply.commentId); setShowCommentMenu(null); }} className="w-full text-left px-3 py-1.5 text-[11px] font-bold text-red-600 hover:bg-red-50 flex items-center space-x-2 transition-colors">
                                                                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                                          <span>Delete</span>
                                                                        </button>
                                                                      </>
                                                                    ) : (
                                                                      <button onClick={() => { setReportModal({ isOpen: true, postId: post.postId, commentId: reply.commentId }); setShowCommentMenu(null); }} className="w-full text-left px-3 py-1.5 text-[11px] font-bold text-red-600 hover:bg-red-50 flex items-center space-x-2 transition-colors">
                                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                                                        <span>Report</span>
                                                                      </button>
                                                                    )}
                                                                  </motion.div>
                                                                )}
                                                              </AnimatePresence>
                                                            </div>
                                                          </div>
                                                        </div>
                                                      </div>
                                                    ))}
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })
                                    })()}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* Pagination */}
                  {page < totalPages && (
                    <div className="flex justify-center pt-8 pb-16">
                      <motion.button
                        whileHover={{ scale: 1.05, y: -4 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => fetchPosts(page + 1, true)}
                        disabled={loadingPosts}
                        className="px-10 py-4 rounded-full font-bold text-white bg-gradient-to-r from-[#9333ea] to-indigo-600 uppercase tracking-widest text-[10px] shadow-lg hover:shadow-purple-200 transition-all flex items-center space-x-3"
                      >
                        {loadingPosts ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        ) : (
                          <>
                            <span>Show Older Moments</span>
                            <span className="text-lg">↓</span>
                          </>
                        )}
                      </motion.button>
                    </div>
                  )}
                </>
              )}
            </div >
          </motion.div >
        </div >

        {/* Pricing Modal Overlay */}
        < AnimatePresence >
          {showPricingModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[1000] p-4"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 20, opacity: 0 }}
                className="bg-white rounded-2xl w-full max-w-sm shadow-2xl"
              >
                {/* Compact Modal Header */}
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-4 rounded-t-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">⭐</span>
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
                <div className="px-6 py-5">
                  <p className="text-gray-700 text-center mb-6 font-medium">
                    You've reached your free limit. Upgrade to Premium for unlimited access!
                  </p>

                  {/* Quick Features List */}
                  <div className="bg-purple-50 rounded-lg p-4 mb-6 space-y-2">
                    <div className="flex items-center space-x-2 text-sm text-gray-700">
                      <span className="text-green-500">✓</span>
                      <span>Unlimited community posts & circles</span>
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
                  <div className="bg-gray-50 rounded-lg p-3 mb-6 text-center text-sm">
                    <div className="text-gray-600">Start from</div>
                    <div className="text-2xl font-bold text-purple-600">$19.99/mo</div>
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
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence >

        {/* Report Modal */}
        < AnimatePresence >
          {
            reportModal.isOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-gray-900/60 backdrop-blur-lg flex items-center justify-center z-[1100] p-4"
              >
                <motion.div
                  initial={{ scale: 0.9, y: 20, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0.9, y: 20, opacity: 0 }}
                  className="bg-white rounded-[32px] p-10 max-w-md w-full shadow-2xl relative"
                >
                  <h3 className="text-xl font-bold mb-4">Report Content</h3>
                  <textarea
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    placeholder="Why are you reporting this?"
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl resize-none focus:ring-2 focus:ring-[#9333ea] transition-all mb-6"
                    rows="4"
                  />
                  <div className="flex justify-end space-x-3">
                    <button onClick={() => setReportModal({ isOpen: false, postId: null, commentId: null })} className="px-6 py-2 text-gray-500 font-bold">Cancel</button>
                    <button onClick={handleReportContent} disabled={!reportReason.trim()} className="px-6 py-2 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all">Report</button>
                  </div>
                </motion.div>
              </motion.div>
            )
          }
        </AnimatePresence >

        {/* Join Circle Confirmation Modal */}
        <AnimatePresence>
          {joinCircleModal.isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gray-900/60 backdrop-blur-lg flex items-center justify-center z-[1100] p-4"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 20, opacity: 0 }}
                className="bg-white rounded-[32px] p-10 max-w-md w-full shadow-2xl relative"
              >
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM9 19c-4.35 0-8 1.79-8 4v3h16v-3c0-2.21-3.65-4-8-4z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Join Healing Circle?</h3>
                  <p className="text-gray-600 font-medium">Are you sure you want to join <span className="text-purple-600 font-bold">{joinCircleModal.circleName}</span>?</p>
                </div>
                <div className="flex justify-center gap-3 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCancelJoinCircle}
                    disabled={joiningCircle}
                    className="px-8 py-3 text-gray-700 font-bold rounded-xl border-2 border-gray-200 hover:bg-gray-50 transition-all disabled:opacity-50"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleConfirmJoinCircle}
                    disabled={joiningCircle}
                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 shadow-lg shadow-purple-500/20"
                  >
                    {joiningCircle ? 'Joining...' : 'Yes, Join'}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Leave Circle Confirmation Modal */}
        <AnimatePresence>
          {leaveCircleModal.isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gray-900/60 backdrop-blur-lg flex items-center justify-center z-[1100] p-4"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 20, opacity: 0 }}
                className="bg-white rounded-[32px] p-10 max-w-md w-full shadow-2xl relative"
              >
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Leave Healing Circle?</h3>
                  <p className="text-gray-600 font-medium">Are you sure you want to leave <span className="text-red-600 font-bold">{leaveCircleModal.circleName}</span>?</p>
                </div>
                <div className="flex justify-center gap-3 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCancelLeaveCircle}
                    disabled={leavingCircle}
                    className="px-8 py-3 text-gray-700 font-bold rounded-xl border-2 border-gray-200 hover:bg-gray-50 transition-all disabled:opacity-50"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleConfirmLeaveCircle}
                    disabled={leavingCircle}
                    className="px-8 py-3 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 shadow-lg shadow-red-500/20"
                  >
                    {leavingCircle ? 'Leaving...' : 'Yes, Leave'}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toast Notification */}
        <AnimatePresence>
          {toast.isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, x: 0 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className={`fixed bottom-8 right-8 z-[2000] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 max-w-sm backdrop-blur-lg ${
                toast.type === 'success'
                  ? 'bg-green-500/90 text-white border border-green-400/30'
                  : 'bg-red-500/90 text-white border border-red-400/30'
              }`}
            >
              {toast.type === 'success' ? (
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              <p className="font-semibold text-sm">{toast.message}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Action Button (Mobile) */}
        < motion.button
          whileHover={{ scale: 1.15, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-8 right-8 w-16 h-16 bg-[#9333ea] text-white rounded-full flex items-center justify-center shadow-2xl z-[100] ring-4 ring-white lg:hidden"
        >
          <span className="text-3xl font-light">+</span>
        </motion.button >
      </div >
    </>
  );
};

export default CommunityPage;
