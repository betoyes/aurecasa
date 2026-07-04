import axios from "axios";
import { API } from "./api";

const TOKEN_KEY = "aure_admin_token";

export const adminApi = axios.create({ baseURL: API });
adminApi.interceptors.request.use((cfg) => {
    const t = localStorage.getItem(TOKEN_KEY);
    if (t) cfg.headers.Authorization = `Bearer ${t}`;
    return cfg;
});

// Global 401 handler: clear token, notify, redirect to login
let _redirecting = false;
adminApi.interceptors.response.use(
    (r) => r,
    (err) => {
        if (err?.response?.status === 401 && !_redirecting) {
            _redirecting = true;
            try { localStorage.removeItem(TOKEN_KEY); } catch (_) {}
            import("sonner").then(({ toast }) => toast("Sua sessão expirou. Entre novamente."));
            const path = window.location.pathname;
            if (path.startsWith("/admin") && path !== "/admin/login") {
                window.location.replace("/admin/login");
            }
            setTimeout(() => { _redirecting = false; }, 2000);
        }
        return Promise.reject(err);
    },
);

export const saveToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export const adminLogin = (email, password) =>
    adminApi.post("/admin/login", { email, password }).then((r) => r.data);
export const adminVerify = () => adminApi.get("/admin/verify").then((r) => r.data);
export const adminUpload = (file) => {
    const fd = new FormData();
    fd.append("file", file);
    return adminApi.post("/admin/upload", fd, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data);
};
export const adminCreateProduct = (p) => adminApi.post("/admin/products", p).then((r) => r.data);
export const adminUpdateProductFull = (id, patch) => adminApi.patch(`/admin/products/${id}`, patch).then((r) => r.data);
export const adminDeleteProduct = (id) => adminApi.delete(`/admin/products/${id}`).then((r) => r.data);
export const adminUpdateOrder = (id, patch) => adminApi.patch(`/orders/${id}`, patch).then((r) => r.data);

// Admin-authenticated fetchers (use adminApi with token + 401 interceptor)
export const adminGetStats = () => adminApi.get("/admin/stats").then((r) => r.data);
export const adminGetProducts = () => adminApi.get("/admin/products").then((r) => r.data);
export const adminGetOrders = () => adminApi.get("/admin/orders").then((r) => r.data);
export const adminGetNewsletter = () => adminApi.get("/admin/newsletter").then((r) => r.data);
export const adminGetContacts = () => adminApi.get("/admin/contacts").then((r) => r.data);
