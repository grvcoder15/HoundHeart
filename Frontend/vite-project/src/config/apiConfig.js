// API Configuration for .NET 8 Backend
export const API_CONFIG = {
  // Your .NET 8 API URL
  BASE_URL: import.meta.env.VITE_API_URL,

  ENDPOINTS: {
    AUTH: {
      REGISTER: '/Account/register',
      LOGIN: '/Account/login'
    },
    USER: {
      UPDATE_PROFILE: '/Account/add-userprofile'
    },
    CHECKINS: {
      UPDATE_USER_CHECKINS: '/UserCheckIn/UpdateUserCheckIns'
    },
    CHAKRA: {
      GET_ALL: '/Chakra/chakrasList'
    }
  },

  // Request timeout
  TIMEOUT: 10000, // 10 seconds

  // Retry attempts for failed requests
  RETRY_ATTEMPTS: 3
};

export default API_CONFIG;
