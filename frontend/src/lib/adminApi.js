import axios from "axios";
import { API } from "./api";

const TOKEN_KEY = "aure_admin_token";

export const adminApi = axios.create({ baseURL: API });
adminApi.interceptors.request.use((cfg) => {
    const t = localStorage.getItem(TOKEN_KEY);
    if (t) cfg.headers.Authorization = `Bearer ${t}`;
    return cfg;
});

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
