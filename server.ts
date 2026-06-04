import express from "express";
import path from "path";
import Database from "better-sqlite3";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || "auramart-secret-key-2026-secure-jwt";
const PORT = 3000;

// Initialize Express
const app = express();
app.use(express.json());

// Initialize SQLite backend database
const db = new Database("auramart.sqlite", { verbose: console.log });

// Enable Write-Ahead Logging for better speed & concurrency
db.pragma("journal_mode = WAL");

// Database Schema Setup
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    city TEXT,
    is_verified INTEGER DEFAULT 0,
    verification_token TEXT,
    reset_token TEXT,
    role TEXT DEFAULT 'customer', -- 'customer', 'admin', 'seller'
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    seller_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price REAL NOT NULL,
    wholesale_price REAL NOT NULL,
    category TEXT NOT NULL,
    image_url TEXT NOT NULL,
    gallery TEXT, -- JSON array of strings
    variants TEXT, -- JSON array
    stock_count INTEGER DEFAULT 0,
    sku TEXT UNIQUE,
    status TEXT DEFAULT 'active', -- 'active', 'draft', 'archived'
    for_gender TEXT DEFAULT 'Unisex', -- 'Boys', 'Girls', 'Unisex'
    colors TEXT, -- JSON array
    sizes TEXT, -- JSON array
    is_popular INTEGER DEFAULT 0,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    parent_id TEXT,
    image_url TEXT,
    seo_title TEXT,
    seo_description TEXT,
    seo_keywords TEXT,
    level INTEGER DEFAULT 1,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    buyer_name TEXT NOT NULL,
    buyer_phone TEXT NOT NULL,
    buyer_address TEXT NOT NULL,
    buyer_city TEXT NOT NULL,
    subtotal REAL NOT NULL,
    shipping_cost REAL NOT NULL,
    total_amount REAL NOT NULL,
    payment_method TEXT NOT NULL, -- 'JazzCash', 'Easypaisa', 'Bank Transfer', 'COD'
    status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'refunded'
    payment_confirmed INTEGER DEFAULT 0,
    txn_id TEXT UNIQUE,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    product_title TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    selected_color TEXT NOT NULL,
    selected_size TEXT NOT NULL,
    image_url TEXT,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    user_id TEXT,
    user_name TEXT NOT NULL,
    rating INTEGER DEFAULT 5,
    comment TEXT,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS coupons (
    code TEXT PRIMARY KEY,
    discount_amount REAL NOT NULL,
    is_percentage INTEGER DEFAULT 0,
    active INTEGER DEFAULT 1,
    expiry_date TEXT
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS wishlist (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS cart (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    selected_color TEXT,
    selected_size TEXT
  );

  CREATE TABLE IF NOT EXISTS activity_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    action TEXT NOT NULL,
    ip_address TEXT,
    created_at TEXT
  );
`);

// Safe Dynamic Migrations for Coupons Integration
try {
  db.exec("ALTER TABLE orders ADD COLUMN coupon_code TEXT;");
} catch (e) {
  // Already exists
}
try {
  db.exec("ALTER TABLE orders ADD COLUMN discount_amount REAL DEFAULT 0;");
} catch (e) {
  // Already exists
}

// Active dynamic override of admin credentials requested by user
try {
  const customAdminEmail = "ahnafmeo002@gmail.com";
  const customAdminPass = "ahnafgaming13";
  const customAdminHash = bcrypt.hashSync(customAdminPass, 10);
  
  // Clean up any old duplicate or bad role settings
  const existingAdmin = db.prepare("SELECT * FROM users WHERE role = 'admin'").get() as any;
  if (existingAdmin) {
    db.prepare("UPDATE users SET email = ?, password_hash = ? WHERE role = 'admin'").run(customAdminEmail, customAdminHash);
    console.log("Dynamically updated existing administrative record with target email and password keys.");
  } else {
    db.prepare("INSERT INTO users (id, email, password_hash, name, phone, address, city, is_verified, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .run("usr-admin", customAdminEmail, customAdminHash, "System Director", "+923202838491", "Central Operations", "Karachi", 1, "admin", new Date().toISOString());
    console.log("Created fresh administrative database entry with standard permission level tier.");
  }
} catch (err: any) {
  console.error("Platform admin key synchronization failed: ", err.message);
}

// Authentication middleware
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      req.user = null;
      return next();
    }
    req.user = user;
    next();
  });
}

function requireAuth(req: any, res: any, next: any) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required to call this resource." });
  }
  next();
}

function requireAdmin(req: any, res: any, next: any) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied. Administrator privileges strictly required." });
  }
  next();
}

// Global Activity Logging Helper
function logActivity(userId: string | null, action: string, ip: string = "localhost") {
  try {
    const id = `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const stmt = db.prepare("INSERT INTO activity_logs (id, user_id, action, ip_address, created_at) VALUES (?, ?, ?, ?, ?)");
    stmt.run(id, userId, action, ip, new Date().toISOString());
  } catch (err) {
    console.error("Failed to insert activity logs:", err);
  }
}

