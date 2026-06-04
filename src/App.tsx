import { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Sparkles, 
  Phone, 
  Tag, 
  Clock, 
  MessageSquare,
  ShieldCheck, 
  LogOut, 
  User, 
  UserCheck, 
  Settings, 
  Truck, 
  ArrowRight,
  Plus,
  Compass,
  AlertCircle,
  X,
  Palette,
  Languages,
  Activity
} from 'lucide-react';
import { Product, SellerProfile, Order, GlobalSettings, CartItem, ThemeConfig, CustomerProfile } from './types';
import SellerDashboard from './components/SellerDashboard';
import AdminPanel from './components/AdminPanel';
import BuyerStorefront from './components/BuyerStorefront';
import VirtualAssistant from './components/VirtualAssistant';
import { translations, LangType } from './utils/translations';
import { api } from './services/api';

// AuraMart configurations
const WHATSAPP_LINK = "https://wa.me/923202838491";
const TIKTOK_LINK = "https://www.tiktok.com/@aura_mart2";

// Premium Curated Product Catalog
const SELLER_MOCK_ID = "seller-ahnaf";

const INITIAL_PRODUCTS: Product[] = [
  {
    id: "prod-1",
    sellerId: SELLER_MOCK_ID,
    title: "Aura Luxe Chunky Sneakers",
    description: "Premium streetwear chunky sneakers with customized multi-panel aesthetic. Absolute luxury comfort with heavy cushioned insoles, perfect for everyday retro pairing.",
    price: 4950,
    wholesalePrice: 3450,
    category: "Shoes",
    imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800",
    isPopular: true,
    forGender: "Unisex",
    colors: ["Alabaster White", "Shadow Black"],
    sizes: ["40", "41", "42", "43"],
    stockCount: 14,
    createdAt: "2026-05-31"
  },
  {
    id: "prod-2",
    sellerId: SELLER_MOCK_ID,
    title: "Retro Running Athletic Joggers",
    description: "Ultra-light breathable knit mesh running joggers with rubberized traction soles. Engineered for high performance luxury athleisure styles.",
    price: 3950,
    wholesalePrice: 2850,
    category: "Shoes",
    imageUrl: "https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&q=80&w=800",
    isPopular: true,
    forGender: "Boys",
    colors: ["Stealth Black", "Sunset Orange"],
    sizes: ["40", "41", "42", "43"],
    stockCount: 19,
    createdAt: "2026-05-31"
  },
  {
    id: "prod-3",
    sellerId: "seller-fatima",
    title: "Premium Handcrafted Leather Tote",
    description: "Elegant girls designer leather handbag with soft suede internal lining, sleek custom polished hardware, and an adjustable luxury strap.",
    price: 4500,
    wholesalePrice: 2900,
    category: "Bags",
    imageUrl: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=800",
    isPopular: true,
    forGender: "Girls",
    colors: ["Tan Brown", "Classic Black"],
    sizes: ["Medium Style"],
    stockCount: 8,
    createdAt: "2026-05-31"
  },
  {
    id: "prod-4",
    sellerId: "admin-system",
    title: "Royal Sovereign Oyster Gold Watch",
    description: "Heavy analogue gold quartz watch featuring scratch-resistant sapphire display, classic date lens, and brilliant dual-locking metallic clasp.",
    price: 6500,
    wholesalePrice: 3900,
    category: "Watches",
    imageUrl: "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&q=80&w=800",
    isPopular: true,
    forGender: "Boys",
    colors: ["Imperial Gold", "Sovereign Silver"],
    sizes: ["Classic 40mm"],
    stockCount: 5,
    createdAt: "2026-05-31"
  }
];

const INITIAL_SELLERS: SellerProfile[] = [
  {
    uid: SELLER_MOCK_ID,
    email: "ahnafmeo002@gmail.com",
    displayName: "Ahnaf Ali",
    storeName: "Aura Boutique Karachi",
    isPremium: true,
    contactWhatsApp: "+923202838491",
    createdAt: "2026-05-31"
  },
  {
    uid: "seller-fatima",
    email: "fatima@auramart.pk",
    displayName: "Fatima Khan",
    storeName: "Fatima Chic Leather",
    isPremium: false,
    contactWhatsApp: "+923001234567",
    createdAt: "2026-05-31"
  }
];

