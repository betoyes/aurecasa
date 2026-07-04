import axios from "axios";
import { API } from "./api";

// Sessão admin via cookie httpOnly (definido pelo backend no login).
// Nenhum token fica acessível a JavaScript — mitiga roubo por XSS.
const LEGACY_TOKEN_KEY = "aure_admin_token";
try { localStorage.removeItem(LEGACY_TOKEN_KEY); } catch { /* storage indisponível — ignorar */ }

export const adminApi = axios.create({ baseURL: API, withCredentials: true });

// Global 401 handler: notifica e redireciona para login
let _redirecting = false;
adminApi.interceptors.response.use(
    (r) => r,
    (err) => {
        if (err?.response?.status === 401 && !_redirecting && !err?.config?.skipAuthToast) {
            _redirecting = true;
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

export const adminLogin = (email, password) =>
    adminApi.post("/admin/login", { email, password }).then((r) => r.data);
export const adminLogout = () => adminApi.post("/admin/logout").then((r) => r.data);
// skipAuthToast: verificação inicial de sessão não deve exibir "sessão expirou" nem redirecionar (a página trata)
export const adminVerify = () => adminApi.get("/admin/verify", { skipAuthToast: true }).then((r) => r.data);
export const adminUpload = (file) => {
    const fd = new FormData();
    fd.append("file", file);
    return adminApi.post("/admin/upload", fd, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data);
};
export const adminCreateProduct = (p) => adminApi.post("/admin/products", p).then((r) => r.data);
export const adminUpdateProductFull = (id, patch) => adminApi.patch(`/admin/products/${id}`, patch).then((r) => r.data);
export const adminDeleteProduct = (id) => adminApi.delete(`/admin/products/${id}`).then((r) => r.data);
export const adminUpdateOrder = (id, patch) => adminApi.patch(`/orders/${id}`, patch).then((r) => r.data);

// Admin-authenticated fetchers (cookie httpOnly + 401 interceptor)
export const adminGetStats = () => adminApi.get("/admin/stats").then((r) => r.data);
export const adminGetProducts = () => adminApi.get("/admin/products").then((r) => r.data);
export const adminGetOrders = () => adminApi.get("/admin/orders").then((r) => r.data);
export const adminGetNewsletter = () => adminApi.get("/admin/newsletter").then((r) => r.data);
export const adminGetContacts = () => adminApi.get("/admin/contacts").then((r) => r.data);