// SEED DB IF EMPTY
const checkUsers = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
if (checkUsers.count === 0) {
  console.log("Seeding databases with initialized configurations and security records...");
  
  // Hash Passwords
  const adminHash = bcrypt.hashSync("ahnafgaming13", 10);
  const customerHash = bcrypt.hashSync("CustomerSecure@2026!", 10);
  const sellerHash = bcrypt.hashSync("SellerSecure@2026!", 10);

  // Users
  const userInsert = db.prepare("INSERT INTO users (id, email, password_hash, name, phone, address, city, is_verified, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  userInsert.run("usr-admin", "ahnafmeo002@gmail.com", adminHash, "System Director", "+923202838491", "Central Operations", "Karachi", 1, "admin", new Date().toISOString());
  userInsert.run("usr-customer", "customer@auramart.shop", customerHash, "Ahnaf Ali", "03202838491", "Boutique Center, Tariq Road", "Karachi", 1, "customer", new Date().toISOString());
  userInsert.run("usr-seller", "seller@auramart.shop", sellerHash, "Fatima Boutique", "+923001234567", "Designer Lane, Tariq Road", "Karachi", 1, "seller", new Date().toISOString());

  // Products
  const prodInsert = db.prepare(`
    INSERT INTO products (id, seller_id, title, description, price, wholesale_price, category, image_url, gallery, variants, stock_count, sku, status, for_gender, colors, sizes, is_popular, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  prodInsert.run(
    "prod-1", 
    "usr-seller", 
    "Aura Luxe Chunky Sneakers", 
    "Premium streetwear chunky sneakers with customized multi-panel aesthetic. Absolute luxury comfort with heavy cushioned insoles, perfect for everyday retro pairing.",
    4950, 3450, "Shoes", 
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800",
    JSON.stringify(["https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800"]),
    JSON.stringify([{ name: "Color", options: ["Alabaster White", "Shadow Black"] }]),
    21, "SKU-SNEAK-LUXE-01", "active", "Unisex", 
    JSON.stringify(["Alabaster White", "Shadow Black"]),
    JSON.stringify(["40", "41", "42", "43"]),
    1, new Date().toISOString()
  );
  prodInsert.run(
    "prod-2", 
    "usr-seller", 
    "Retro Running Athletic Joggers", 
    "Ultra-light breathable knit mesh running joggers with rubberized traction soles. Engineered for high performance luxury athleisure styles.",
    3950, 2850, "Shoes", 
    "https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&q=80&w=800",
    JSON.stringify(["https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&q=80&w=800"]),
    JSON.stringify([{ name: "Size", options: ["40", "41", "42", "43"] }]),
    19, "SKU-JOG-RUN-02", "active", "Boys", 
    JSON.stringify(["Stealth Black", "Sunset Orange"]),
    JSON.stringify(["40", "41", "42", "43"]),
    1, new Date().toISOString()
  );
  prodInsert.run(
    "prod-3", 
    "usr-seller", 
    "Premium Handcrafted Leather Tote", 
    "Elegant girls designer leather handbag with soft suede internal lining, sleek custom polished hardware, and an adjustable luxury strap.",
    4500, 2900, "Bags", 
    "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=800",
    JSON.stringify(["https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=800"]),
    JSON.stringify([{ name: "Color", options: ["Tan Brown", "Classic Black"] }]),
    8, "SKU-BAG-TOTE-03", "active", "Girls", 
    JSON.stringify(["Tan Brown", "Classic Black"]),
    JSON.stringify(["Medium Style"]),
    1, new Date().toISOString()
  );
  prodInsert.run(
    "prod-4", 
    "usr-admin", 
    "Royal Sovereign Oyster Gold Watch", 
    "Heavy analogue gold quartz watch featuring scratch-resistant sapphire display, classic date lens, and brilliant dual-locking metallic clasp.",
    6500, 3900, "Watches", 
    "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&q=80&w=800",
    JSON.stringify(["https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&q=80&w=800"]),
    JSON.stringify([{ name: "Color", options: ["Imperial Gold", "Sovereign Silver"] }]),
    5, "SKU-WCH-GOLD-04", "active", "Boys", 
    JSON.stringify(["Imperial Gold", "Sovereign Silver"]),
    JSON.stringify(["Classic 40mm"]),
    1, new Date().toISOString()
  );

  // Settings
  const settingInsert = db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)");
  settingInsert.run("karachi_shipping_charge", "300");
  settingInsert.run("other_cities_shipping_charge", "350");
  settingInsert.run("admin_whatsapp", "+923202838491");
  settingInsert.run("website_name", "Aura Mart");
  settingInsert.run("tagline", "Premium Luxury Styles at Wholesale Rates");
  settingInsert.run("ai_system_prompt", "You are the helpful AI shopping assistant for AuraMart pakistan.");

  // Categories
  const catInsert = db.prepare("INSERT INTO categories (id, name, parent_id, image_url, seo_title, seo_description, seo_keywords, level, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
  catInsert.run("cat-1", "Shoes", null, "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800", "Shoes Collection", "Buy shoes at wholesale", "shoes, sneakers", 1, new Date().toISOString());
  catInsert.run("cat-2", "Bags", null, "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=800", "Bags online", "Handbags at wholesale prices", "bags, leather handbags", 1, new Date().toISOString());
  catInsert.run("cat-3", "Watches", null, "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&q=80&w=800", "Watches core", "Quartz & analog wristwatches", "watches, accessories", 1, new Date().toISOString());
  catInsert.run("cat-4", "Fancy Tees", null, "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=800", "Luxury Tshirts", "Streetwear Tees", "tees, custom premium streetwear", 1, new Date().toISOString());
  catInsert.run("cat-5", "Home Essentials", null, "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=800", "Home accessories", "Decoration essentials", "home, decoration", 1, new Date().toISOString());

  // Coupons
  const couponInsert = db.prepare("INSERT INTO coupons (code, discount_amount, is_percentage, active, expiry_date) VALUES (?, ?, ?, ?, ?)");
  couponInsert.run("AURAMART10", 10, 1, 1, "2027-12-31");
  couponInsert.run("WELCOME500", 500, 0, 1, "2027-12-31");
}

// ---------------------- REST API ENDPOINTS ----------------------

// 1. AUTHENTICATION ENDPOINTS
app.post("/api/auth/register", (req, res) => {
  const { email, password, name, phone, address, city, role } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: "Missing required fields for signup." });
  }

  try {
    const existing = db.prepare("SELECT * FROM users WHERE email = ?").get(email.toLowerCase().trim());
    if (existing) {
      return res.status(400).json({ error: "An account with this email already exists." });
    }

    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password, salt);
    const id = `usr-${Date.now()}`;
    const userRole = role || "customer";

    // Create user record
    db.prepare(`
      INSERT INTO users (id, email, password_hash, name, phone, address, city, is_verified, role, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, email.toLowerCase().trim(), password_hash, name, phone || "", address || "", city || "", 0, userRole, new Date().toISOString());

    logActivity(id, `Registered as new user (${userRole})`);

    const token = jwt.sign({ id, email, role: userRole }, JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({
      token,
      user: { id, email, name, phone, address, city, role: userRole, is_verified: 0 }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are both required." });
  }

  try {
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email.toLowerCase().trim()) as any;
    if (!user) {
      return res.status(401).json({ error: "No user found with those credentials." });
    }

    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: "Incorrect, keys failed secure audit match." });
    }

    logActivity(user.id, "Successfully logged in securely");

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        address: user.address,
        city: user.city,
        role: user.role,
        is_verified: user.is_verified
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Dedicated Check
app.post("/api/auth/admin-login", (req, res) => {
  const { email, password } = req.body;
  if (email !== "ahnafmeo002@gmail.com") {
    return res.status(403).json({ error: "Incorrect administrative email address badge!" });
  }
  try {
    const user = db.prepare("SELECT * FROM users WHERE email = ? AND role = 'admin'").get(email) as any;
    if (!user) {
      return res.status(403).json({ error: "Incorrect administrative authorization!" });
    }
    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: "Administrative password check failed security." });
    }
    logActivity(user.id, "Admin logged into secure portal");
    const token = jwt.sign({ id: user.id, email: user.email, role: "admin" }, JWT_SECRET, { expiresIn: "1d" });
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: "admin" }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Mock operations for verification & forgotten password
app.post("/api/auth/forgot-password", (req, res) => {
  const { email } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
  if (!user) {
    return res.status(404).json({ error: "Email target not registered." });
  }
  const mockToken = `reset-${Date.now()}`;
  db.prepare("UPDATE users SET reset_token = ? WHERE id = ?").run(mockToken, user.id);
  logActivity(user.id, "Requested password reset instructions");
  res.json({ message: "Password reset link generated!", resetToken: mockToken });
});

app.post("/api/auth/reset-password", (req, res) => {
  const { token, newPassword } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE reset_token = ?").get(token) as any;
  if (!user) {
    return res.status(400).json({ error: "Invalid or expired token." });
  }
  const password_hash = bcrypt.hashSync(newPassword, 10);
  db.prepare("UPDATE users SET password_hash = ?, reset_token = NULL WHERE id = ?").run(password_hash, user.id);
  logActivity(user.id, "Password reset succeeded");
  res.json({ message: "Password successfully updated." });
});

app.post("/api/auth/verify-email", (req, res) => {
  const { token } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE verification_token = ?").get(token) as any;
  if (user) {
    db.prepare("UPDATE users SET is_verified = 1, verification_token = NULL WHERE id = ?").run(user.id);
    logActivity(user.id, "Completed email verification");
    return res.json({ message: "Verification completed successfully." });
  }
  res.status(400).json({ error: "Invalid verification code." });
});

app.get("/api/auth/me", authenticateToken, requireAuth, (req, res) => {
  const user = db.prepare("SELECT id, email, name, phone, address, city, role, is_verified FROM users WHERE id = ?").get(req.user.id) as any;
  if (!user) return res.status(404).json({ error: "User profile not found." });
  res.json({ user });
});

// Update Profile
app.put("/api/auth/profile", authenticateToken, requireAuth, (req, res) => {
  const { name, phone, address, city } = req.body;
  try {
    db.prepare("UPDATE users SET name = ?, phone = ?, address = ?, city = ? WHERE id = ?")
      .run(name, phone, address, city, req.user.id);
    logActivity(req.user.id, "Updated personal profile settings");
    res.json({ message: "Profile successfully saved." });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. PRODUCT MANAGEMENT API
app.get("/api/products", (req, res) => {
  try {
    const products = db.prepare("SELECT * FROM products WHERE status = 'active'").all() as any[];
    const parsed = products.map(p => ({
      ...p,
      gallery: p.gallery ? JSON.parse(p.gallery) : [],
      variants: p.variants ? JSON.parse(p.variants) : [],
      colors: p.colors ? JSON.parse(p.colors) : [],
      sizes: p.sizes ? JSON.parse(p.sizes) : [],
      isPopular: p.is_popular === 1,
    }));
    res.json(parsed);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/products/all", authenticateToken, (req, res) => {
  // Admin or Seller can view ALL status products
  try {
    const products = db.prepare("SELECT * FROM products").all() as any[];
    res.json(products.map(p => ({
      ...p,
      gallery: p.gallery ? JSON.parse(p.gallery) : [],
      variants: p.variants ? JSON.parse(p.variants) : [],
      colors: p.colors ? JSON.parse(p.colors) : [],
      sizes: p.sizes ? JSON.parse(p.sizes) : [],
      isPopular: p.is_popular === 1,
    })));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/products", authenticateToken, (req, res) => {
  const { title, description, price, wholesalePrice, category, imageUrl, stockCount, sku, forGender, colors, sizes, isPopular, status } = req.body;
  if (!title || !price || !category || !imageUrl) {
    return res.status(400).json({ error: "Missing required core product metadata." });
  }

  const generatedSku = sku || `SKU-${category.slice(0,3).toUpperCase()}-${Date.now().toString().slice(-4)}`;

  try {
    const id = `prod-${Date.now()}`;
    const sellerId = req.user?.id || "usr-seller";
    
    db.prepare(`
      INSERT INTO products (id, seller_id, title, description, price, wholesale_price, category, image_url, gallery, variants, stock_count, sku, status, for_gender, colors, sizes, is_popular, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      sellerId,
      title,
      description || "",
      Number(price),
      Number(wholesalePrice || price * 0.7),
      category,
      imageUrl,
      JSON.stringify([imageUrl]),
      JSON.stringify([]),
      Number(stockCount || 0),
      generatedSku,
      status || "active",
      forGender || "Unisex",
      JSON.stringify(colors || []),
      JSON.stringify(sizes || []),
      isPopular ? 1 : 0,
      new Date().toISOString()
    );

    logActivity(req.user?.id || "system", `Added product ${title} (${generatedSku})`);
    res.status(201).json({ message: "Product created", id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/products/:id", authenticateToken, (req, res) => {
  const { title, description, price, wholesalePrice, category, imageUrl, stockCount, status, forGender, colors, sizes, isPopular } = req.body;
  const { id } = req.params;

  try {
    db.prepare(`
      UPDATE products 
      SET title = ?, description = ?, price = ?, wholesale_price = ?, category = ?, image_url = ?, stock_count = ?, status = ?, for_gender = ?, colors = ?, sizes = ?, is_popular = ?
      WHERE id = ?
    `).run(
      title,
      description,
      Number(price),
      Number(wholesalePrice),
      category,
      imageUrl,
      Number(stockCount),
      status,
      forGender,
      JSON.stringify(colors || []),
      JSON.stringify(sizes || []),
      isPopular ? 1 : 0,
      id
    );

    logActivity(req.user?.id || "system", `Updated product ID: ${id}`);
    res.json({ message: "Product updated successfully." });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/products/:id", authenticateToken, (req, res) => {
  try {
    db.prepare("DELETE FROM products WHERE id = ?").run(req.params.id);
    logActivity(req.user?.id || "system", `Deleted product ID: ${req.params.id}`);
    res.json({ message: "Product deleted successfully." });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. CATEGORY MANAGEMENT API
app.get("/api/categories", (req, res) => {
  try {
    const cats = db.prepare("SELECT * FROM categories").all();
    res.json(cats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/categories", authenticateToken, (req, res) => {
  const { name, parent_id, image_url, seo_title, seo_description, seo_keywords, level } = req.body;
  if (!name) return res.status(400).json({ error: "Category name required." });
  try {
    const id = `cat-${Date.now()}`;
    db.prepare(`
      INSERT INTO categories (id, name, parent_id, image_url, seo_title, seo_description, seo_keywords, level, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      name,
      parent_id || null,
      image_url || "",
      seo_title || name,
      seo_description || "",
      seo_keywords || "",
      Number(level || 1),
      new Date().toISOString()
    );
    res.status(201).json({ message: "Category created.", id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/categories/:id", authenticateToken, (req, res) => {
  const { name, parent_id, image_url, seo_title, seo_description, seo_keywords, level } = req.body;
  try {
    db.prepare(`
      UPDATE categories
      SET name = ?, parent_id = ?, image_url = ?, seo_title = ?, seo_description = ?, seo_keywords = ?, level = ?
      WHERE id = ?
    `).run(name, parent_id, image_url, seo_title, seo_description, seo_keywords, Number(level || 1), req.params.id);
    res.json({ message: "Category updated successfully." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/categories/:id", authenticateToken, (req, res) => {
  try {
    db.prepare("DELETE FROM categories WHERE id = ?").run(req.params.id);
    res.json({ message: "Category deleted." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. ORDER MANAGEMENT API
app.get("/api/orders", authenticateToken, (req, res) => {
  try {
    let orders: any[] = [];
    if (req.user?.role === "admin") {
      orders = db.prepare("SELECT * FROM orders ORDER BY created_at DESC").all();
    } else {
      orders = db.prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC").all(req.user?.id || "");
    }

    const itemsPrep = db.prepare("SELECT * FROM order_items WHERE order_id = ?");
    const populated = orders.map(ord => {
      const items = itemsPrep.all(ord.id) as any[];
      return {
        ...ord,
        items: items.map(itm => ({
          productId: itm.product_id,
          productTitle: itm.product_title,
          quantity: itm.quantity,
          price: itm.price,
          selectedColor: itm.selected_color,
          selectedSize: itm.selected_size,
          imageUrl: itm.image_url,
        })),
        paymentConfirmed: ord.payment_confirmed === 1,
        couponCode: ord.coupon_code || null,
        discountAmount: ord.discount_amount || 0,
      };
    });

    res.json(populated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/orders", authenticateToken, (req, res) => {
  const { buyerName, buyerPhone, buyerAddress, buyerCity, items, paymentMethod, txnId, couponCode, discountAmount } = req.body;
  if (!buyerName || !buyerPhone || !buyerAddress || !items || items.length === 0) {
    return res.status(400).json({ error: "Missing checkout parameters." });
  }

  try {
    const karachiCost = Number(db.prepare("SELECT value FROM settings WHERE key='karachi_shipping_charge'").get()?.value || 300);
    const otherCost = Number(db.prepare("SELECT value FROM settings WHERE key='other_cities_shipping_charge'").get()?.value || 350);

    const isKarachi = buyerCity.toLowerCase().trim().includes("karachi");
    const shippingCost = isKarachi ? karachiCost : otherCost;

    let subtotal = 0;
    for (const it of items) {
      subtotal += Number(it.price) * Number(it.quantity);
    }

    let discountVal = Number(discountAmount || 0);
    if (couponCode) {
      const dbCoupon = db.prepare("SELECT * FROM coupons WHERE code = ? AND active = 1").get(String(couponCode).toUpperCase().trim()) as any;
      if (dbCoupon) {
        const calculatedDiscount = dbCoupon.is_percentage
          ? Math.round(subtotal * (Number(dbCoupon.discount_amount) / 100))
          : Number(dbCoupon.discount_amount);
        discountVal = Math.min(subtotal, Math.max(0, calculatedDiscount));
      } else {
        discountVal = 0;
      }
    } else {
      discountVal = 0;
    }

    const totalAmount = Math.max(0, subtotal - discountVal) + shippingCost;
    const orderId = `AM-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 90 + 10)}`;
    const userId = req.user?.id || null;

    db.prepare(`
      INSERT INTO orders (id, user_id, buyer_name, buyer_phone, buyer_address, buyer_city, subtotal, shipping_cost, total_amount, payment_method, status, payment_confirmed, txn_id, created_at, coupon_code, discount_amount)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      orderId,
      userId,
      buyerName,
      buyerPhone,
      buyerAddress,
      buyerCity,
      subtotal,
      shippingCost,
      totalAmount,
      paymentMethod,
      "pending",
      txnId ? 1 : 0,
      txnId || null,
      new Date().toISOString(),
      couponCode ? String(couponCode).toUpperCase().trim() : null,
      discountVal
    );

    const itemInsert = db.prepare(`
      INSERT INTO order_items (id, order_id, product_id, product_title, quantity, price, selected_color, selected_size, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const updateStock = db.prepare("UPDATE products SET stock_count = max(0, stock_count - ?) WHERE id = ?");

    for (const it of items) {
      itemInsert.run(
        `itm-${Date.now()}-${Math.random().toString().slice(2,6)}`,
        orderId,
        it.productId,
        it.productTitle,
        it.quantity,
        it.price,
        it.selectedColor || "Standard",
        it.selectedSize || "Medium",
        it.imageUrl || ""
      );
      updateStock.run(it.quantity, it.productId);
    }

    logActivity(userId, `Completed transaction. Created Order ID: ${orderId}`);

    res.status(201).json({
      message: "Order placed successfully",
      orderId,
      totalAmount,
      shippingCost
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/orders/:id/status", authenticateToken, (req, res) => {
  const { status } = req.body;
  try {
    db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, req.params.id);
    logActivity(req.user?.id || "system", `Modified status of Order ${req.params.id} to ${status}`);
    res.json({ message: "Status adjusted successfully." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/orders/:id/verify-payment", authenticateToken, (req, res) => {
  const { txnId } = req.body;
  try {
    db.prepare("UPDATE orders SET payment_confirmed = 1, txn_id = ? WHERE id = ?").run(txnId, req.params.id);
    logActivity(req.user?.id || "system", `Confirmed payment txn ${txnId} for order ${req.params.id}`);
    res.json({ message: "Payment validated and verified successfully." });
  } catch (err: any) {
    res.status(400).json({ error: "Transaction ID is already linked to another order." });
  }
});

// 5. SETTINGS API
app.get("/api/settings", (req, res) => {
  try {
    const list = db.prepare("SELECT * FROM settings").all();
    const map: any = {};
    list.forEach((item: any) => {
      map[item.key] = item.value;
    });
    res.json(map);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/settings", authenticateToken, requireAdmin, (req, res) => {
  try {
    const upsert = db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value");
    Object.keys(req.body).forEach(key => {
      upsert.run(key, String(req.body[key]));
    });
    logActivity(req.user.id, "Saved global platform configurations and settings");
    res.json({ message: "Website configurations saved successfully." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. COUPON VERIFICATION
app.get("/api/coupons/:code", (req, res) => {
  try {
    const coupon = db.prepare("SELECT * FROM coupons WHERE code = ? AND active = 1").get(req.params.code.toUpperCase()) as any;
    if (!coupon) {
      return res.status(404).json({ error: "This coupon code is invalid or has expired." });
    }
    res.json(coupon);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Coupon Management
app.get("/api/admin/coupons", authenticateToken, requireAdmin, (req, res) => {
  const list = db.prepare("SELECT * FROM coupons").all();
  res.json(list);
});

app.post("/api/admin/coupons", authenticateToken, requireAdmin, (req, res) => {
  const { code, discount_amount, is_percentage, expiry_date } = req.body;
  try {
    db.prepare("INSERT INTO coupons (code, discount_amount, is_percentage, active, expiry_date) VALUES (?, ?, ?, ?, ?)")
      .run(code.toUpperCase().trim(), Number(discount_amount), is_percentage ? 1 : 0, 1, expiry_date || "2027-12-31");
    res.status(201).json({ message: "Coupon code generated successfully." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/admin/coupons/:code", authenticateToken, requireAdmin, (req, res) => {
  db.prepare("DELETE FROM coupons WHERE code = ?").run(req.params.code.toUpperCase());
  res.json({ message: "Coupon deleted." });
});

// 7. PRODUCT REVIEWS & RATING STAR FEEDBACK
app.post("/api/reviews", authenticateToken, (req, res) => {
  const { productId, rating, comment } = req.body;
  if (!productId || !rating) return res.status(400).json({ error: "Product and rating score are required." });
  try {
    const id = `rev-${Date.now()}`;
    const name = req.user?.name || "Verified Customer";
    db.prepare(`
      INSERT INTO reviews (id, product_id, user_id, user_name, rating, comment, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, productId, req.user?.id || null, name, Number(rating), comment || "", new Date().toISOString());
    logActivity(req.user?.id || null, `Left review for product ID: ${productId}`);
    res.status(201).json({ message: "Review posted successfully!" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/reviews/:productId", (req, res) => {
  try {
    const list = db.prepare("SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC").all(req.params.productId);
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8. WISHLIST BACKEND ENDPOINTS
app.get("/api/wishlist", authenticateToken, requireAuth, (req, res) => {
  const list = db.prepare("SELECT product_id FROM wishlist WHERE user_id = ?").all(req.user.id) as any[];
  res.json(list.map(item => item.product_id));
});

app.post("/api/wishlist/toggle", authenticateToken, requireAuth, (req, res) => {
  const { productId } = req.body;
  const existing = db.prepare("SELECT * FROM wishlist WHERE user_id = ? AND product_id = ?").get(req.user.id, productId) as any;
  if (existing) {
    db.prepare("DELETE FROM wishlist WHERE user_id = ? AND product_id = ?").run(req.user.id, productId);
    res.json({ status: "removed", productId });
  } else {
    const id = `wish-${Date.now()}`;
    db.prepare("INSERT INTO wishlist (id, user_id, product_id, created_at) VALUES (?, ?, ?, ?)")
      .run(id, req.user.id, productId, new Date().toISOString());
    res.json({ status: "added", productId });
  }
});

// 9. RECENT LOGS FOR ADMIN AUDITING
app.get("/api/admin/logs", authenticateToken, requireAdmin, (req, res) => {
  try {
    const list = db.prepare("SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 100").all();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 10. AI ASSISTANT CUSTOMER AGENT ROUTE (Lazy Initialization & Safe Secrets)
app.post("/api/assistant", async (req, res) => {
  const { chatHistory, availableProducts } = req.body;
  if (!chatHistory || !availableProducts) {
    return res.status(400).json({ error: "Missing conversation history parameters." });
  }

  // Check key exists
  const tokenKey = process.env.GEMINI_API_KEY;
  if (!tokenKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not defined in the backend server context example." });
  }

  try {
    // Lazy initialized model client
    const aiInstance = new GoogleGenAI({ apiKey: tokenKey });

    // Fetch dynamic administrator workspace guidelines
    const configRows = db.prepare("SELECT * FROM settings").all() as any[];
    const configMap: any = {};
    configRows.forEach((item: any) => {
      configMap[item.key] = item.value;
    });

    const runtimeWebsiteName = configMap["website_name"] || "Aura Mart";
    const runtimeTagline = configMap["tagline"] || "Premium Luxury Styles at Wholesale Rates";
    const customPromptGuidelines = configMap["ai_system_prompt"] || "You are the AI Personal Style Consultant & Customer Support Agent for of that brand.";

    const systemPrompt = `
You are the AI Personal Style Consultant & Customer Support Agent for "${runtimeWebsiteName}" (https://wa.me/923202838491), the premier Pakistan boutique marketplace.
Slogan: "${runtimeWebsiteName} - ${runtimeTagline}"

Additional Custom Directives From Administrator settings:
"${customPromptGuidelines}"

The currently active catalog of live products is:
${JSON.stringify(availableProducts, null, 2)}

Logistics facts:
- Karachi Delivery cost/charge: 300 PKR (Takes 24-48 hours rapid delivery)
- Other Cities Courier cost/charge: 350 PKR (Takes 3-5 standard working delivery days)
- Secure Payment Options: JazzCash, Easypaisa, Bank Direct Transfers, and Cash on Delivery (COD).

Your instructions:
1. Provide highly professional, helpful, warm responses.
2. Infuse premium English and warm South Asian / Urdu / Hinglish words where fitting (e.g. "Aap ke liye", "Welcome! Yeh product bilkul exclusive hai").
3. Remind users of 24/7 delivery tracking support.
4. Help customers with sizing questions and payment confidence.
5. If recommending products, MUST match exact ids from the catalog.

Return response strictly as a JSON matching this structure:
{
  "reply": "friendly paragraph chat reply",
  "recommendedProductIds": ["prod-id-1", "prod-id-2"]
}
`;

    const chatItems = chatHistory.map((h: any) => 
      `${h.sender === 'user' ? 'Customer' : 'Assistant'}: ${h.text || h.content}`
    ).join("\n");

    const userPrompt = `
Conversation history:
${chatItems}

Recommend matching products from the catalog if requested. Provide helpful styling guidelines. Respond ONLY in valid JSON format.
`;

    const response = await aiInstance.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        temperature: 0.7
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json({
      reply: parsed.reply || "Hum Aapki Seva mein hazir hain! Browse our lovely catalog here.",
      recommendedProductIds: parsed.recommendedProductIds || []
    });

  } catch (err: any) {
    console.error("AI Assistant router fetch error:", err);
    res.status(500).json({ error: "Failed to load expert AI assistant recommendations: " + err.message });
  }
});

// ---------------------- WEB SERVING & VITE MIDDLEWARE ----------------------

async function start() {
  if (process.env.NODE_ENV !== "production") {
    // Mount Vite development midware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files from compiled dist
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✨ AuraMart Full Stack running successfully on http://localhost:${PORT}`);
  });
}

start().catch(err => {
  console.error("Failed to start full stack Express app:", err);
});
