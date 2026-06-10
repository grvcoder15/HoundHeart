// API Service for .NET 8 Backend Integration
const API_BASE_URL = import.meta.env.VITE_API_URL;


class ApiService {
  refreshPromise = null;

  isAuthEndpoint(endpoint = '') {
    return endpoint.includes('/Account/login') ||
      endpoint.includes('/Account/register') ||
      endpoint.includes('/Account/Google-LoginSignup') ||
      endpoint.includes('/Account/Apple-LoginSignup') ||
      endpoint.includes('/Account/refresh');
  }

  parseJwtPayload(token) {
    try {
      const payload = token.split('.')[1];
      if (!payload) return null;
      const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  isTokenExpiringSoon(token, bufferSeconds = 120) {
    const payload = this.parseJwtPayload(token);
    if (!payload?.exp) return false;
    const now = Math.floor(Date.now() / 1000);
    return payload.exp <= (now + bufferSeconds);
  }

  async refreshJwtToken(currentToken) {
    const response = await fetch(`${API_BASE_URL}/Account/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: currentToken })
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed (${response.status})`);
    }

    const json = await response.json();
    const newToken = json?.data?.token || json?.token || json?.data?.Token;
    if (!newToken) {
      throw new Error('Refresh response did not return a token.');
    }

    localStorage.setItem('token', newToken);
    return newToken;
  }

  async getValidToken(endpoint = '') {
    const token = localStorage.getItem('token');
    if (!token) return null;

    if (this.isAuthEndpoint(endpoint)) {
      return token;
    }

    if (!this.isTokenExpiringSoon(token)) {
      return token;
    }

    if (!this.refreshPromise) {
      this.refreshPromise = this.refreshJwtToken(token)
        .catch((err) => {
          this.logout();
          throw err;
        })
        .finally(() => {
          this.refreshPromise = null;
        });
    }

    return await this.refreshPromise;
  }

  async getAuthHeaders(endpoint = '') {
    const token = await this.getValidToken(endpoint);
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  }

  // Helper method to make API calls
  async makeRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('Making API request to:', url);

    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },

    };

    // Add auth token if available (refreshes it automatically when close to expiry)
    const authHeaders = await this.getAuthHeaders(endpoint);

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
      console.log('Request options:', finalOptions);
      const response = await fetch(url, finalOptions);

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const contentType = response.headers.get('content-type') || '';
        let errorData;
        if (contentType.includes('application/json')) {
          errorData = await response.json().catch(() => ({}));
        } else {
          const text = await response.text();
          errorData = { message: text };
        }

        console.error('API Error Response:', errorData);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      // Check content-type to handle both JSON and plain text responses
      const contentType = response.headers.get('content-type') || '';
      let responseData;

      if (contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        // Handle plain text responses (e.g., "OTP verified successfully")
        const text = await response.text();
        try {
          // Try to parse as JSON in case it's JSON-formatted text
          responseData = JSON.parse(text);
        } catch {
          // If not JSON, return as plain text wrapped in an object
          responseData = { message: text, data: text };
        }
      }

      console.log('API Success Response:', responseData);
      return responseData;
    } catch (error) {
      console.error('API Request Error Details:', {
        url,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }



  // Update user check-ins (handles both (userId, checkIns) and ({userId, checkIns}) signatures)
  async updateUserCheckIns(userId, checkIns) {
    const endpoint = '/CheckIn/UpdateUserCheckIns';

    let body;
    if (typeof userId === 'object' && userId !== null && !checkIns) {
      // Signature: ({ userId, checkIns, ... })
      body = { ...userId };
    } else {
      // Signature: (userId, checkIns)
      body = { UserId: userId, CheckIns: checkIns };
    }

    // Ensure localized date is included
    if (!body.Date && !body.date) {
      body.Date = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
    }

    console.log('Sending Check-in Data:', body);

    // Try axios if present
    const axiosRef = (typeof window !== 'undefined' && window.axios) ? window.axios : null;
    if (axiosRef) {
      try {
        const authHeaders = await this.getAuthHeaders(endpoint);
        const res = await axiosRef.post(`${API_BASE_URL}${endpoint}`, body, {
          headers: { 'Content-Type': 'application/json', ...authHeaders }
        });
        return res.data;
      } catch (error) {
        const msg = error?.response?.data?.message || error.message || 'Request failed';
        throw new Error(msg);
      }
    }

    // Fallback to fetch
    return await this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // Fetch all check-ins with IDs and question text
  async getAllCheckIns() {
    // Try common variations just in case controller routing differs
    const endpoints = [
      '/CheckIn/GetAll',
      '/CheckIns/GetAll',
      '/checkin/GetAll',
      '/checkins/GetAll'
    ];

    for (const endpoint of endpoints) {
      try {
        const res = await this.makeRequest(endpoint, { method: 'GET' });
        // Support shapes: { data: [...] } or raw array
        if (Array.isArray(res)) return res;
        if (res?.data && Array.isArray(res.data)) return res.data;
      } catch (err) {
        if (String(err?.message || '').includes('404')) continue;
      }
    }
    return [];
  }

  // Google Login/Signup with Google ID token
  async googleLogin(idToken) {
    const endpoints = [
      '/Account/Google-LoginSignup'
    ];
    const body = { Token: idToken };

    for (const endpoint of endpoints) {
      try {
        const res = await this.makeRequest(endpoint, {
          method: 'POST',
          body: JSON.stringify(body),
        });
        return res;
      } catch (err) {
        if (String(err?.message || '').includes('404')) continue;
        throw err;
      }
    }
    throw new Error('Google login endpoint not found.');
  }

  // Apple Login/Signup with Apple ID token (Mocked for Sandbox)
  async appleLogin(appleToken) {
    const endpoint = '/Account/Apple-LoginSignup';
    const body = { AppleToken: appleToken };

    try {
      const res = await this.makeRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      return res;
    } catch (err) {
      console.error('Apple login error:', err);
      throw err;
    }
  }

  async requestPasswordReset(email) {
    const endpoints = [
      '/Account/MailSendchangespassword',
      '/account/MailSendchangespassword'
    ];
    const payload = { Email: email };

    for (const endpoint of endpoints) {
      try {
        const response = await this.makeRequest(endpoint, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        return response;
      } catch (error) {
        if (String(error?.message || '').includes('404')) {
          continue;
        }
        throw error;
      }
    }

    throw new Error('Password reset endpoint not found.');
  }

  async verifyOtp(email, otpCode) {
    const payload = { Email: email, OtpCode: otpCode };
    return await this.makeRequest('/Account/VerifyOtp', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updatePassword(email, newPassword, confirmPassword) {
    const endpoints = [
      '/Account/update-password',
      '/account/update-password'
    ];
    const payload = {
      Email: email,
      NewPassword: newPassword,
      ConfirmPassword: confirmPassword,
    };

    for (const endpoint of endpoints) {
      try {
        const response = await this.makeRequest(endpoint, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        return response;
      } catch (error) {
        if (String(error?.message || '').includes('404')) {
          continue;
        }
        throw error;
      }
    }

    throw new Error('Password update endpoint not found.');
  }

  async changePassword(email, currentPassword, newPassword) {
    try {
      // Get userId from localStorage
      let userId = localStorage.getItem('userId');
      if (!userId) {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const u = JSON.parse(userStr);
            userId = u.userId || u.UserId;
          } catch (_) { }
        }
      }

      const endpoints = [
        '/Account/changepassword',
        '/account/changepassword'
      ];

      const payload = {
        UserId: userId || null,
        NewPassword: newPassword,
        CurrentPassword: currentPassword || null,
        Email: email || null,
      };

      for (const endpoint of endpoints) {
        try {
          const response = await this.makeRequest(endpoint, {
            method: 'POST',
            body: JSON.stringify(payload),
          });
          return response;
        } catch (error) {
          if (String(error?.message || '').includes('404')) {
            continue;
          }
          throw error;
        }
      }

      throw new Error('Change password endpoint not found.');
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }

  // Fetch user-specific check-ins with ratings
  async getUserCheckIns(userId) {
    const endpoints = [
      `/CheckIn/GetCheckInsByuserId?userId=${encodeURIComponent(userId)}`,
      `/CheckIn/GetCheckInsByuserId/${encodeURIComponent(userId)}`
    ];
    for (const endpoint of endpoints) {
      try {
        const res = await this.makeRequest(endpoint, { method: 'GET' });
        if (Array.isArray(res)) return res;
        if (res?.data && Array.isArray(res.data)) return res.data;
      } catch (err) {
        if (String(err?.message || '').includes('404')) continue;
      }
    }
    return [];
  }

  // Register new user - matches your .NET 8 API
  async registerUser(userData) {
    try {
      const response = await this.makeRequest('/Account/register', {
        method: 'POST',
        body: JSON.stringify({
          Email: userData.email,
          Password: userData.password,
          FullName: userData.fullName,
          ProfilePhoto: userData.profilePhoto || null,
          IsTermsAccepted: userData.isTermsAccepted
        }),
      });

      // Store token and user data if registration successful (support varied shapes/casing)
      const d = response?.data || response || {};
      const token = d.Token || d.token;
      const userId = d.UserId || d.userId || d.userid;
      if (token) localStorage.setItem('token', token);
      if (userId) localStorage.setItem('userId', userId);
      if (token || userId) localStorage.setItem('isAuthenticated', 'true');
      // Seed basic user object for header initials
      try {
        const existingUser = JSON.parse(localStorage.getItem('user') || '{}');
        const updatedUser = {
          ...existingUser,
          userId: userId || existingUser.userId,
          email: userData.email || existingUser.email,
          fullName: userData.fullName || existingUser.fullName || existingUser.name
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } catch { }

      // Do not call getUserProfile here per request

      return response;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    return localStorage.getItem('isAuthenticated') === 'true' &&
      localStorage.getItem('token') !== null;
  }

  // Get current user ID
  getCurrentUserId() {
    const token = localStorage.getItem('token');
    if (token) {
      const payload = this.parseJwtPayload(token);
      const tokenUserId = payload?.nameid ||
        payload?.sub ||
        payload?.userid ||
        payload?.userId ||
        payload?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];

      if (tokenUserId) {
        const storedUserId = localStorage.getItem('userId');
        if (storedUserId !== tokenUserId) {
          localStorage.setItem('userId', tokenUserId);
          try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            localStorage.setItem('user', JSON.stringify({ ...user, userId: tokenUserId }));
          } catch { }
        }

        return tokenUserId;
      }
    }

    return localStorage.getItem('userId');
  }

  // Get auth token
  getToken() {
    return localStorage.getItem('token');
  }

  // User Login - matches your .NET 8 API
  async loginUser(credentials) {
    try {
      const response = await this.makeRequest('/Account/login', {
        method: 'POST',
        body: JSON.stringify({
          Email: credentials.email,
          Password: credentials.password
        }),
      });

      // Store token and user data if login successful (support different casing)
      if (response?.data) {
        const d = response.data;
        const token = d.Token || d.token;
        const userId = d.UserId || d.userId || d.userid;
        const email = d.Email || d.email;
        const roleId = d.RoleId || d.roleId;

        if (token) localStorage.setItem('token', token);
        if (userId) localStorage.setItem('userId', userId);
        localStorage.setItem('user', JSON.stringify({ userId, email, roleId }));
        localStorage.setItem('isAuthenticated', 'true');
      }

      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Update user profile - matches your .NET 8 API
  async updateUserProfile(profileData) {
    try {
      // Try multiple sources for userId
      let userId = localStorage.getItem('userId');
      if (!userId) {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const u = JSON.parse(userStr);
            userId = u.userId || u.UserId;
          } catch (_) { }
        }
      }
      if (!userId) {
        throw new Error('User ID not found. Please login again.');
      }

      const response = await this.makeRequest('/Account/add-userprofile', {
        method: 'POST',
        body: JSON.stringify({
          UserId: userId,
          ProfileName: profileData.profileName,
          Age: profileData.age || null,
          ProfilePhotoUrl: profileData.profilePhotoUrl || null
        }),
      });

      // Update stored user data if successful (support returned keys)
      if (response?.data) {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const profileName = response.data.ProfileName || response.data.FullName || currentUser.fullName;
        const profilePhoto = response.data.ProfilePhoto || currentUser.profilePhoto;
        localStorage.setItem('user', JSON.stringify({
          ...currentUser,
          fullName: profileName,
          profilePhoto: profilePhoto
        }));
      }

      return response;
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  }

  // Add dog profile - matches your .NET 8 API
  async addDogProfile(dogData) {
    try {
      // Try multiple sources for userId
      let userId = localStorage.getItem('userId');
      if (!userId) {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const u = JSON.parse(userStr);
            userId = u.userId || u.UserId;
          } catch (_) { }
        }
      }
      if (!userId) {
        throw new Error('User ID not found. Please login again.');
      }

      if (!dogData.dogName || !dogData.dogName.trim()) {
        throw new Error('Dog name is required.');
      }

      const response = await this.makeRequest('/Account/add-dogprofile', {
        method: 'POST',
        body: JSON.stringify({
          UserId: userId,
          DogName: dogData.dogName,
          Breed: dogData.breed || null,
          Age: dogData.age || null,
          Weight: dogData.weight || null,
          DogPhotoUrl: dogData.dogPhotoUrl || null
        }),
      });

      return response;
    } catch (error) {
      console.error('Add dog profile error:', error);
      throw error;
    }
  }

  // Setup/Update profile (user and dog) - matches your .NET 8 API
  async setupProfile(profileData) {
    try {
      // Try multiple sources for userId
      let userId = localStorage.getItem('userId');
      if (!userId) {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const u = JSON.parse(userStr);
            userId = u.userId || u.UserId;
          } catch (_) { }
        }
      }
      if (!userId) {
        throw new Error('User ID not found. Please login again.');
      }

      const payload = {
        UserId: userId,
      };

      if (profileData.profileName) payload.ProfileName = profileData.profileName;
      if (profileData.email) payload.Email = profileData.email;
      if (profileData.base64Image) payload.Base64Image = profileData.base64Image;
      if (profileData.dogName) payload.DogName = profileData.dogName;
      if (profileData.dogBase64Image) payload.DogBase64Image = profileData.dogBase64Image;
      if (profileData.phoneNumber) payload.PhoneNumber = profileData.phoneNumber;

      const response = await this.makeRequest('/Account/setup-profile', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      // Update stored user data if successful
      if (response?.data) {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const profileName = response.data.ProfileName || response.data.FullName || currentUser.fullName;
        const profilePhoto = response.data.ProfilePhoto || currentUser.profilePhoto;
        localStorage.setItem('user', JSON.stringify({
          ...currentUser,
          fullName: profileName,
          profilePhoto: profilePhoto
        }));

        // Update localStorage for profile photos
        if (response.data.ProfilePhoto) {
          localStorage.setItem('UserprofilPhotoUrl', response.data.ProfilePhoto);
        }
        if (response.data.Dog?.DogProfilePhoto) {
          localStorage.setItem('DogprofilPhotoUrl', response.data.Dog.DogProfilePhoto);
        }
        if (response.data.Dog?.DogName) {
          localStorage.setItem('dogName', response.data.Dog.DogName);
        }
      }

      return response;
    } catch (error) {
      console.error('Setup profile error:', error);
      throw error;
    }
  }

  // Get user profile with dog data - matches your .NET 8 API
  async getUserProfile() {
    try {
      // Try multiple sources for userId
      let userId = localStorage.getItem('userId');
      if (!userId) {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const u = JSON.parse(userStr);
            userId = u.userId || u.UserId;
          } catch (_) { }
        }
      }
      if (!userId) {
        throw new Error('User ID not found. Please login again.');
      }

      const response = await this.makeRequest(`/Account/profile/${userId}`, {
        method: 'GET',
      });

      return response;
    } catch (error) {
      console.error('Get user profile error:', error);
      throw error;
    }
  }

  // Get all user spiritual traits
  async getAllUserTraits() {
    try {
      const response = await this.makeRequest('/SpritualTraits/getAllUserTraits', {
        method: 'GET',
      });
      return response;
    } catch (error) {
      console.error('Get user traits error:', error);
      throw error;
    }
  }

  // Get all dog spiritual traits
  async getAllDogTraits() {
    try {
      const response = await this.makeRequest('/SpritualTraits/getAllDogTraits', {
        method: 'GET',
      });
      return response;
    } catch (error) {
      console.error('Get dog traits error:', error);
      throw error;
    }
  }

  // Save user selected traits
  async saveUserTraits(traitIds) {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) {
        throw new Error('User ID not found. Please login again.');
      }

      const response = await this.makeRequest('/SpritualTraits/UserSelectedTraits', {
        method: 'POST',
        body: JSON.stringify({
          UserId: userId,
          TraitIds: traitIds
        }),
      });
      return response;
    } catch (error) {
      console.error('Save user traits error:', error);
      throw error;
    }
  }

  // Save dog selected traits
  async saveDogTraits(dogId, traitIds) {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) {
        throw new Error('User ID not found. Please login again.');
      }
      if (!dogId) {
        throw new Error('Dog ID not found. Please complete dog profile first.');
      }

      const response = await this.makeRequest('/SpritualTraits/DogSelectedTraits', {
        method: 'POST',
        body: JSON.stringify({
          DogId: dogId,
          UserId: userId,
          TraitIds: traitIds
        }),
      });
      return response;
    } catch (error) {
      console.error('Save dog traits error:', error);
      throw error;
    }
  }

  // Check if daily check-in is done for today
  async checkCheckInDoneToday(userId) {
    try {
      const response = await this.makeRequest(`/CheckIn/CheckDoneToday?userId=${userId}`);
      return response;
    } catch (error) {
      console.error('Error checking today check-in:', error);
      return { done: false };
    }
  }

  // Get all chakras
  async getAllChakras() {
    // Try different endpoint variations based on common ASP.NET Core routing patterns
    // The method has [HttpGet("chakrasList")] but controller name might vary
    const endpoints = [
      '/Chakra/chakrasList',    // ChakraController with chakrasList route
      '/Chakras/chakrasList',   // ChakrasController (plural)
      '/chakra/chakrasList',    // Lowercase controller
      '/chakras/chakrasList',   // Lowercase plural controller
      '/Chakra/GetAllChakras',  // Fallback: method name as route
      '/Chakras/GetAllChakras', // Plural with method name
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`Trying endpoint: ${endpoint}`);
        console.log(`Full URL: ${API_BASE_URL}${endpoint}`);
        const response = await this.makeRequest(endpoint, {
          method: 'GET',
        });

        console.log('Raw API response:', response);
        console.log('Response type:', typeof response);
        console.log('Is array?', Array.isArray(response));

        // The API returns the array directly (Ok(chakras) returns the array)
        // If it's wrapped, try to unwrap it
        if (Array.isArray(response)) {
          console.log(`✅ Success! Found array with ${response.length} items using endpoint: ${endpoint}`);
          return response;
        } else if (response && Array.isArray(response.data)) {
          console.log(`✅ Success! Found array in data property with ${response.data.length} items using endpoint: ${endpoint}`);
          return response.data;
        } else if (response && response.result && Array.isArray(response.result)) {
          console.log(`✅ Success! Found array in result property with ${response.result.length} items using endpoint: ${endpoint}`);
          return response.result;
        } else {
          // Continue to next endpoint if this one didn't work
          console.warn(`Endpoint ${endpoint} returned unexpected structure:`, response);
          continue;
        }
      } catch (error) {
        // If it's a 404, try next endpoint
        if (error.message && (error.message.includes('404') || error.message.includes('Not Found'))) {
          console.log(`❌ Endpoint ${endpoint} returned 404, trying next...`);
          continue;
        }
        // For other errors (like 200 but wrong structure), we already handled above
        // If it's a different error, log it
        if (!error.message.includes('404')) {
          console.warn(`⚠️ Error with endpoint ${endpoint}:`, error.message);
        }
        continue;
      }
    }

    // If all endpoints failed
    console.error('❌ All endpoint variations failed. Please check:');
    console.error('1. What is the exact controller class name? (Is it ChakraController or ChakrasController?)');
    console.error('2. Does the controller have a [Route] attribute?');
    console.error('3. Check your API Swagger/OpenAPI documentation for the correct endpoint');
    console.error('4. Test the endpoint directly in Postman/browser: GET ' + API_BASE_URL + '/Chakra/chakrasList');
    return [];
  }

  // Get All Journal Tags
  async getAllJournalTags() {
    try {
      const response = await this.makeRequest('/JournalEntry/GetAlltags', {
        method: 'GET',
      });
      return response;
    } catch (error) {
      console.error('Get journal tags error:', error);
      throw error;
    }
  }



  // Get All Journal Entries for User with Pagination
  async getUserJournalEntries(userId, page = 1, limit = 10, entryType = '') {
    try {
      let url = `/JournalEntry/user/${userId}?page=${page}&pageSize=${limit}`;
      if (entryType) {
        url += `&entryType=${entryType}`;
      }
      const response = await this.makeRequest(url, {
        method: 'GET',
      });
      return response;
    } catch (error) {
      console.error('Get user journal entries error:', error);
      throw error;
    }
  }

  // Calculate Bonded Score
  async calculateBondedScore(userId, dogId) {
    try {
      if (!userId || !dogId) {
        throw new Error('User ID and Dog ID are required');
      }

      const response = await this.makeRequest(
        `/BondedScore/CalculateBondedScore?userId=${encodeURIComponent(userId)}&dogId=${encodeURIComponent(dogId)}`,
        {
          method: 'GET',
        }
      );
      return response;
    } catch (error) {
      console.error('Calculate bonded score error:', error);
      throw error;
    }
  }

  // Save selected user activities
  async saveUserActivitiesScore(payload) {
    try {
      if (!payload.UserId) throw new Error('User ID is required');
      if (!payload.Activities || payload.Activities.length === 0) throw new Error('No activities provided');

      const response = await this.makeRequest('/UserActivitiesScore/save', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return response;
    } catch (error) {
      console.error('Save user activities score error:', error);
      throw error;
    }
  }

  // Get user activities for today
  async getUserActivitiesToday(userId, clientDate = null) {
    try {
      if (!userId) throw new Error('User ID is required');

      const dateParam = clientDate ? `?clientDate=${encodeURIComponent(clientDate)}` : '';
      const response = await this.makeRequest(`/UserActivitiesScore/user/${userId}/today${dateParam}`, {
        method: 'GET',
      });
      return response;
    } catch (error) {
      console.error('Get user activities today error:', error);
      return [];
    }
  }

  // Get all ritual points
  async getAllPoints() {
    try {
      const response = await this.makeRequest('/BondedScore/GetAllPoints', {
        method: 'GET',
      });
      return response;
    } catch (error) {
      console.error('Get all points error:', error);
      return [];
    }
  }

  // --- Daily Rituals (New Feature) ---

  // Get ritual suggestions calling the new RitualsController
  async getRitualSuggestions(userId) {
    try {
      // Endpoint: /api/rituals/suggestions?userId=...
      const response = await this.makeRequest(`/Rituals/suggestions?userId=${userId}`, {
        method: 'GET',
      });
      return response;
      // Expected structure: { dailyBonusEarned: boolean, rituals: [...] }
    } catch (error) {
      console.error('Get ritual suggestions error:', error);
      throw error;
    }
  }

  // Mark ritual as complete calling the new RitualsController
  async completeRitual(userId, ritualId) {
    try {
      const response = await this.makeRequest('/Rituals/complete', {
        method: 'POST',
        body: JSON.stringify({
          UserId: userId,
          RitualId: ritualId
        })
      });
      return response;
      // Expected structure: { message: "...", bonusAwarded: boolean, newScore: number }
    } catch (error) {
      console.error('Complete ritual error:', error);
      throw error;
    }
  }


  // Sync Chakra Scores and get recommendation
  async syncChakra(data) {
    try {
      // data now includes { ..., Behaviors: [...] }
      const response = await this.makeRequest('/Chakra/sync', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      return response;
    } catch (error) {
      console.error('Chakra Sync error:', error);
      throw error;
    }
  }

  // Complete Chakra Ritual and award points (sends scores for ChakraLog save)
  async completeChakraRitual(userId, chakraData = {}) {
    try {
      const response = await this.makeRequest('/Chakra/complete-ritual', {
        method: 'POST',
        body: JSON.stringify({
          UserId: userId,
          RootScore: chakraData.RootScore || 0,
          SacralScore: chakraData.SacralScore || 0,
          SolarPlexusScore: chakraData.SolarPlexusScore || 0,
          HeartScore: chakraData.HeartScore || 0,
          ThroatScore: chakraData.ThroatScore || 0,
          ThirdEyeScore: chakraData.ThirdEyeScore || 0,
          CrownScore: chakraData.CrownScore || 0,
          HarmonyScore: chakraData.HarmonyScore || 0,
          DominantBlockage: chakraData.DominantBlockage || null
        })
      });
      return response;
    } catch (error) {
      console.error('Complete Chakra Ritual error:', error);
      throw error;
    }
  }

  // Create Journal Entry
  async createJournalEntry(entryData) {
    try {
      let payload = entryData;
      let isFormData = entryData instanceof FormData;

      // The backend expects [FromForm], so we MUST send FormData
      if (!isFormData) {
        const formData = new FormData();
        Object.keys(entryData).forEach(key => {
          if (entryData[key] !== null && entryData[key] !== undefined) {
            formData.append(key, entryData[key]);
          }
        });
        payload = formData;
        isFormData = true;
      }

      // If FormData, let browser set Content-Type (multipart/form-data)
      if (isFormData) {
        const headers = await this.getAuthHeaders('/JournalEntry/add');

        // Fetch directly to avoid Content-Type: application/json being set by makeRequest
        const response = await fetch(`${API_BASE_URL}/JournalEntry/add`, {
          method: 'POST',
          headers: headers, // Do NOT set Content-Type, let browser set boundary
          body: payload
        });

        if (!response.ok) {
          const contentType = response.headers.get('content-type') || '';
          let err = {};
          if (contentType.includes('application/json')) {
            err = await response.json();
          } else {
            err = { message: await response.text() };
          }
          throw new Error(err.message || `Failed to create entry (${response.status})`);
        }
        return await response.json();
      }
    } catch (error) {
      console.error('Create journal entry error:', error);
      throw error;
    }
  }
  async getDashboardStats(userId, clientDate) {
    try {
      if (!userId) throw new Error('User ID is required');

      let url = `/Dashboard/Stats?userId=${userId}`;
      if (clientDate) {
        // If it's already a string (e.g. YYYY-MM-DD), send as is. Else if Date object, toISOString()
        const dateStr = typeof clientDate === 'string' ? clientDate : clientDate.toISOString();
        url += `&clientDate=${encodeURIComponent(dateStr)}`;
      }

      const response = await this.makeRequest(url, {
        method: 'GET',
      });
      return response;
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      throw error;
    }
  }

  async getDashboardWellnessSummary(userId, options = {}) {
    try {
      if (!userId) throw new Error('User ID is required');

      const params = new URLSearchParams();

      if (options.dogId) {
        params.append('dogId', options.dogId);
      }

      if (options.clientDate) {
        const dateStr = typeof options.clientDate === 'string'
          ? options.clientDate
          : options.clientDate.toISOString();
        params.append('clientDate', dateStr);
      }

      if (options.lat !== undefined && options.lat !== null) {
        params.append('lat', String(options.lat));
      }

      if (options.lon !== undefined && options.lon !== null) {
        params.append('lon', String(options.lon));
      }

      const query = params.toString();
      const endpoint = `/Dashboard/summary/${userId}${query ? `?${query}` : ''}`;

      return await this.makeRequest(endpoint, {
        method: 'GET',
      });
    } catch (error) {
      console.error('Get dashboard wellness summary error:', error);
      throw error;
    }
  }

  // Fetch Dashboard Score Card Summary
  async getDashboardSummary(userId, clientDate) {
    try {
      const dateStr = clientDate ? (typeof clientDate === 'string' ? clientDate : clientDate.toISOString()) : '';
      const dateParam = dateStr ? `&clientDate=${encodeURIComponent(dateStr)}` : '';
      const response = await this.makeRequest(`/Analytics/dashboard-summary?userId=${userId}${dateParam}`, {
        method: 'GET',
      });
      return response;
    } catch (error) {
      console.error('Get dashboard summary error:', error);
      throw error;
    }
  }

  async getBondingActivities() {
    try {
      const response = await this.makeRequest('/BondingActivities/GetAllBondingActivities', {
        method: 'GET',
      });
      return response;
    } catch (error) {
      console.error('Get bonding activities error:', error);
      throw error;
    }
  }

  // --- Fitbit Integration ---

  // Fetch linked FitBark dogs (and sync them into backend DB)
  async getFitBarkDogs() {
    try {
      const response = await this.makeRequest('/fitbark/dogs', {
        method: 'GET'
      });
      return response;
    } catch (error) {
      console.error('Get FitBark dogs error:', error);
      throw error;
    }
  }

  async getFitBarkSyncStatus() {
    try {
      const response = await this.makeRequest('/fitbark/sync/status', {
        method: 'GET'
      });
      return response;
    } catch (error) {
      console.error('Get FitBark sync status error:', error);
      throw error;
    }
  }

  async getFitBarkAuthUrl() {
    try {
      const response = await this.makeRequest('/fitbark/auth/authorize', {
        method: 'GET'
      });
      return response;
    } catch (error) {
      console.error('Get FitBark auth URL error:', error);
      throw error;
    }
  }

  async getFitBarkStatus() {
    try {
      const response = await this.makeRequest('/fitbark/auth/status', {
        method: 'GET'
      });
      return response;
    } catch (error) {
      console.error('Get FitBark status error:', error);
      throw error;
    }
  }

  async exchangeFitBarkCode(code, state = null) {
    try {
      const response = await this.makeRequest('/fitbark/auth/exchange-code', {
        method: 'POST',
        body: JSON.stringify({ code, state })
      });
      return response;
    } catch (error) {
      console.error('Exchange FitBark code error:', error);
      throw error;
    }
  }

  async disconnectFitBark() {
    try {
      const response = await this.makeRequest('/fitbark/auth/disconnect', {
        method: 'POST'
      });
      return response;
    } catch (error) {
      console.error('Disconnect FitBark error:', error);
      throw error;
    }
  }

  // Get Fitbit authorization URL to start OAuth flow
  async getFitbitAuthUrl(userId) {
    try {
      if (!userId) throw new Error('User ID is required');
      
      const response = await this.makeRequest(`/fitbit/auth/authorize/${userId}`, {
        method: 'GET'
      });
      return response;
    } catch (error) {
      console.error('Get Fitbit auth URL error:', error);
      throw error;
    }
  }

  // Check Fitbit connection status for a user
  async getFitbitStatus(userId) {
    try {
      if (!userId) throw new Error('User ID is required');
      
      const response = await this.makeRequest(`/fitbit/auth/status/${userId}`, {
        method: 'GET'
      });
      return response;
    } catch (error) {
      console.error('Get Fitbit status error:', error);
      throw error;
    }
  }

  // Disconnect Fitbit for a user
  async disconnectFitbit(userId) {
    try {
      if (!userId) throw new Error('User ID is required');
      
      const response = await this.makeRequest(`/fitbit/auth/disconnect/${userId}`, {
        method: 'POST'
      });
      return response;
    } catch (error) {
      console.error('Disconnect Fitbit error:', error);
      throw error;
    }
  }

  // Generate mock Fitbit data for testing
  async generateMockFitbitData(userId) {
    try {
      if (!userId) throw new Error('User ID is required');
      
      const response = await this.makeRequest(`/fitbit-mock/trigger/${userId}`, {
        method: 'POST'
      });
      return response;
    } catch (error) {
      console.error('Generate mock Fitbit data error:', error);
      throw error;
    }
  }

  // Get all chakra ritual progress for a user
  // GET /api/Chakra/get-all-progress?userId={userId}
  // Returns: { success: true, message: "...", data: [{ chakraId, pauseTimeInSeconds, isCompleted }, ...] }
  // Note: API_BASE_URL already includes /api, so we don't add it here
  // Controller: ChakraController
  async getAllChakraRitualProgress(userId) {
    const endpoint = `/Chakra/get-all-progress?userId=${encodeURIComponent(userId)}`;

    console.log(`[GetAllProgress] 🔍 Fetching all progress for userId: ${userId}`);

    try {
      const response = await this.makeRequest(endpoint, { method: 'GET' });
      console.log(`[GetAllProgress] ✅ Success! Response:`, response);

      // Extract data from wrapped response
      if (response?.success && response?.data && Array.isArray(response.data)) {
        return response.data; // Return [{ chakraId, pauseTimeInSeconds, isCompleted }, ...]
      }

      return [];
    } catch (error) {
      if (error?.message?.includes('404') || error?.message?.includes('Not Found')) {
        console.log(`[GetAllProgress] ❌ 404 - No progress found`);
        return [];
      }
      console.warn(`[GetAllProgress] ⚠️ Error:`, error.message);
      return [];
    }
  }

  // Get chakra ritual progress (single chakra - kept for backward compatibility)
  // GET /api/Chakra/get-progress?userId={userId}&chakraId={chakraId}
  // Returns: { success: true, message: "...", data: { chakraId, pauseTimeInSeconds, isCompleted } }
  // Note: API_BASE_URL already includes /api, so we don't add it here
  // Controller: ChakraController
  async getChakraRitualProgress(userId, chakraId) {
    const queryParams = `userId=${encodeURIComponent(userId)}&chakraId=${encodeURIComponent(chakraId)}`;
    const endpoint = `/Chakra/get-progress?${queryParams}`;

    console.log(`[GetProgress] 🔍 Fetching progress for userId: ${userId}, chakraId: ${chakraId}`);

    try {
      const response = await this.makeRequest(endpoint, { method: 'GET' });
      console.log(`[GetProgress] ✅ Success! Response:`, response);

      // Extract data from wrapped response
      if (response?.success && response?.data) {
        return response.data; // Return { chakraId, pauseTimeInSeconds, isCompleted }
      }

      return null;
    } catch (error) {
      if (error?.message?.includes('404') || error?.message?.includes('Not Found')) {
        console.log(`[GetProgress] ❌ 404 - No previous progress found`);
        return null;
      }
      console.warn(`[GetProgress] ⚠️ Error:`, error.message);
      return null;
    }
  }

  // Save chakra ritual progress
  // POST /api/Chakra/save-progress
  // Body: { userId, chakraId, pauseTimeInSeconds, isCompleted }
  // Note: API_BASE_URL already includes /api, so we don't add it here
  // Controller: ChakraController
  async saveChakraRitualProgress(userId, chakraId, pauseTimeInSeconds, isCompleted = false) {
    const endpoint = '/Chakra/save-progress';

    // Convert to integer seconds as specified
    const pauseTimeSeconds = Math.floor(pauseTimeInSeconds);

    const requestBody = {
      userId: userId,
      chakraId: chakraId,
      currentPosition: pauseTimeSeconds, // Re-mapped to match Backend DTO property
      totalDuration: 0, // Fallback, would be better to pass from component
      IsCompleted: isCompleted,
      Date: new Date().toLocaleDateString('en-CA') // Local YYYY-MM-DD
    };

    try {
      console.log(`[SaveProgress] 💾 Saving progress:`, requestBody);
      const response = await this.makeRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log(`[SaveProgress] ✅ Success!`, response);
      return response;
    } catch (error) {
      console.warn(`[SaveProgress] ⚠️ Error saving progress:`, error.message);
      return { success: false, message: error.message };
    }
  }



  // Logout (preserves Remember Me credentials)
  logout() {
    const rememberMeEmail = localStorage.getItem('rememberMeEmail');
    const rememberMePassword = localStorage.getItem('rememberMePassword');
    localStorage.clear();
    if (rememberMeEmail && rememberMePassword) {
      localStorage.setItem('rememberMeEmail', rememberMeEmail);
      localStorage.setItem('rememberMePassword', rememberMePassword);
    }
  }
  // Get Breathing Patterns
  async getBreathingPatterns() {
    try {
      const response = await this.makeRequest('/Breathing/patterns', {
        method: 'GET',
      });
      console.log('🫁 Breathing Patterns API Response:', response);
      // Extract data from response if wrapped by ResponseHelper
      if (response && response.data && Array.isArray(response.data)) {
        console.log('✅ Breathing patterns data extracted:', response.data);
        return response.data;
      }
      // If response is already an array, return it
      if (Array.isArray(response)) {
        console.log('✅ Breathing patterns already array:', response);
        return response;
      }
      console.warn('⚠️ Unexpected breathing patterns response format:', response);
      return [];
    } catch (error) {
      console.error('Get breathing patterns error:', error);
      return [];
    }
  }

  // Get Target Cycles
  async getTargetCycles() {
    try {
      const response = await this.makeRequest('/Breathing/cycles', {
        method: 'GET',
      });
      console.log('🔄 Target Cycles API Response:', response);
      // Extract data from response if wrapped by ResponseHelper
      if (response && response.data && Array.isArray(response.data)) {
        console.log('✅ Target cycles data extracted:', response.data);
        return response.data;
      }
      // If response is already an array, return it
      if (Array.isArray(response)) {
        console.log('✅ Target cycles already array:', response);
        return response;
      }
      console.warn('⚠️ Unexpected target cycles response format:', response);
      return [];
    } catch (error) {
      console.error('Get target cycles error:', error);
      return [];
    }
  }

  // Complete Breathing Session
  async completeBreathingSession(data) {
    try {
      const response = await this.makeRequest('/Breathing/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      return response;
    } catch (error) {
      console.error('Complete breathing session error:', error);
      throw error;
    }
  }

  // Get Breathing Preferences (user's saved pattern + cycles)
  async getBreathingPreferences() {
    try {
      const response = await this.makeRequest('/Breathing/preferences', {
        method: 'GET',
      });
      return response;
    } catch (error) {
      console.error('Get breathing preferences error:', error);
      return null;
    }
  }

  // Save Breathing Preferences (upsert)
  async saveBreathingPreferences(data) {
    try {
      const response = await this.makeRequest('/Breathing/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return response;
    } catch (error) {
      console.error('Save breathing preferences error:', error);
      return null;
    }
  }

  // ===== Sacred Guide APIs =====

  // Get the active Sacred Guide (id, title, price, status)
  async getActiveSacredGuide() {
    try {
      const response = await this.makeRequest('/SacredGuide/active', {
        method: 'GET',
      });
      return response;
    } catch (error) {
      console.error('Get active sacred guide error:', error);
      return null;
    }
  }

  // Join the waitlist for a Sacred Guide
  async joinSacredGuideWaitlist(guideId, name, email) {
    try {
      const response = await this.makeRequest(`/SacredGuide/${guideId}/waitlist/join`, {
        method: 'POST',
        body: JSON.stringify({ Name: name, Email: email }),
      });
      return response;
    } catch (error) {
      console.error('Join sacred guide waitlist error:', error);
      throw error;
    }
  }

  // Check if user already joined the waitlist
  async getSacredGuideWaitlistStatus(guideId) {
    try {
      const response = await this.makeRequest(`/SacredGuide/${guideId}/waitlist/status`, {
        method: 'GET',
      });
      return response;
    } catch (error) {
      console.error('Get sacred guide waitlist status error:', error);
      return null;
    }
  }

  // Get full guide details (with access guard)
  async getSacredGuideDetails(guideId) {
    try {
      const response = await this.makeRequest(`/SacredGuide/${guideId}`, {
        method: 'GET',
      });
      return response;
    } catch (error) {
      console.error('Get sacred guide details error:', error);
      throw error;
    }
  }

  // Secure PDF download (blob)
  async downloadSacredGuide(guideId, fileName) {
    try {
      const authHeaders = await this.getAuthHeaders(`/SacredGuide/${guideId}/download`);
      const res = await fetch(`${API_BASE_URL}/SacredGuide/${guideId}/download`, {
        method: 'GET',
        headers: authHeaders,
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'Sacred-Guide.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download sacred guide error:', error);
      throw error;
    }
  }

  // Create a checkout session for a one-time guide purchase
  async createSacredGuideCheckoutSession(guideId) {
    try {
      const response = await this.makeRequest(`/SacredGuide/${guideId}/create-checkout-session`, {
        method: 'POST',
      });
      return response;
    } catch (error) {
      console.error('Create sacred guide checkout session error:', error);
      throw error;
    }
  }

  // Check if user has access (premium or purchased)
  async checkSacredGuideAccess(guideId) {
    try {
      const response = await this.makeRequest(`/SacredGuide/${guideId}/check-access`, {
        method: 'GET',
      });
      return response;
    } catch (error) {
      console.error('Check sacred guide access error:', error);
      return { data: { hasAccess: false } };
    }
  }

  // ───────────────────────────────────────────────
  // Community Module Methods
  // ───────────────────────────────────────────────

  async getCommunityPosts(page = 1, pageSize = 10, searchQuery = '', category = '', sortBy = 'newest') {
    try {
      let url = `/Community/posts?page=${page}&pageSize=${pageSize}`;
      if (searchQuery) url += `&searchQuery=${encodeURIComponent(searchQuery)}`;
      if (category && category !== 'All Posts') url += `&category=${encodeURIComponent(category)}`;
      if (sortBy && sortBy !== 'newest') url += `&sortBy=${encodeURIComponent(sortBy)}`;

      const response = await this.makeRequest(url, {
        method: 'GET'
      });
      return response;
    } catch (error) {
      console.error('Get community posts error:', error);
      return { success: false, message: error.message };
    }
  }

  async createCommunityPost(content, imageUrl = null) {
    try {
      const response = await this.makeRequest('/Community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, imageUrl })
      });
      return response;
    } catch (error) {
      console.error('Create community post error:', error);
      return { success: false, message: error.message };
    }
  }

  async toggleCommunityLike(postId) {
    try {
      const response = await this.makeRequest(`/Community/posts/${postId}/like`, {
        method: 'POST'
      });
      return response;
    } catch (error) {
      console.error('Toggle community like error:', error);
      return { success: false, message: error.message };
    }
  }

  async getCommunityComments(postId, page = 1, pageSize = 20) {
    try {
      const response = await this.makeRequest(`/Community/posts/${postId}/comments?page=${page}&pageSize=${pageSize}`, {
        method: 'GET'
      });
      return response;
    } catch (error) {
      console.error('Get community comments error:', error);
      return { success: false, message: error.message };
    }
  }

  async addCommunityComment(postId, content, parentCommentId = null) {
    try {
      const response = await this.makeRequest(`/Community/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, parentCommentId })
      });
      return response;
    } catch (error) {
      console.error('Add community comment error:', error);
      return { success: false, message: error.message };
    }
  }

  async getCommunityStats() {
    try {
      const response = await this.makeRequest('/Community/stats', {
        method: 'GET'
      });
      return response;
    } catch (error) {
      console.error('Get community stats error:', error);
      return { success: false, message: error.message };
    }
  }

  async getCommunityTrending() {
    try {
      const response = await this.makeRequest('/Community/trending', {
        method: 'GET'
      });
      return response;
    } catch (error) {
      console.error('Get community trending error:', error);
      return { success: false, message: error.message };
    }
  }

  async getCommunityCircles() {
    try {
      const response = await this.makeRequest('/Community/circles', {
        method: 'GET'
      });
      return response;
    } catch (error) {
      console.error('Get community circles error:', error);
      return { success: false, message: error.message };
    }
  }

  async getCommunityDiscussions() {
    try {
      const response = await this.makeRequest('/Community/discussions', {
        method: 'GET'
      });
      return response;
    } catch (error) {
      console.error('Get community discussions error:', error);
      return { success: false, message: error.message };
    }
  }

  async editPost(postId, content) {
    try {
      const response = await this.makeRequest(`/Community/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      return response;
    } catch (error) {
      console.error('Edit community post error:', error);
      return { success: false, message: error.message };
    }
  }

  async deletePost(postId) {
    try {
      const response = await this.makeRequest(`/Community/posts/${postId}`, {
        method: 'DELETE'
      });
      return response;
    } catch (error) {
      console.error('Delete community post error:', error);
      return { success: false, message: error.message };
    }
  }

  async editComment(commentId, content) {
    try {
      const response = await this.makeRequest(`/Community/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      return response;
    } catch (error) {
      console.error('Edit community comment error:', error);
      return { success: false, message: error.message };
    }
  }

  async deleteComment(commentId) {
    try {
      const response = await this.makeRequest(`/Community/comments/${commentId}`, {
        method: 'DELETE'
      });
      return response;
    } catch (error) {
      console.error('Delete community comment error:', error);
      return { success: false, message: error.message };
    }
  }

  async reportContent(postId, commentId, reason) {
    try {
      const response = await this.makeRequest('/Community/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, commentId, reason })
      });
      return response;
    } catch (error) {
      console.error('Report community content error:', error);
      return { success: false, message: error.message };
    }
  }

  async getCommunitySummary() {
    try {
      const response = await this.makeRequest('/Community/summary', {
        method: 'GET'
      });
      return response;
    } catch (error) {
      console.error('Get community summary error:', error);
      return { success: false, message: error.message };
    }
  }

  async getNextCircle() {
    try {
      const response = await this.makeRequest('/Community/circles/next', {
        method: 'GET'
      });
      return response;
    } catch (error) {
      console.error('Get next circle error:', error);
      return { success: false, message: error.message };
    }
  }

  async joinCircle(circleId) {
    try {
      const response = await this.makeRequest(`/Community/circles/${circleId}/join`, {
        method: 'POST'
      });
      return response;
    } catch (error) {
      console.error('Join circle error:', error);
      return { success: false, message: error.message };
    }
  }

  async leaveCircle(circleId) {
    try {
      const response = await this.makeRequest(`/Community/circles/${circleId}/leave`, {
        method: 'DELETE'
      });
      return response;
    } catch (error) {
      console.error('Leave circle error:', error);
      return { success: false, message: error.message };
    }
  }

  async getMyJoinedCircles() {
    try {
      const response = await this.makeRequest('/Community/circles/joined', {
        method: 'GET'
      });
      return response;
    } catch (error) {
      console.error('Get joined circles error:', error);
      return { success: false, message: error.message };
    }
  }

  async createPortalSession() {
    return await this.makeRequest('/Subscription/create-portal-session', {
      method: 'POST'
    });
  }

  async syncSubscriptionFromStripe() {
    try {
      return await this.makeRequest('/Subscription/sync-from-stripe', {
        method: 'POST'
      });
    } catch (error) {
      if (error?.message?.includes('No subscription found to sync')) {
        return null;
      }

      throw error;
    }
  }

  // ─── FAQ APIs ──────────────────────────────────────────

  // Get all published FAQs (public)
  async getAllFAQs(params = {}) {
    try {
      const { category = '', search = '' } = params;
      const queryParams = new URLSearchParams();
      if (category) queryParams.append('category', category);
      if (search) queryParams.append('search', search);

      const queryString = queryParams.toString();
      const response = await this.makeRequest(`/faq${queryString ? '?' + queryString : ''}`, {
        method: 'GET'
      });
      return response;
    } catch (error) {
      console.error('Get FAQs error:', error);
      return [];
    }
  }

  // Get FAQ categories
  async getFAQCategories() {
    try {
      const response = await this.makeRequest('/faq/categories', {
        method: 'GET'
      });
      return response;
    } catch (error) {
      console.error('Get FAQ categories error:', error);
      return [];
    }
  }

  // Get FAQ by ID
  async getFAQById(id) {
    try {
      const response = await this.makeRequest(`/faq/${id}`, {
        method: 'GET'
      });
      return response;
    } catch (error) {
      console.error('Get FAQ by ID error:', error);
      return null;
    }
  }
  // Submit an Ask Our Expert query
  async submitExpertQuestion(questionData) {
    try {
      const response = await this.makeRequest('/ExpertQuery/submit', {
        method: 'POST',
        body: JSON.stringify(questionData),
      });
      return response;
    } catch (error) {
      console.error('Submit expert question error:', error);
      throw error;
    }
  }

  // Get user expert queries history
  async getUserExpertQuestions(userId) {
    try {
      const response = await this.makeRequest('/ExpertQuery/history', {
        method: 'GET',
      });
      if (Array.isArray(response)) return response;
      if (response && Array.isArray(response.data)) return response.data;
      if (response && Array.isArray(response.result)) return response.result;
      return [];
    } catch (error) {
      console.error('Get user expert questions error:', error);
      return [];
    }
  }

  // Get expert query categories
  async getExpertQueryCategories() {
    try {
      const response = await this.makeRequest('/ExpertQuery/categories', {
        method: 'GET',
      });
      if (Array.isArray(response)) return response;
      if (response && Array.isArray(response.data)) return response.data;
      if (response && Array.isArray(response.result)) return response.result;
      return [];
    } catch (error) {
      console.error('Get expert query categories error:', error);
      return [];
    }
  }

  // Get subscription plans
  async getSubscriptionPlans() {
    try {
      const response = await this.makeRequest('/Subscription/plans', {
        method: 'GET',
      });
      if (Array.isArray(response)) return response;
      if (response && Array.isArray(response.data)) return response.data;
      if (response && Array.isArray(response.result)) return response.result;
      return [];
    } catch (error) {
      console.error('Get subscription plans error:', error);
      return [];
    }
  }

  // Get ask expert site settings
  async getAskExpertSettings() {
    try {
      const response = await this.makeRequest('/Settings/ask-expert', {
        method: 'GET',
      });
      return response || {};
    } catch (error) {
      console.error('Get ask expert settings error:', error);
      return {};
    }
  }

  async getPublicLaunchFlags() {
    try {
      const response = await this.makeRequest('/Settings/public/launch-flags', {
        method: 'GET',
      });
      return response?.data || response || {};
    } catch (error) {
      console.error('Get public launch flags error:', error);
      return {
        enablePreRegistration: true,
        enableTshirtSales: false,
        ctaLabel: 'Pre-Register'
      };
    }
  }

  async submitPreRegistration(payload) {
    return await this.makeRequest('/PreRegister', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Email Verification Methods
  async sendSignupOtp(email) {
    try {
      return await this.makeRequest('/Account/send-signup-otp', {
        method: 'POST',
        body: JSON.stringify({ Email: email }),
      });
    } catch (error) {
      console.error('Send signup OTP error:', error);
      throw error;
    }
  }

  async verifySignupOtp(email, otpCode) {
    try {
      return await this.makeRequest('/Account/verify-signup-otp', {
        method: 'POST',
        body: JSON.stringify({ Email: email, OtpCode: otpCode }),
      });
    } catch (error) {
      console.error('Verify signup OTP error:', error);
      throw error;
    }
  }

  async verifyEmailOtp(data) {
    try {
      const response = await this.makeRequest('/Account/verify-email-otp', {
        method: 'POST',
        body: JSON.stringify({
          UserId: data.userId,
          OtpCode: data.otpCode
        }),
      });

      // Store token if verification successful
      if (response?.data?.Token) {
        localStorage.setItem('token', response.data.Token);
      }

      return response;
    } catch (error) {
      console.error('Verify email OTP error:', error);
      throw error;
    }
  }

  async resendVerificationEmail(data) {
    try {
      const response = await this.makeRequest('/Account/resend-verification-email', {
        method: 'POST',
        body: JSON.stringify({
          UserId: data.userId
        }),
      });

      return response;
    } catch (error) {
      console.error('Resend verification email error:', error);
      throw error;
    }
  }
}

export default new ApiService();