const DEFAULT_SETTINGS: GlobalSettings = {
  karachiShippingCost: 300,
  otherCitiesShippingCost: 350,
  adminWhatsApp: "+923202838491",
  maxFreeListings: 3,
  websiteName: "Aura Mart",
  tagline: "Premium Luxury Styles at Wholesale Rates",
  aiSystemPrompt: "You are the helpful AI shopping assistant for AuraMart pakistan."
};

// Main root component
export default function App() {
  // Global States
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('auramart_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [sellers, setSellers] = useState<SellerProfile[]>(() => {
    const saved = localStorage.getItem('auramart_sellers');
    return saved ? JSON.parse(saved) : INITIAL_SELLERS;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('auramart_orders');
    return saved ? JSON.parse(saved) : [];
  });

  const [settings, setSettings] = useState<GlobalSettings>(() => {
    const saved = localStorage.getItem('auramart_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  // Active Role and Auth tracking
  const [currentSellerUser, setCurrentSellerUser] = useState<SellerProfile | null>(() => {
    const saved = localStorage.getItem('auramart_active_user');
    return saved ? JSON.parse(saved) : null;
  });

  // URL Parsing triggers for direct share cart actions
  const [directAddToCartId, setDirectAddToCartId] = useState<string | null>(null);

  // Multilingual, Styling Studio and Customer Profile states
  const [activeLang, setActiveLang] = useState<LangType>(() => {
    const saved = localStorage.getItem('auramart_lang');
    return (saved as LangType) || 'en';
  });

  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(() => {
    const saved = localStorage.getItem('auramart_theme');
    return saved ? JSON.parse(saved) : {
      primaryColor: "slate",
      fontFamily: "Inter",
      layoutType: "grid"
    };
  });

  const [customerProfile, setCustomerProfile] = useState<CustomerProfile>(() => {
    const saved = localStorage.getItem('auramart_customer_profile');
    return saved ? JSON.parse(saved) : {
      name: "Ahnaf Ali",
      phone: "03202838491",
      address: "Boutique Center, Tariq Road",
      city: "Karachi",
      routinePreferences: {
        notifyOnNewArrivals: true,
        dailyAlertTime: "09:00",
        preferredCategories: ["Shoes"],
        targetGenderInterest: "All"
      }
    };
  });

  const [isStylingStudioOpen, setIsStylingStudioOpen] = useState(false);

  // Modal displays
  const [isVendorConsoleOpen, setIsVendorConsoleOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [authError, setAuthError] = useState("");

  // Dynamic store categories persistence state
  const [categories, setCategories] = useState<string[]>(() => {
    const savedCat = localStorage.getItem("auramart_categories");
    if (savedCat) {
      try { return JSON.parse(savedCat); } catch(e) {}
    }
    return ["Shoes", "Bags", "Watches", "Fancy Tees", "Home Essentials"];
  });

  useEffect(() => {
    localStorage.setItem("auramart_categories", JSON.stringify(categories));
  }, [categories]);

  // Administrator login controls
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [adminEmailText, setAdminEmailText] = useState("");
  const [adminPasswordText, setAdminPasswordText] = useState("");
  const [adminLoginError, setAdminLoginError] = useState("");

  const isPasswordSecure = (p: string) => {
    if (p === "ahnafgaming13" || p === "AdminSecure@2026!") return true;
    if (p.length < 8) return false;
    const hasUpperCase = /[A-Z]/.test(p);
    const hasLowerCase = /[a-z]/.test(p);
    const hasNumbers = /\d/.test(p);
    const hasSymbols = /[`!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/.test(p);
    return hasUpperCase && hasLowerCase && hasNumbers && hasSymbols;
  };

  // Auth Inputs
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authStoreName, setAuthStoreName] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [showAuthOverlay, setShowAuthOverlay] = useState(false);

  // Main navigation tab
  // Options: "buyer_catalog" | "orders_feed"
  const [appRoute, setAppRoute] = useState<"buyer_catalog">("buyer_catalog");

  // Cart state sync
  const [cart, setCart] = useState<CartItem[]>([]);

  // Synchronise with real full-stack SQLite API database on mount
  useEffect(() => {
    const loadBackendData = async () => {
      try {
        // 1. Fetch initial products catalog
        const backendProducts = await api.getProducts();
        if (backendProducts && backendProducts.length > 0) {
          setProducts(backendProducts);
        }

        // 2. Fetch categories
        const backendCategories = await api.getCategories();
        if (backendCategories && backendCategories.length > 0) {
          setCategories(backendCategories.map((c: any) => c.name));
        }

        // 3. Fetch global settings
        const backendSettings = await api.getSettings();
        if (backendSettings) {
          setSettings({
            karachiShippingCost: Number(backendSettings.karachi_shipping_charge || 300),
            otherCitiesShippingCost: Number(backendSettings.other_cities_shipping_charge || 350),
            adminWhatsApp: backendSettings.admin_whatsapp || "+923202838491",
            maxFreeListings: Number(backendSettings.max_free_listings || 3),
            websiteName: backendSettings.website_name || "Aura Mart",
            tagline: backendSettings.tagline || "Premium Luxury Styles at Wholesale Rates",
            aiSystemPrompt: backendSettings.ai_system_prompt || "You are the helpful AI shopping assistant for AuraMart pakistan."
          });
        }

        // 4. Fetch session profile
        const token = localStorage.getItem("auramart_token");
        if (token) {
          const profileData = await api.getMe();
          if (profileData && profileData.user) {
            const u = profileData.user;
            const updatedProfile: SellerProfile = {
              uid: u.id,
              email: u.email,
              displayName: u.name,
              contactWhatsApp: u.phone || "+923202838491",
              storeName: `${u.name}'s Luxury Boutique`,
              isPremium: u.role === "admin" || u.role === "seller",
              createdAt: u.created_at
            };
            setCurrentSellerUser(updatedProfile);

            // Fetch dynamic orders if authorized
            const backendOrders = await api.getOrders();
            setOrders(backendOrders);
          }
        }
      } catch (err) {
        console.warn("Backend synchronization offline or seeding...", err);
      }
    };

    loadBackendData();
  }, []);

  // Check URL attributes on boot
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const directProdId = params.get('directAddToCart');
    if (directProdId) {
      setDirectAddToCartId(directProdId);
    }
    if (params.get('admin-sec') === 'true') {
      setShowAdminLoginModal(true);
    }
  }, []);

  // Save changes to localStorage for reliable mock persistence
  useEffect(() => {
    localStorage.setItem('auramart_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('auramart_sellers', JSON.stringify(sellers));
  }, [sellers]);

  useEffect(() => {
    localStorage.setItem('auramart_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('auramart_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('auramart_lang', activeLang);
  }, [activeLang]);

  useEffect(() => {
    localStorage.setItem('auramart_theme', JSON.stringify(themeConfig));
  }, [themeConfig]);

  useEffect(() => {
    localStorage.setItem('auramart_customer_profile', JSON.stringify(customerProfile));
  }, [customerProfile]);

  useEffect(() => {
    if (currentSellerUser) {
      localStorage.setItem('auramart_active_user', JSON.stringify(currentSellerUser));
    } else {
      localStorage.removeItem('auramart_active_user');
    }
  }, [currentSellerUser]);

  // Handle dynamic authentication signup logs
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    if (!authEmail || !authPassword) {
      setAuthError("Please input username and security code.");
      return;
    }

    try {
      if (authMode === "login") {
        // Real Server Authentication secure audit and token storage
        const result = await api.login({ email: authEmail, password: authPassword });
        const u = result.user;
        const mappedUser: SellerProfile = {
          uid: u.id,
          email: u.email,
          displayName: u.name,
          contactWhatsApp: u.phone || "+923202838491",
          storeName: `${u.name}'s Luxury Boutique`,
          isPremium: u.role === "admin" || u.role === "seller",
          createdAt: u.created_at
        };

        setCurrentSellerUser(mappedUser);
        setShowAuthOverlay(false);
        setIsVendorConsoleOpen(true);
      } else {
        // Real Server Signup creation with hashed password storage
        const result = await api.register({
          email: authEmail,
          password: authPassword,
          name: authEmail.split('@')[0],
          role: "seller"
        });
        const u = result.user;
        const mappedUser: SellerProfile = {
          uid: u.id,
          email: u.email,
          displayName: u.name,
          contactWhatsApp: u.phone || "+923202838491",
          storeName: authStoreName || `${u.name}'s Luxury Boutique`,
          isPremium: false,
          createdAt: u.created_at
        };

        setCurrentSellerUser(mappedUser);
        setShowAuthOverlay(false);
        setIsVendorConsoleOpen(true);
      }

      // Load correct verified orders from backend on authentication
      const backendOrders = await api.getOrders();
      setOrders(backendOrders);

      setAuthEmail("");
      setAuthPassword("");
      setAuthStoreName("");
    } catch (err: any) {
      setAuthError(err.message || "Failed to authenticate credential keys.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("auramart_token");
    setCurrentSellerUser(null);
    setIsVendorConsoleOpen(false);
  };

  // Helper upgrade current user to Premium
  const upgradeToPremium = () => {
    if (!currentSellerUser) return;
    const updatedUser = { ...currentSellerUser, isPremium: true };
    setCurrentSellerUser(updatedUser);
    setSellers(sellers.map(s => s.uid === currentSellerUser.uid ? updatedUser : s));
  };

  const activeFontFamilyClass = themeConfig.fontFamily === 'Inter' 
    ? 'font-sans' 
    : themeConfig.fontFamily === 'Space Grotesk' 
      ? 'font-grotesk' 
      : 'font-display';

  // URL checking state & immediate access block for admin parameter attempts
  const urlParams = new URLSearchParams(window.location.search);
  const isTryingAdminURL = 
    (urlParams.get("page") === "admin" || 
     urlParams.get("view") === "admin" || 
     urlParams.get("admin") === "true" ||
     window.location.pathname.includes("/admin") ||
     window.location.hash.includes("admin")) &&
    urlParams.get("admin-sec") !== "true";

  const isAdminAuthenticated = currentSellerUser?.email === "ahnafmeo002@gmail.com";

  if (isTryingAdminURL && !isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-stone-900 flex flex-col items-center justify-center p-6 text-center font-sans select-none">
        <div className="max-w-md w-full bg-stone-950 border border-red-500/20 rounded-3xl p-8 space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-[3px] bg-red-600" />
          <div className="w-16 h-16 bg-red-950/40 border border-red-500/30 rounded-2xl flex items-center justify-center text-red-500 mx-auto select-none">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-black text-white tracking-tight uppercase">Access Denied</h2>
            <p className="text-xs text-stone-400 leading-relaxed">
              Security protocol checks failed. Administrator permissions are strictly required to access corporate settings, product management, categories, and financial logs.
            </p>
          </div>
          <p className="text-[10px] text-stone-550 italic leading-normal">
            This workspace prevents direct query tampering and restricts access to authenticated platform owners.
          </p>
          <div className="pt-2.5 border-t border-stone-850">
            <button
              onClick={() => {
                // Return to catalog home page by resetting the browser location properties
                window.location.href = window.location.pathname;
              }}
              className="px-6 py-2 bg-stone-850 hover:bg-stone-800 text-stone-200 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer border border-stone-800"
            >
              Return to Catalog
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="full_app_container" className={`min-h-screen bg-stone-50 text-stone-900 selection:bg-amber-400 selection:text-stone-900 border-none select-none ${activeFontFamilyClass} flex flex-col justify-between`}>
      
      {/* Dynamic Header row of Marketplace branding */}
      <nav id="navbar_container" className="sticky top-0 z-40 bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* Branding Logo & info */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-stone-950 flex items-center justify-center text-amber-400 font-extrabold text-lg shadow-sm">
                AM
              </div>
              <div>
                <h1 className="text-sm font-black text-stone-900 leading-tight uppercase tracking-wide">✨ {translations[activeLang].brandName} ✨</h1>
                <p className="text-[9.5px] text-stone-500 uppercase font-semibold tracking-wider leading-none mt-0.5">{translations[activeLang].tagline}</p>
              </div>
            </div>

            {/* Quick system roles switcher toolbar */}
            <div className="flex items-center gap-3">
              
              {/* Language Selector Selector Popover */}
              <div className="flex bg-stone-100 p-1 rounded-xl items-center gap-1">
                {(["en", "ur", "hi"] as const).map(lang => (
                  <button
                    key={lang}
                    onClick={() => setActiveLang(lang)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                      activeLang === lang 
                        ? 'bg-white text-stone-900 shadow-xs' 
                        : 'text-stone-550 hover:bg-stone-50'
                    }`}
                  >
                    {lang === 'en' ? '🇬🇧 EN' : lang === 'ur' ? '🇵🇰 اوردو' : '🇮🇳 हिंदी'}
                  </button>
                ))}
              </div>

              {/* STYLING STUDIO TOGGLE */}
              <button 
                onClick={() => setIsStylingStudioOpen(true)}
                className="p-2.5 bg-stone-150 hover:bg-stone-200 text-stone-700 rounded-xl border border-stone-200 transition-colors cursor-pointer"
                title={translations[activeLang].customizeStylesBtn}
              >
                <Palette className="w-4 h-4 text-stone-700 animate-pulse" />
              </button>

              {/* VENDOR INTERFACES TOGGLE */}
              {currentSellerUser ? (
                <div className="flex items-center gap-1.5 font-sans">
                  <button 
                    onClick={() => setIsVendorConsoleOpen(true)}
                    className="px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-[10.5px] font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-97"
                  >
                    <UserCheck className="w-4 h-4 text-amber-400" />
                    <span>Seller Dashboard</span>
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="p-1.5 bg-stone-101 hover:bg-stone-200 rounded-xl text-stone-550 hover:text-stone-850"
                    title="Log out of console"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => { setAuthMode("login"); setShowAuthOverlay(true); }}
                  className="px-3.5 py-1.5 bg-stone-900 hover:bg-stone-850 text-white rounded-xl text-[10.5px] font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-97"
                >
                  <User className="w-4 h-4 text-amber-400" />
                  <span>{translations[activeLang].sellerConsole}</span>
                </button>
              )}

              {/* PLATFORM ADMIN SYSTEM ACCESS OVERRIDE */}
              {isAdminAuthenticated && (
                <button 
                  onClick={() => setIsAdminPanelOpen(true)}
                  className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-[10.5px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all active:scale-97"
                  title="Super Admin Control Centre"
                >
                  <Settings className="w-4 h-4 text-rose-500 animate-spin" />
                  <span>Admin Panel</span>
                </button>
              )}

            </div>

          </div>
        </div>
      </nav>

      {/* Main Container Render Frame */}
      <main className="flex-grow">
        
        {/* Dynamic Buyer Showcase Display (Standard catalogue) */}
        {appRoute === "buyer_catalog" && (
          <BuyerStorefront 
            products={products}
            orders={orders}
            setOrders={setOrders}
            settings={settings}
            directAddToCartId={directAddToCartId}
            onClearDirectAdd={() => setDirectAddToCartId(null)}
            cart={cart}
            setCart={setCart}
            activeLang={activeLang}
            themeConfig={themeConfig}
            customerProfile={customerProfile}
            setCustomerProfile={setCustomerProfile}
            translateMap={translations[activeLang]}
            onGoToVendorConsole={() => {
              if (currentSellerUser) {
                setIsVendorConsoleOpen(true);
              } else {
                setShowAuthOverlay(true);
              }
            }}
            categories={categories}
            currentUser={currentSellerUser}
            onShowAuth={() => { setAuthMode("login"); setShowAuthOverlay(true); }}
          />
        )}

      </main>

      {/* Dynamic Floating Multilingual AI Virtual Assistant Support */}
      <VirtualAssistant 
        products={products}
        currentLang={activeLang}
        onAddProductToCart={(p) => {
          const existingIdx = cart.findIndex(item => item.product.id === p.id);
          if (existingIdx > -1) {
            const u = [...cart];
            u[existingIdx].quantity += 1;
            setCart(u);
          } else {
            setCart([...cart, {
              product: p,
              quantity: 1,
              selectedColor: p.colors[0] || "Standard",
              selectedSize: p.sizes[0] || "Medium"
            }]);
          }
        }}
        shippingCostKarachi={settings.karachiShippingCost}
        shippingCostOther={settings.otherCitiesShippingCost}
      />

      {/* FOOTER METRIC BANNER */}
      <footer className="bg-white border-t border-stone-200 py-6 text-center text-xs text-stone-500 font-sans mt-auto">
        <p className="font-extrabold uppercase text-[10px] text-stone-400 tracking-wider">AuraMart e-Commerce Gateway</p>
        <p className="text-[10px] text-stone-400 mt-1">
          Secure PKR pricing & verified logistics structures. standard delivery charges computed dynamically based on Karachi (300 PKR) or others cities (350 PKR).
        </p>
      </footer>

      {/* INTERACTIVE POPUP PORT: SELLER REGISTRATION LOGIN MODAL */}
      {showAuthOverlay && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs" onClick={() => setShowAuthOverlay(false)} />
          
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl relative w-full max-w-sm p-6 z-10 space-y-4 font-sans">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-widest font-mono">
                {authMode === "login" ? "User Sign In Area" : "Register Vendor Store Account"}
              </span>
              <button onClick={() => setShowAuthOverlay(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h4 className="font-bold text-sm text-stone-900 leading-tight">Must Authenticate to Customise Listings</h4>
              <p className="text-[11px] text-stone-450 mt-1">Register to toggle PKR pricing adjustments, premium style settings, and fetch direct buyer cart links.</p>
            </div>

            {authError && (
              <div className="p-3 bg-red-50 text-red-850 border border-red-200 rounded-xl text-[10.5px] leading-relaxed flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-650 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[9.5px] font-bold text-stone-550 uppercase">Email Address Signature*</label>
                <input 
                  type="email" 
                  required
                  placeholder="e.g. user@yourstore.pk"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-250 rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9.5px] font-bold text-stone-550 uppercase">Password Security Key*</label>
                <input 
                  type="password" 
                  required
                  placeholder="Security Code"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-250 rounded-xl text-xs"
                />
              </div>

              {authMode === "signup" && (
                <div className="space-y-1">
                  <label className="text-[9.5px] font-bold text-stone-550 uppercase">Boutique Store Name*</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Aura Classic Wear"
                    value={authStoreName}
                    onChange={(e) => setAuthStoreName(e.target.value)}
                    className="w-full p-2.5 bg-stone-50 border border-stone-250 rounded-xl text-xs"
                  />
                </div>
              )}

              <button 
                type="submit"
                className="w-full py-2.5 bg-stone-900 text-white hover:bg-stone-850 rounded-2xl text-xs font-bold shadow-md cursor-pointer"
              >
                {authMode === "login" ? "Complete Credentials Check" : "Verify Store & Sign Up"}
              </button>
            </form>

            <div className="text-center pt-2 border-t">
              {authMode === "login" ? (
                <p className="text-[10px] text-stone-500">
                  New vendor store?{" "}
                  <button onClick={() => { setAuthMode("signup"); setAuthError(""); }} className="text-amber-650 font-bold hover:underline">
                    Register New Account
                  </button>
                </p>
              ) : (
                <p className="text-[10px] text-stone-500">
                  Already registered?{" "}
                  <button onClick={() => { setAuthMode("login"); setAuthError(""); }} className="text-amber-650 font-bold hover:underline">
                    Sign In instead
                  </button>
                </p>
              )}
            </div>

          </div>
        </div>
      )}

      {/* SECURE ADMINISTRATOR LOGIN SYSTEM WITH CODING RULES */}
      {showAdminLoginModal && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs" onClick={() => setShowAdminLoginModal(false)} />
          
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl relative w-full max-w-sm p-6 z-10 space-y-4 font-sans animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-xs font-black text-rose-600 uppercase tracking-widest font-mono flex items-center gap-1">
                🛡️ AuraMart Admin Security Core
              </span>
              <button onClick={() => setShowAdminLoginModal(false)} className="text-stone-400 hover:text-stone-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h4 className="font-bold text-sm text-stone-900 font-serif leading-tight">Administrator Authentication Key</h4>
              <p className="text-[11px] text-stone-500 mt-1">
                A secure password coding check is enforced here. Please declare your administrator credentials signature below to load system configurations.
              </p>
            </div>

            {adminLoginError && (
              <div className="p-3 bg-red-50 text-red-850 border border-red-200 rounded-xl text-[10px] leading-relaxed font-sans">
                ⚠️ {adminLoginError}
              </div>
            )}

            <form onSubmit={(e) => {
              e.preventDefault();
              setAdminLoginError("");
              
              if (adminEmailText.toLowerCase().trim() !== "ahnafmeo002@gmail.com") {
                setAdminLoginError("Invalid administrator signature. Email stamp recognized as: ahnafmeo002@gmail.com");
                return;
              }

              if (!isPasswordSecure(adminPasswordText)) {
                setAdminLoginError("Security coding audit fail: Your password does not meet the secure rules (Min 8 chars, uppercase, lowercase, numbers, and symbols).");
                return;
              }

              if (adminPasswordText !== "ahnafgaming13") {
                setAdminLoginError("Invalid administrative key signature. Access denied!");
                return;
              }

              setIsAdminPanelOpen(true);
              setShowAdminLoginModal(false);
              setAdminEmailText("");
              setAdminPasswordText("");
            }} className="space-y-3.5">
              
              <div className="space-y-1">
                <label className="text-[9px] font-extrabold text-stone-400 uppercase tracking-wider block">Admin Email Stamp</label>
                <input 
                  type="email" 
                  required
                  placeholder="ahnafmeo002@gmail.com"
                  value={adminEmailText}
                  onChange={(e) => setAdminEmailText(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-250 rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-extrabold text-stone-400 uppercase tracking-wider block">Security Keycode</label>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  value={adminPasswordText}
                  onChange={(e) => setAdminPasswordText(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-250 rounded-xl text-xs font-mono font-bold"
                />
              </div>

              {/* Secure Password Coding Live Checklist Tracker */}
              <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 text-[10px] text-stone-600 space-y-1">
                <p className="font-extrabold text-stone-500 uppercase tracking-wide text-[8.5px] mb-1">Coding Strength Rules Check:</p>
                <div className="flex items-center gap-1.5">
                  <span className={adminPasswordText.length >= 8 ? "text-emerald-600 font-bold" : "text-stone-350"}>
                    {adminPasswordText.length >= 8 ? "✓" : "✗"} Min 8 characters ({adminPasswordText.length}/8)
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={(adminPasswordText === "ahnafgaming13" || /[A-Z]/.test(adminPasswordText)) ? "text-emerald-600 font-bold" : "text-stone-350"}>
                    {(adminPasswordText === "ahnafgaming13" || /[A-Z]/.test(adminPasswordText)) ? "✓" : "✗"} Contains Upper Case letter (Bypassed for Custom key)
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={/[a-z]/.test(adminPasswordText) ? "text-emerald-600 font-bold" : "text-stone-350"}>
                    {/[a-z]/.test(adminPasswordText) ? "✓" : "✗"} Contains Lower Case letter
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={/\d/.test(adminPasswordText) ? "text-emerald-600 font-bold" : "text-stone-350"}>
                    {/\d/.test(adminPasswordText) ? "✓" : "✗"} Contains Numeric Digits
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={(adminPasswordText === "ahnafgaming13" || /[`!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/.test(adminPasswordText)) ? "text-emerald-600 font-bold" : "text-stone-350"}>
                    {(adminPasswordText === "ahnafgaming13" || /[`!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/.test(adminPasswordText)) ? "✓" : "✗"} Special characters (Bypassed for Custom key)
                  </span>
                </div>
              </div>

              <div className="pt-1.5">
                <button 
                  type="submit"
                  className="w-full py-3 bg-stone-900 text-white hover:bg-stone-850 rounded-2xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>🔐 Submit secure admin credentials</span>
                </button>
              </div>

              <p className="text-[9px] text-stone-400 text-center leading-normal">
                ℹ️ Default demo credentials: <span className="font-bold underline">ahnafmeo002@gmail.com</span> & <span className="font-bold underline">ahnafgaming13</span>
              </p>

            </form>
          </div>
        </div>
      )}

      {/* PORT: SELLER BOUTIQUE OPERATIONS PANEL */}
      {isVendorConsoleOpen && currentSellerUser && (
        <SellerDashboard 
          currentProfile={currentSellerUser}
          onUpgradeToPremium={upgradeToPremium}
          products={products}
          setProducts={setProducts}
          orders={orders}
          setOrders={setOrders}
          settings={settings}
          onClose={() => setIsVendorConsoleOpen(false)}
          categories={categories}
        />
      )}

      {/* PORT: MAIN PLATFORM CONTROLLER OVERRIDE PANEL */}
      {isAdminPanelOpen && (
        <AdminPanel 
          settings={settings}
          setSettings={setSettings}
          products={products}
          setProducts={setProducts}
          sellers={sellers}
          setSellers={setSellers}
          orders={orders}
          setOrders={setOrders}
          onClose={() => setIsAdminPanelOpen(false)}
          categories={categories}
          setCategories={setCategories}
        />
      )}

      {/* PORT: STYLING & CUSTOM VISUAL THEME STUDIO CONTROL OVERLAY */}
      {isStylingStudioOpen && (
        <div className="fixed inset-0 z-55 flex items-center justify-end">
          <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs" onClick={() => setIsStylingStudioOpen(false)} />
          
          <div className="bg-white border-l h-full shadow-2xl relative w-full max-w-sm p-6 z-10 flex flex-col justify-between animate-in slide-in-from-right duration-250">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b pb-3">
                <span className="text-xs font-black text-stone-500 uppercase tracking-widest font-mono flex items-center gap-2">
                  <Palette className="w-4 h-4 text-amber-500" />
                  <span>{translations[activeLang].customizeStylesTitle}</span>
                </span>
                <button onClick={() => setIsStylingStudioOpen(false)} className="text-stone-400 hover:text-stone-700 cursor-pointer p-1.5 rounded-lg hover:bg-stone-50">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Accent Color Configs */}
              <div className="space-y-2.5">
                <label className="text-[11px] font-extrabold text-stone-500 uppercase tracking-wider block">
                  {translations[activeLang].themeChooseColor}:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: "slate", label: "Classic Charcoal", hex: "bg-stone-900 border-stone-950" },
                    { key: "rose", label: "Midnight Rose", hex: "bg-rose-600 border-rose-700" },
                    { key: "emerald", label: "Imperial Jade", hex: "bg-emerald-700 border-emerald-900" },
                    { key: "amber", label: "Royal Gold", hex: "bg-amber-500 border-amber-600" }
                  ].map(themeItem => {
                    const isSelected = themeConfig.primaryColor === themeItem.key;
                    return (
                      <button
                        key={themeItem.key}
                        onClick={() => setThemeConfig({ ...themeConfig, primaryColor: themeItem.key as any })}
                        className={`p-3.5 border rounded-2xl flex items-center gap-2 text-left cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-stone-50 border-stone-800 ring-2 ring-stone-900/10' 
                            : 'bg-white hover:bg-stone-50 border-stone-200'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full shrink-0 ${themeItem.hex}`} />
                        <span className="text-[11px] font-bold text-stone-800">{themeItem.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Typography pairing Selector */}
              <div className="space-y-2.5">
                <label className="text-[11px] font-extrabold text-stone-550 uppercase tracking-wider block">
                  {translations[activeLang].themeChooseFont}:
                </label>
                <div className="space-y-2">
                  {[
                    { key: "Inter", desc: "Inter Sans-serif (Default Swiss Modernism)", fontClass: "font-sans" },
                    { key: "Space Grotesk", desc: "Space Grotesk (Tech Dynamic Styling)", fontClass: "font-grotesk" },
                    { key: "Playfair Display", desc: "Playfair Display (Classy Serif Elegance)", fontClass: "font-display" }
                  ].map(fontItem => {
                    const isSelected = themeConfig.fontFamily === fontItem.key;
                    return (
                      <button
                        key={fontItem.key}
                        onClick={() => setThemeConfig({ ...themeConfig, fontFamily: fontItem.key as any })}
                        className={`w-full p-2.5 border rounded-xl text-left cursor-pointer transition-all flex justify-between items-center ${
                          isSelected 
                            ? 'bg-stone-50 border-stone-800 ring-2 ring-stone-900/10 font-bold' 
                            : 'bg-white hover:bg-stone-50 border-stone-200'
                        }`}
                      >
                        <div>
                          <p className={`text-xs ${fontItem.fontClass}`}>{fontItem.key}</p>
                          <p className="text-[9px] text-stone-450 mt-0.5">{fontItem.desc}</p>
                        </div>
                        {isSelected && <span className="text-stone-900 font-extrabold">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Product Shelf View Layout Compact list vs traditional grid */}
              <div className="space-y-2.5">
                <label className="text-[11px] font-extrabold text-stone-550 uppercase tracking-wider block">
                  {translations[activeLang].themeChooseLayout}:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: "grid", label: translations[activeLang].layoutGrid, desc: "Standard 4-column cards" },
                    { key: "compact", label: translations[activeLang].layoutCompact, desc: "Sleek inline row catalog" }
                  ].map(layoutItem => {
                    const isSelected = themeConfig.layoutType === layoutItem.key;
                    return (
                      <button
                        key={layoutItem.key}
                        onClick={() => setThemeConfig({ ...themeConfig, layoutType: layoutItem.key as any })}
                        className={`p-3 border rounded-xl text-left cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-stone-50 border-stone-800 ring-2 ring-stone-900/10' 
                            : 'bg-white hover:bg-stone-50 border-stone-200'
                        }`}
                      >
                        <p className="text-[11.5px] font-extrabold text-stone-800 leading-tight">{layoutItem.label}</p>
                        <p className="text-[8.5px] text-stone-450 mt-1 leading-normal">{layoutItem.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            <button 
              onClick={() => setIsStylingStudioOpen(false)}
              className="w-full py-2.5 bg-stone-900 hover:bg-stone-850 text-amber-400 font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer"
            >
              Apply Theme Setup
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
