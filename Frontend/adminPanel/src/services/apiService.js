// API Service for Admin Panel Integration
const API_BASE_URL = import.meta.env.VITE_API_URL;

class ApiService {
    async makeRequest(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;

        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        };

        const token = localStorage.getItem('adminToken');
        const authHeaders = {};
        if (token) {
            authHeaders.Authorization = `Bearer ${token}`;
        }

        const finalOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...authHeaders,
                ...(options.headers || {})
            }
        };

        try {
            const response = await fetch(url, finalOptions);

            if (!response.ok) {
                const contentType = response.headers.get('content-type') || '';
                let errorData;
                if (contentType.includes('application/json')) {
                    errorData = await response.json().catch(() => ({}));
                } else {
                    const text = await response.text();
                    errorData = { message: text };
                }
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                return await response.json();
            } else {
                const text = await response.text();
                try {
                    return JSON.parse(text);
                } catch {
                    return { message: text, data: text };
                }
            }
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }

    async login(credentials) {
        console.log('Attempting login with:', credentials.email);
        try {
            const response = await this.makeRequest('/Account/login', {
                method: 'POST',
                body: JSON.stringify({
                    Email: credentials.email,
                    Password: credentials.password
                }),
            });

            if (response?.data) {
                const d = response.data;
                const token = d.Token || d.token;
                const userId = d.UserId || d.userId;
                const roleId = d.RoleId || d.roleId;

                // Check if user is actually an admin (Role ID 1 is usually admin)
                if (roleId !== 1) {
                    // In a real app we would check roles here. 
                    // For now, we'll just store and proceed.
                }

                if (token) localStorage.setItem('adminToken', token);
                if (userId) localStorage.setItem('adminUserId', userId);
                localStorage.setItem('adminUser', JSON.stringify(d));
                localStorage.setItem('isAdminAuthenticated', 'true');
            }

            return response;
        } catch (error) {
            throw error;
        }
    }

    logout() {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUserId');
        localStorage.removeItem('adminUser');
        localStorage.removeItem('isAdminAuthenticated');
    }

    isAuthenticated() {
        return localStorage.getItem('isAdminAuthenticated') === 'true';
    }

    // ─── Sacred Guide Admin APIs ─────────────────────────────

    async getSacredGuideDashboard() {
        return this.makeRequest('/admin/sacredguides/dashboard');
    }

    async getSacredGuideStatus(id) {
        return this.makeRequest(`/admin/sacredguides/${id}/status`);
    }

    async getSacredGuideWaitlist(id, page = 1, pageSize = 10) {
        return this.makeRequest(`/admin/sacredguides/${id}/waitlist?page=${page}&pageSize=${pageSize}`);
    }

    async launchSacredGuide(id) {
        return this.makeRequest(`/admin/sacredguides/${id}/launch`, { method: 'POST' });
    }

    async notifySacredGuideWaitlist(id) {
        return this.makeRequest(`/admin/sacredguides/${id}/notify-waitlist`, { method: 'POST' });
    }

    async createSacredGuide(data) {
        return this.makeRequest('/admin/sacredguides/create', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateSacredGuide(id, data) {
        return this.makeRequest(`/admin/sacredguides/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteSacredGuide(id) {
        return this.makeRequest(`/admin/sacredguides/${id}`, {
            method: 'DELETE',
        });
    }

    async uploadSacredGuide(formData) {
        const url = `${API_BASE_URL}/admin/sacredguides/upload`;
        const token = localStorage.getItem('adminToken');
        const headers = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: formData,
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                // Extract exact error reason from backend response
                const errorMsg = data?.message
                    || data?.errors?.join(', ')
                    || 'Something went wrong. Please check your inputs and try again.';
                throw new Error(errorMsg);
            }

            return data;
        } catch (error) {
            if (error instanceof TypeError && error.message === 'Failed to fetch') {
                throw new Error('Unable to connect to the server. Please check your internet connection.');
            }
            console.error('Upload Error:', error);
            throw error;
        }
    }

    async getAllSacredGuides() {
        return this.makeRequest('/admin/sacredguides/list');
    }

    // ─── Dashboard Admin APIs ───────────────────────────────

    async getDashboardStats(fromDate = null, toDate = null) {
        let query = '/admin/dashboard/stats';
        const params = [];
        
        if (fromDate) {
            params.push(`fromDate=${encodeURIComponent(fromDate.toISOString().split('T')[0])}`);
        }
        
        if (toDate) {
            params.push(`toDate=${encodeURIComponent(toDate.toISOString().split('T')[0])}`);
        }
        
        if (params.length > 0) {
            query += '?' + params.join('&');
        }
        
        return this.makeRequest(query);
    }

    async getCommunityGrowthData(fromDate = null, toDate = null) {
        let query = '/admin/dashboard/community-growth';
        const params = [];
        
        if (fromDate) {
            params.push(`fromDate=${encodeURIComponent(fromDate.toISOString().split('T')[0])}`);
        }
        
        if (toDate) {
            params.push(`toDate=${encodeURIComponent(toDate.toISOString().split('T')[0])}`);
        }
        
        if (params.length > 0) {
            query += '?' + params.join('&');
        }
        
        return this.makeRequest(query);
    }

    async getActivityByTime(fromDate = null, toDate = null) {
        let query = '/admin/dashboard/activity-by-time';
        const params = [];
        
        if (fromDate) {
            params.push(`fromDate=${encodeURIComponent(fromDate.toISOString().split('T')[0])}`);
        }
        
        if (toDate) {
            params.push(`toDate=${encodeURIComponent(toDate.toISOString().split('T')[0])}`);
        }
        
        if (params.length > 0) {
            query += '?' + params.join('&');
        }
        
        return this.makeRequest(query);
    }

    async getTrendingTopics(limit = 4, fromDate = null, toDate = null) {
        let query = `/admin/dashboard/trending-topics?limit=${limit}`;

        if (fromDate) {
            query += `&fromDate=${encodeURIComponent(fromDate.toISOString().split('T')[0])}`;
        }

        if (toDate) {
            query += `&toDate=${encodeURIComponent(toDate.toISOString().split('T')[0])}`;
        }

        return this.makeRequest(query);
    }

    async getRecentActivity(limit = 5) {
        return this.makeRequest(`/admin/dashboard/recent-activity?limit=${limit}`);
    }

    // ─── User Management Admin APIs ──────────────────────────

    async getUserStats() {
        return this.makeRequest('/admin/users/stats');
    }

    async getUsers(params = {}) {
        const { search, status, page = 1, pageSize = 10 } = params;
        let query = `?page=${page}&pageSize=${pageSize}`;
        if (search) query += `&search=${encodeURIComponent(search)}`;
        if (status && status !== 'All Status') query += `&status=${encodeURIComponent(status)}`;

        return this.makeRequest(`/admin/users${query}`);
    }

    async updateUserStatus(userId, status) {
        return this.makeRequest(`/admin/users/${userId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ Status: status }),
        });
    }

    // Fetch user details for profile modal
    async getUserDetails(userId) {
        return this.makeRequest(`/admin/users/${userId}`);
    }

    // ─── Content Moderation Admin APIs ───────────────────────

    async getContentStats() {
        return this.makeRequest('/admin/content/stats');
    }

    async getContentPosts(params = {}) {
        const { search = '', statusFilter = 'All Posts', page = 1, pageSize = 10 } = params;
        const queryParams = new URLSearchParams({
            search,
            statusFilter,
            page: page.toString(),
            pageSize: pageSize.toString()
        });

        return this.makeRequest(`/admin/content/posts?${queryParams}`);
    }

    async updatePostStatus(postId, action) {
        return this.makeRequest(`/admin/content/posts/${postId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ action }),
        });
    }

    async getPostReports(postId) {
        return this.makeRequest(`/admin/content/posts/${postId}/reports`);
    }

    // ─── Reports Management Admin APIs ───────────────────────

    async getReportStats() {
        return this.makeRequest('/admin/reports/stats');
    }

    async getReports(params = {}) {
        const { type = 'All', status = 'All', page = 1, pageSize = 10 } = params;
        const queryParams = new URLSearchParams({
            type,
            status,
            page: page.toString(),
            pageSize: pageSize.toString()
        });

        return this.makeRequest(`/admin/reports?${queryParams}`);
    }

    async getReportDetails(reportId) {
        return this.makeRequest(`/admin/reports/${reportId}`);
    }

    async updateReportStatus(reportId, status) {
        return this.makeRequest(`/admin/reports/${reportId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ Status: status }),
        });
    }

    // ─── Subscription Admin APIs ──────────────────────────────

    async getSubscriptionStats() {
        return this.makeRequest('/AdminSubscription/stats');
    }

    async getAllSubscriptions(status = 'all', page = 1, pageSize = 20) {
        let query = `?page=${page}&pageSize=${pageSize}`;
        if (status && status !== 'all') query += `&status=${encodeURIComponent(status)}`;
        return this.makeRequest(`/AdminSubscription/all${query}`);
    }

    async searchSubscriptions(query) {
        return this.makeRequest(`/AdminSubscription/search?query=${encodeURIComponent(query)}`);
    }

    async syncSubscriptionsFromStripe() {
        return this.makeRequest('/AdminSubscription/sync-from-stripe', { method: 'POST' });
    }

    async getMembershipPlans() {
        return this.makeRequest('/AdminSubscription/membership-plans');
    }

    async updateMembershipPlanPrice(planId, price) {
        return this.makeRequest(`/AdminSubscription/membership-plans/${planId}/price`, {
            method: 'PUT',
            body: JSON.stringify({ Price: Number(price) })
        });
    }

    async getUserTierCounts() {
        return this.makeRequest('/AdminSubscription/tier-counts');
    }

    async updateUserTierLevel(userId, tierLevel) {
        return this.makeRequest(`/admin/users/${userId}/tier-level`, {
            method: 'PUT',
            body: JSON.stringify({ TierLevel: tierLevel })
        });
    }

    // ─── Settings Admin APIs ──────────────────────────────

    async getAdminPlatformSettings() {
        return this.makeRequest('/Settings/admin/platform');
    }

    async updateAdminPlatformSettings(payload) {
        return this.makeRequest('/Settings/admin/platform', {
            method: 'PUT',
            body: JSON.stringify(payload)
        });
    }

    async getAdminPricingSettings() {
        return this.makeRequest('/Settings/admin/pricing');
    }

    async updateAdminPricingSettings(payload) {
        return this.makeRequest('/Settings/admin/pricing', {
            method: 'PUT',
            body: JSON.stringify(payload)
        });
    }

    // ─── FAQ APIs ──────────────────────────────────────────

    // Get FAQ stats (admin only)
    async getFAQStats() {
        return this.makeRequest('/faq/stats');
    }

    // Get all FAQs for admin (includes drafts)
    async getAllFAQsAdmin(params = {}) {
        const { category = '', search = '', status = '' } = params;
        const queryParams = new URLSearchParams();
        if (category) queryParams.append('category', category);
        if (search) queryParams.append('search', search);
        if (status) queryParams.append('status', status);

        const queryString = queryParams.toString();
        return this.makeRequest(`/faq/admin${queryString ? '?' + queryString : ''}`);
    }

    // Get all published FAQs (public)
    async getAllFAQs(params = {}) {
        const { category = '', search = '' } = params;
        const queryParams = new URLSearchParams();
        if (category) queryParams.append('category', category);
        if (search) queryParams.append('search', search);

        const queryString = queryParams.toString();
        return this.makeRequest(`/faq${queryString ? '?' + queryString : ''}`);
    }

    // Get FAQ by ID
    async getFAQById(id) {
        return this.makeRequest(`/faq/${id}`);
    }

    // Create new FAQ (admin only)
    async createFAQ(faqData) {
        return this.makeRequest('/faq', {
            method: 'POST',
            body: JSON.stringify({
                Question: faqData.question,
                Answer: faqData.answer,
                Category: faqData.category,
                Status: faqData.status,
                DisplayOrder: faqData.order
            })
        });
    }

    // Update FAQ (admin only)
    async updateFAQ(id, faqData) {
        return this.makeRequest(`/faq/${id}`, {
            method: 'PUT',
            body: JSON.stringify({
                Question: faqData.question,
                Answer: faqData.answer,
                Category: faqData.category,
                Status: faqData.status,
                DisplayOrder: faqData.order
            })
        });
    }

    // Delete FAQ (admin only)
    async deleteFAQ(id) {
        return this.makeRequest(`/faq/${id}`, {
            method: 'DELETE'
        });
    }

    // Get categories
    async getFAQCategories() {
        return this.makeRequest('/faq/categories');
    }

    // ─── Expert Queries Admin APIs ───────────────────────

    async getAllExpertQueries() {
        return this.makeRequest('/admin/expert-queries');
    }

    async respondToExpertQuery(queryId, responseText) {
        return this.makeRequest(`/admin/expert-queries/${queryId}/respond`, {
            method: 'PUT',
            body: JSON.stringify({ AdminResponse: responseText }),
        });
    }

    // ─── Healing Circles Admin APIs ───────────────────────

    async getHealingCircles() {
        return this.makeRequest('/Community/circles');
    }

    async createHealingCircle(data) {
        return this.makeRequest('/Community/circles', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateHealingCircle(circleId, data) {
        return this.makeRequest(`/Community/circles/${circleId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteHealingCircle(circleId) {
        return this.makeRequest(`/Community/circles/${circleId}`, {
            method: 'DELETE',
        });
    }

    async getHealingCirclesStats() {
        // Fetch all circles and calculate stats
        try {
            const response = await this.getHealingCircles();
            if (!response?.success || !response?.data) return null;

            const circles = response.data;
            const now = new Date();
            const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

            const upcomingCount = circles.filter(c => {
                const circleDate = new Date(c.time);
                return circleDate > now;
            }).length;

            const thisMonthCount = circles.filter(c => {
                const createdDate = new Date(c.createdOn);
                return createdDate >= thisMonthStart && createdDate <= thisMonthEnd;
            }).length;

            const totalParticipants = circles.reduce((sum, c) => sum + (c.participantsCount || 0), 0);

            return {
                success: true,
                data: {
                    totalCircles: circles.length,
                    totalParticipants,
                    upcoming: upcomingCount,
                    thisMonth: thisMonthCount
                }
            };
        } catch (error) {
            console.error('Error calculating healing circles stats:', error);
            return null;
        }
    }

    // ─── Pre-Registrations Admin APIs ──────────────────

    async getPreRegistrations() {
        try {
            const response = await this.makeRequest('/preregister/admin/list');
            console.log('Pre-registrations response:', response);
            return response;
        } catch (error) {
            console.error('Error fetching pre-registrations:', error);
            throw error;
        }
    }

    async markInvitesSent(emails) {
        return this.makeRequest('/preregister/admin/mark-invites-sent', {
            method: 'POST',
            body: JSON.stringify({ Emails: emails })
        });
    }

    async deletePreRegistration(preRegistrationId) {
        return this.makeRequest(`/preregister/admin/${preRegistrationId}`, {
            method: 'DELETE'
        });
    }
}

export default new ApiService();
