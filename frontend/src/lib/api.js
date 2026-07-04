import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API });

export const getProducts = (params = {}) =>
    api.get("/products", { params }).then((r) => r.data);
export const getProduct = (slug) =>
    api.get(`/products/${slug}`).then((r) => r.data);
export const getCategories = () =>
    api.get("/categories").then((r) => r.data);
export const validateCoupon = (code, subtotal) =>
    api.post("/coupons/validate", { code, subtotal }).then((r) => r.data);
export const checkCEP = (cep) =>
    api.post("/shipping/cep", { cep }).then((r) => r.data);
export const subscribeNewsletter = (email, name) =>
    api.post("/newsletter", { email, name }).then((r) => r.data);
export const sendContact = (data) =>
    api.post("/contact", data).then((r) => r.data);
export const createOrder = (order) =>
    api.post("/orders", order).then((r) => r.data);
export const getOrder = (id) => api.get(`/orders/${id}`).then((r) => r.data);
export const listOrders = () => api.get("/orders").then((r) => r.data);
export const updateOrder = (id, patch) =>
    api.patch(`/orders/${id}`, patch).then((r) => r.data);
export const adminStats = () => api.get("/admin/stats").then((r) => r.data);
export const adminProducts = () =>
    api.get("/admin/products").then((r) => r.data);
export const adminUpdateProduct = (id, patch) =>
    api.patch(`/admin/products/${id}`, patch).then((r) => r.data);
export const adminNewsletter = () =>
    api.get("/admin/newsletter").then((r) => r.data);
export const adminContacts = () =>
    api.get("/admin/contacts").then((r) => r.data);
