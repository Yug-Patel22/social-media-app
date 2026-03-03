import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api"
});

export const withClerkHeader = (clerkId) => ({
  headers: { "x-clerk-id": clerkId }
});

export default api;
