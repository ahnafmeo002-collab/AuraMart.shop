import { Product, Order, GlobalSettings, CartItem, CustomerProfile } from "../types";

const BASE_URL = ""; // Relative paths will cleanly route to Port 3000

function getHeaders() {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = localStorage.getItem("auramart_token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // Authentication
  async register(body: any) {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to register user account.");
    if (data.token) localStorage.setItem("auramart_token", data.token);
    return data;
  },

  async login(body: any) {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to authenticate keys.");
    if (data.token) localStorage.setItem("auramart_token", data.token);
    return data;
  },

  async adminLogin(body: any) {
    const res = await fetch(`${BASE_URL}/api/auth/admin-login`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Admin authentication failed.");
    if (data.token) localStorage.setItem("auramart_token", data.token);
    return data;
  },

  async getMe() {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: getHeaders(),
    });
    if (!res.ok) return null;
    return await res.json();
  },

  async updateProfile(body: any) {
    const res = await fetch(`${BASE_URL}/api/auth/profile`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    return await res.json();
  },

  // Products
  async getProducts(): Promise<Product[]> {
    const res = await fetch(`${BASE_URL}/api/products`);
    if (!res.ok) throw new Error("Failed to fetch product list.");
    return await res.json();
  },

  async getAdminProducts(): Promise<Product[]> {
    const res = await fetch(`${BASE_URL}/api/products/all`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch admin product list.");
    return await res.json();
  },

  async createProduct(body: any) {
    const res = await fetch(`${BASE_URL}/api/products`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to create product listing.");
    return data;
  },

  async updateProduct(id: string, body: any) {
    const res = await fetch(`${BASE_URL}/api/products/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    return await res.json();
  },

  async deleteProduct(id: string) {
    const res = await fetch(`${BASE_URL}/api/products/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return await res.json();
  },

  // Categories
  async getCategories() {
    const res = await fetch(`${BASE_URL}/api/categories`);
    return await res.json();
  },

  async createCategory(body: any) {
    const res = await fetch(`${BASE_URL}/api/categories`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    return await res.json();
  },

  async updateCategory(id: string, body: any) {
    const res = await fetch(`${BASE_URL}/api/categories/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    return await res.json();
  },

  async deleteCategory(id: string) {
    const res = await fetch(`${BASE_URL}/api/categories/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return await res.json();
  },

  // Orders
  async getOrders(): Promise<Order[]> {
    const res = await fetch(`${BASE_URL}/api/orders`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch orders feed.");
    return await res.json();
  },

  async createOrder(body: any) {
    const res = await fetch(`${BASE_URL}/api/orders`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to place transaction.");
    return data;
  },

  async updateOrderStatus(id: string, status: string) {
    const res = await fetch(`${BASE_URL}/api/orders/${id}/status`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    return await res.json();
  },

  async verifyPayment(id: string, txnId: string) {
    const res = await fetch(`${BASE_URL}/api/orders/${id}/verify-payment`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({ txnId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Payment verification failed.");
    return data;
  },

  // Settings
  async getSettings() {
    const res = await fetch(`${BASE_URL}/api/settings`);
    return await res.json();
  },

  async saveSettings(body: any) {
    const res = await fetch(`${BASE_URL}/api/settings`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    return await res.json();
  },

  // Coupons
  async getCoupon(code: string) {
    const res = await fetch(`${BASE_URL}/api/coupons/${code}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Invalid coupon.");
    return data;
  },

  async getAdminCoupons() {
    const res = await fetch(`${BASE_URL}/api/admin/coupons`, {
      headers: getHeaders(),
    });
    return await res.json();
  },

  async createCoupon(body: any) {
    const res = await fetch(`${BASE_URL}/api/admin/coupons`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    return await res.json();
  },

  async deleteCoupon(code: string) {
    const res = await fetch(`${BASE_URL}/api/admin/coupons/${code}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return await res.json();
  },

  // Reviews
  async getReviews(productId: string) {
    const res = await fetch(`${BASE_URL}/api/reviews/${productId}`);
    return await res.json();
  },

  async postReview(body: any) {
    const res = await fetch(`${BASE_URL}/api/reviews`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    return await res.json();
  },

  // SQL-Backed Wishlist sync
  async getWishlist() {
    const res = await fetch(`${BASE_URL}/api/wishlist`, {
      headers: getHeaders(),
    });
    if (!res.ok) return [];
    return await res.json();
  },

  async toggleWishlist(productId: string) {
    const res = await fetch(`${BASE_URL}/api/wishlist/toggle`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ productId }),
    });
    return await res.json();
  },

  // Admin Logs
  async getAdminLogs() {
    const res = await fetch(`${BASE_URL}/api/admin/logs`, {
      headers: getHeaders(),
    });
    return await res.json();
  },

  // AI Assistant Server Proxy (Keys hidden on back-end)
  async callAssistant(chatHistory: any[], availableProducts: Product[]) {
    const res = await fetch(`${BASE_URL}/api/assistant`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ chatHistory, availableProducts }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "AI agent offline.");
    return data;
  },
};
