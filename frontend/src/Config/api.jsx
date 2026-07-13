import axios from "axios";
import { BACKEND_API_URL } from "../Config/url";

export const api = axios.create({
  baseURL: BACKEND_API_URL,
  // Without a timeout a hung request never settles, leaving shared loading
  // flags (e.g. auth.isLoading, which drives the login spinner) stuck on.
  timeout: 30000,
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    const authData = localStorage.getItem("persist:auth");

    if (authData) {
      const parsedAuthData = JSON.parse(authData);
      
      // Check if accessToken exists in parsedAuthData
      const accessToken = parsedAuthData?.accessToken?.split('"')[1];

      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

