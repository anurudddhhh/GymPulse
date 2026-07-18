import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Clerk session token injector.
// This is set once at app startup from App.jsx using the setTokenGetter function.
// Every outgoing request automatically gets the Authorization header.
let getTokenFn = null;

export function setTokenGetter(fn) {
  getTokenFn = fn;
}

api.interceptors.request.use(async (config) => {
  if (getTokenFn) {
    try {
      const token = await getTokenFn();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Token retrieval failed -- let the request proceed without auth.
      // The backend will return 401, which each page handles individually.
    }
  }
  return config;
});

export default api;
