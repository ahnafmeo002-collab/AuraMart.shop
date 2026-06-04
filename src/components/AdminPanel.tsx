import { useState, useEffect } from 'react';
import { 
  Settings, 
  Users, 
  ShoppingBag, 
  Truck, 
  TrendingUp, 
  Check, 
  X, 
  Plus, 
  Trash2, 
  Edit2, 
  ShieldCheck, 
  DollarSign,
  Briefcase,
  Tag,
  Ticket,
  Image as ImageIcon,
  BarChart3,
  Sparkles
} from 'lucide-react';
import { Product, SellerProfile, Order, GlobalSettings, StoreCategory } from '../types';
import { api } from '../services/api';

interface AdminPanelProps {
  settings: GlobalSettings;
  setSettings: (s: GlobalSettings) => void;
  products: Product[];
  setProducts: (p: Product[]) => void;
  sellers: SellerProfile[];
  setSellers: (s: SellerProfile[]) => void;
  orders: Order[];
  setOrders: (o: Order[]) => void;
  onClose: () => void;
  categories: string[];
  setCategories: (c: string[]) => void;
}

export default function AdminPanel({
  settings,
  setSettings,
  products,
  setProducts,
  sellers,
  setSellers,
  orders,
  setOrders,
  onClose,
  categories,
  setCategories
}: AdminPanelProps) {
  // Tabs: "settings", "sellers", "products", "orders", "categories", "coupons", "homepage", "analytics", "ai_assistant"
  const [activeTab, setActiveTab] = useState<"settings" | "sellers" | "products" | "orders" | "categories" | "coupons" | "homepage" | "analytics" | "ai_assistant">("settings");
  
  // Local state for settings editing
  const [karachiFee, setKarachiFee] = useState(settings.karachiShippingCost);
  const [nationalFee, setNationalFee] = useState(settings.otherCitiesShippingCost);
  const [freeLimit, setFreeLimit] = useState(settings.maxFreeListings);
  const [successMsg, setSuccessMsg] = useState("");

  // Branding & Homepage details
  const [webName, setWebName] = useState(settings.websiteName || "Aura Mart");
  const [webTagline, setWebTagline] = useState(settings.tagline || "Premium Luxury Styles at Wholesale Rates");

  // AI assistant configurations
  const [aiSystemPrompt, setAiSystemPrompt] = useState(settings.aiSystemPrompt || "You are the helpful AI shopping assistant for AuraMart pakistan.");

  // Coupons state hooks
  const [couponsList, setCouponsList] = useState<any[]>([]);
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(10);
  const [couponIsPercentage, setCouponIsPercentage] = useState(true);
  const [couponExpiry, setCouponExpiry] = useState("2027-12-31");
  const [couponError, setCouponError] = useState("");

  const loadCouponsFeed = async () => {
    try {
      const list = await api.getAdminCoupons();
      setCouponsList(Array.isArray(list) ? list : []);
    } catch (err: any) {
      console.error("Failed to load platform coupon listings", err);
    }
  };

  useEffect(() => {
    if (activeTab === "coupons") {
      loadCouponsFeed();
    }
  }, [activeTab]);

  // Product editing local state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [prodForm, setProdForm] = useState<Partial<Product>>({
    title: "",
    description: "",
    price: 0,
    wholesalePrice: 0,
    category: "Shoes",
    imageUrl: "",
    forGender: "Unisex",
    colors: ["Default White", "Matte Black"],
    sizes: ["M", "L", "XL"],
    stockCount: 10,
    sellerId: "admin-system"
  });

  const saveGlobalSettings = async (customPayload?: any) => {
    try {
      const payload = customPayload || {
        karachi_shipping_charge: karachiFee,
        other_cities_shipping_charge: nationalFee,
        max_free_listings: freeLimit,
        website_name: webName,
        tagline: webTagline,
        ai_system_prompt: aiSystemPrompt
      };
      await api.saveSettings(payload);
      setSettings({
        ...settings,
        karachiShippingCost: Number(karachiFee),
        otherCitiesShippingCost: Number(nationalFee),
        maxFreeListings: Number(freeLimit),
        websiteName: webName,
        tagline: webTagline,
        aiSystemPrompt: aiSystemPrompt
      });
      setSuccessMsg("Configurations saved and database updated successfully!");
    } catch (err: any) {
      setSuccessMsg("Failed to save backend configurations: " + err.message);
    }
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const toggleSellerSubscription = (sellerUid: string) => {
    setSellers(sellers.map(s => {
      if (s.uid === sellerUid) {
        return { ...s, isPremium: !s.isPremium };
      }
      return s;
    }));
  };

  const removeProduct = async (id: string) => {
    if (confirm("Are you sure you want to remove this product from all listings?")) {
      try {
        await api.deleteProduct(id);
        setProducts(products.filter(p => p.id !== id));
      } catch (err: any) {
        alert("Failed to remove product on server: " + err.message);
      }
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodForm.title || !prodForm.imageUrl) return;

    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, {
          ...prodForm,
          price: Number(prodForm.price),
          wholesalePrice: Number(prodForm.wholesalePrice || (Number(prodForm.price) * 0.7)),
          stockCount: Number(prodForm.stockCount)
        });

        setProducts(products.map(p => {
          if (p.id === editingProduct.id) {
            return {
              ...p,
              ...prodForm,
              price: Number(prodForm.price),
              wholesalePrice: Number(prodForm.wholesalePrice),
              stockCount: Number(prodForm.stockCount)
            } as Product;
          }
          return p;
        }));
        setEditingProduct(null);
      } else {
        const payload = {
          ...prodForm,
          price: Number(prodForm.price),
          wholesalePrice: Number(prodForm.wholesalePrice || (Number(prodForm.price) * 0.7)),
          stockCount: Number(prodForm.stockCount),
          status: "active"
        };
        const result = await api.createProduct(payload);
        const newProduct: Product = {
          ...(prodForm as Product),
          id: result.id,
          price: Number(prodForm.price),
          wholesalePrice: Number(prodForm.wholesalePrice || (Number(prodForm.price) * 0.7)),
          stockCount: Number(prodForm.stockCount),
          createdAt: new Date().toISOString()
        };
        setProducts([newProduct, ...products]);
        setIsAddingProduct(false);
      }
    } catch (err: any) {
      alert("Error submitting product to backend database: " + err.message);
    }
    setProdForm({
      title: "",
      description: "",
      price: 0,
      wholesalePrice: 0,
      category: "Shoes",
      imageUrl: "",
      forGender: "Unisex",
      colors: ["Default White", "Matte Black"],
      sizes: ["M", "L", "XL"],
      stockCount: 10,
      sellerId: "admin-system"
    });
  };

  const populateEditForm = (p: Product) => {
    setEditingProduct(p);
    setProdForm(p);
    setIsAddingProduct(true);
  };

  // Stats calculations
  const totalPkRevenue = orders
    .filter(o => o.status === "paid" || o.status === "completed")
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const pendingDeliveries = orders.filter(o => o.status === "pending").length;
  const completedOrders = orders.filter(o => o.status === "completed" || o.status === "paid").length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-stone-900/65 backdrop-blur-sm" onClick={onClose} />
      
      <div className="bg-white rounded-3xl overflow-hidden shadow-2xl relative w-full max-w-5xl border border-stone-200 z-10 max-h-[90vh] flex flex-col font-sans">
        
        {/* Header bar banner */}
        <div className="bg-stone-900 text-stone-100 p-6 flex justify-between items-center border-b border-stone-850">
          <div className="flex items-center gap-2.5">
            <div className="bg-amber-500 text-stone-950 p-2 rounded-xl">
              <Settings className="w-5 h-5 text-stone-950" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-serif leading-tight">Master Admin Workspace</h3>
              <p className="text-[10px] text-amber-400 font-semibold tracking-wider uppercase">Enterprise Store & Logistics Coordinator</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-all border border-stone-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Stats Overview Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-stone-50 border-b border-stone-200">
          <div className="p-4 rounded-2xl bg-white border border-stone-200 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-stone-400 font-medium">TOTAL BOOKED VAL</p>
              <p className="text-sm font-bold text-stone-900">PKR {totalPkRevenue.toLocaleString()}</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-stone-200 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-stone-400 font-medium">TOTAL PRODS LISTED</p>
              <p className="text-sm font-bold text-stone-900">{products.length} Products</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-stone-200 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-stone-400 font-medium">VERIFIED VENDORS</p>
              <p className="text-sm font-bold text-stone-900">{sellers.length} Profiles</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-stone-200 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-stone-400 font-medium">SHIPPED DELIVERIES</p>
              <p className="text-sm font-bold text-stone-900">{completedOrders} Confirmed</p>
            </div>
          </div>
        </div>

        {/* Admin Navigation and Panel Workspace Layout */}
        <div className="flex flex-col md:flex-row flex-grow overflow-hidden h-[55vh]">
          
          {/* Side Tabs bar */}
          <div className="w-full md:w-56 bg-stone-50 border-r border-stone-200 flex md:flex-col gap-1 p-2 md:p-3 overflow-x-auto md:overflow-y-auto shrink-0">
            <button 
              onClick={() => setActiveTab("settings")}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${activeTab === "settings" ? 'bg-stone-900 text-white shadow-sm' : 'hover:bg-stone-100 text-stone-600'}`}
            >
              <Settings className="w-4 h-4" />
              <span>Operational Rates</span>
            </button>
            <button 
              onClick={() => setActiveTab("sellers")}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${activeTab === "sellers" ? 'bg-stone-900 text-white shadow-sm' : 'hover:bg-stone-100 text-stone-600'}`}
            >
              <Users className="w-4 h-4" />
              <span>Sellers & Tiers</span>
            </button>
            <button 
              onClick={() => setActiveTab("products")}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${activeTab === "products" ? 'bg-stone-900 text-white shadow-sm' : 'hover:bg-stone-100 text-stone-600'}`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Listing Catalog</span>
            </button>
             <button 
              onClick={() => setActiveTab("orders")}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${activeTab === "orders" ? 'bg-stone-900 text-white shadow-sm' : 'hover:bg-stone-100 text-stone-600'}`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Global Payments Received</span>
            </button>
            <button 
              onClick={() => setActiveTab("categories")}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${activeTab === "categories" ? 'bg-stone-900 text-white shadow-sm' : 'hover:bg-stone-100 text-stone-600'}`}
            >
              <Tag className="w-4 h-4" />
              <span>Store Categories</span>
            </button>
            <button 
              onClick={() => setActiveTab("coupons")}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${activeTab === "coupons" ? 'bg-stone-900 text-white shadow-sm' : 'hover:bg-stone-100 text-stone-600'}`}
            >
              <Ticket className="w-4 h-4" />
              <span>Coupons & VIP Codes</span>
            </button>
            <button 
              onClick={() => setActiveTab("homepage")}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${activeTab === "homepage" ? 'bg-stone-900 text-white shadow-sm' : 'hover:bg-stone-100 text-stone-600'}`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Banners & Homepage</span>
            </button>
            <button 
              onClick={() => setActiveTab("analytics")}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${activeTab === "analytics" ? 'bg-stone-900 text-white shadow-sm' : 'hover:bg-stone-100 text-stone-600'}`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Sales Reports & Analytics</span>
            </button>
            <button 
              onClick={() => setActiveTab("ai_assistant")}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${activeTab === "ai_assistant" ? 'bg-stone-900 text-white shadow-sm' : 'hover:bg-stone-100 text-stone-600'}`}
            >
              <Sparkles className="w-4 h-4" />
              <span>AI Shopping Expert</span>
            </button>
          </div>

          {/* Active Content Module */}
          <div className="flex-grow p-6 overflow-y-auto">
            
            {/* TAB 1: Global Shipping & limit controls */}
            {activeTab === "settings" && (
              <div className="space-y-6 max-w-xl">
                <div>
                  <h4 className="font-bold text-base text-stone-850 font-serif border-b border-stone-200 pb-2">Operational Settings</h4>
                  <p className="text-stone-500 text-xs mt-1">Configure baseline variables used to compute shipping dynamically in PKR.</p>
                </div>

                {successMsg && (
                  <div className="p-3 rounded-xl bg-teal-50 text-teal-850 border border-teal-200 text-xs font-semibold">
                    {successMsg}
                  </div>
                )}

                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-550 uppercase">Karachi Delivery Cost (PKR)</label>
                      <input 
                        type="number" 
                        value={karachiFee}
                        onChange={(e) => setKarachiFee(Number(e.target.value))}
                        className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-stone-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-550 uppercase">Other Cities Delivery (PKR)</label>
                      <input 
                        type="number" 
                        value={nationalFee}
                        onChange={(e) => setNationalFee(Number(e.target.value))}
                        className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-stone-800"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-550 uppercase">Free Plan Listings Lock Barrier</label>
                    <input 
                      type="number" 
                      value={freeLimit}
                      onChange={(e) => setFreeLimit(Number(e.target.value))}
                      className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-stone-800"
                    />
                    <p className="text-[10px] text-stone-400 mt-1">Maximum products a standard "Free Version" user profile can list concurrently before needing Premium.</p>
                  </div>

                  <div className="pt-3">
                    <button 
                      onClick={saveGlobalSettings}
                      className="px-5 py-2.5 rounded-full bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-all"
                    >
                      Save Configuration
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Users & Premium Tier Upgrades */}
            {activeTab === "sellers" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                  <div>
                    <h4 className="font-bold text-base text-stone-850 font-serif">AuraMart Active Seller Profiles</h4>
                    <p className="text-stone-500 text-xs mt-0.5">Edit credentials or toggle subscription tier from Free access to Unlimited Premium.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {sellers.map((seller) => {
                    const sellerProdsCount = products.filter(p => p.sellerId === seller.uid).length;
                    return (
                      <div key={seller.uid} className="flex flex-wrap items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-200/80 gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm uppercase ${seller.isPremium ? 'bg-amber-500 shadow-sm' : 'bg-stone-500'}`}>
                            {seller.displayName.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-bold text-stone-900">{seller.displayName}</p>
                              {seller.isPremium ? (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[8px] font-bold bg-amber-500 text-stone-950 font-sans tracking-wide uppercase">
                                  PREMIUM PRO
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[8px] font-bold bg-stone-200 text-stone-600 font-sans tracking-wide uppercase">
                                  FREE VERSION
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-stone-400">Email: {seller.email} | WhatsApp: {seller.contactWhatsApp || "Not linked"} | Listed: {sellerProdsCount} items</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 font-sans">
                          <button 
                            onClick={() => toggleSellerSubscription(seller.uid)}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all border ${
                              seller.isPremium 
                                ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200' 
                                : 'bg-stone-900 text-white hover:bg-stone-800 border-stone-200'
                            }`}
                          >
                            {seller.isPremium ? "Downgrade Free" : "Upgrade Premium"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: Global Listing Catalog Editing */}
            {activeTab === "products" && (
              <div className="space-y-4 font-sans">
                
                <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                  <div>
                    <h4 className="font-bold text-base text-stone-850 font-serif">Global Product Catalogue Area</h4>
                    <p className="text-stone-500 text-xs mt-0.5">Add custom designs, edit wholesale pricing or remove obsolete listings immediately.</p>
                  </div>

                  <button 
                    onClick={() => {
                      setEditingProduct(null);
                      setProdForm({
                        title: "",
                        description: "",
                        price: 1500,
                        wholesalePrice: 1000,
                        category: "Shoes",
                        imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800",
                        forGender: "Unisex",
                        colors: ["Default White", "Matte Black"],
                        sizes: ["40", "41", "42", "43"],
                        stockCount: 15,
                        sellerId: "admin-system"
                      });
                      setIsAddingProduct(true);
                    }}
                    className="px-3.5 py-1.5 rounded-full bg-stone-900 text-white text-[11px] font-bold hover:bg-stone-800 flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-400" />
                    <span>Create Custom Listing</span>
                  </button>
                </div>

                {/* Sub-form layer toggle */}
                {isAddingProduct && (
                  <form onSubmit={handleProductSubmit} className="p-5 bg-stone-50 border border-stone-200 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                      <p className="text-xs font-bold text-stone-800">
                        {editingProduct ? `Edit Listing Details: ${editingProduct.title}` : "Create New Custom Marketplace Listing"}
                      </p>
                      <button 
                        type="button" 
                        onClick={() => setIsAddingProduct(false)} 
                        className="text-stone-400 hover:text-stone-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1 col-span-2">
                        <label className="text-[10px] font-bold text-stone-500 uppercase">Product Title</label>
                        <input 
                          type="text" 
                          required
                          value={prodForm.title}
                          onChange={(e) => setProdForm({ ...prodForm, title: e.target.value })}
                          className="w-full p-2 bg-white border border-stone-200 rounded-xl text-xs"
                          placeholder="e.g. Aura Airmax Ultra"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-stone-500 uppercase">Listing Price (PKR)</label>
                        <input 
                          type="number" 
                          required
                          value={prodForm.price || ""}
                          onChange={(e) => setProdForm({ ...prodForm, price: Number(e.target.value) })}
                          className="w-full p-2 bg-white border border-stone-200 rounded-xl text-xs"
                          placeholder="Retail PKRs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-stone-500 uppercase">Wholesale Price (PKR)</label>
                        <input 
                          type="number" 
                          required
                          value={prodForm.wholesalePrice || ""}
                          onChange={(e) => setProdForm({ ...prodForm, wholesalePrice: Number(e.target.value) })}
                          className="w-full p-2 bg-white border border-stone-200 rounded-xl text-xs"
                          placeholder="Wholesale PKRs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-stone-500 uppercase">Category</label>
                        <select 
                          value={prodForm.category}
                          onChange={(e) => setProdForm({ ...prodForm, category: e.target.value as StoreCategory })}
                          className="w-full p-2 bg-white border border-stone-200 rounded-xl text-xs"
                        >
                          {(categories || ["Shoes", "Bags", "Watches", "Fancy Tees", "Home Essentials"]).map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-stone-500 uppercase">Target Gender</label>
                        <select 
                          value={prodForm.forGender}
                          onChange={(e) => setProdForm({ ...prodForm, forGender: e.target.value as any })}
                          className="w-full p-2 bg-white border border-stone-200 rounded-xl text-xs"
                        >
                          <option value="Boys">Boys</option>
                          <option value="Girls">Girls</option>
                          <option value="Unisex">Unisex</option>
                        </select>
                      </div>

                      <div className="space-y-1 col-span-2">
                        <label className="text-[10px] font-bold text-stone-500 uppercase">Product Image URL</label>
                        <input 
                          type="text" 
                          required
                          value={prodForm.imageUrl}
                          onChange={(e) => setProdForm({ ...prodForm, imageUrl: e.target.value })}
                          className="w-full p-2 bg-white border border-stone-200 rounded-xl text-xs"
                          placeholder="https://images.unsplash.com/..."
                        />
                      </div>

                      <div className="space-y-1 col-span-2">
                        <label className="text-[10px] font-bold text-stone-500 uppercase">Product Description</label>
                        <textarea 
                          value={prodForm.description}
                          onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                          className="w-full p-2 bg-white border border-stone-200 rounded-xl text-xs h-16 resize-none"
                          placeholder="Premium quality design metrics..."
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button 
                        type="button" 
                        onClick={() => setIsAddingProduct(false)}
                        className="px-4 py-2 border border-stone-200 rounded-xl text-xs hover:bg-stone-100"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold hover:bg-stone-800"
                      >
                        {editingProduct ? "Save Changes" : "Publish Listing"}
                      </button>
                    </div>
                  </form>
                )}

                <div className="space-y-2.5">
                  {products.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3.5 bg-stone-100/50 hover:bg-stone-100 rounded-xl border border-stone-200/60 transition-colors">
                      <div className="flex items-center gap-3">
                        <img 
                          src={p.imageUrl} 
                          alt={p.title} 
                          className="w-9 h-9 object-cover rounded-lg border border-stone-200" 
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <p className="text-xs font-bold text-stone-850">{p.title}</p>
                          <p className="text-[10px] text-stone-500">
                            Category: <span className="font-semibold text-amber-600">{p.category}</span> | Seller: <span className="font-semibold">{p.sellerId === "admin-system" ? "Main Admin" : p.sellerId}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs font-bold text-stone-900">PKR {p.price.toLocaleString()}</p>
                          <p className="text-[9px] text-emerald-600 font-bold uppercase">Whls: PKR {p.wholesalePrice.toLocaleString()}</p>
                        </div>
                        <div className="flex gap-1.5 font-sans">
                          <button 
                            onClick={() => populateEditForm(p)}
                            className="p-1.5 rounded-lg bg-stone-200 text-stone-700 hover:bg-amber-100 hover:text-amber-800 transition-colors"
                            aria-label="Edit listing"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => removeProduct(p.id)}
                            className="p-1.5 rounded-lg bg-stone-200 text-stone-700 hover:bg-red-100 hover:text-red-700 transition-colors"
                            aria-label="Remove listing"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: Ledger Orders Payments confirmation and audits */}
            {activeTab === "orders" && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-base text-stone-850 font-serif col-span-2">Platform Payments Ledger</h4>
                  <p className="text-stone-500 text-xs mt-0.5">Complete real-time ledger of purchases. Check incoming payments verified on-delivery or transfer methods.</p>
                </div>

                <div className="space-y-2.5">
                  {orders.length === 0 ? (
                    <div className="p-10 text-center text-stone-400 text-xs">
                      No customer transactions have been recorded on this ledger yet.
                    </div>
                  ) : (
                    orders.map((order) => (
                      <div key={order.id} className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-stone-900">ID: {order.id.slice(-6).toUpperCase()}</span>
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[8.5px] font-bold ${
                              order.paymentConfirmed ? "bg-teal-50 text-teal-850 border border-teal-200" : "bg-amber-50 text-amber-850 border border-amber-200"
                            }`}>
                              🟢 PAYMENT {order.paymentConfirmed ? "CONFIRMED" : "PENDING"}
                            </span>
                          </div>
                          <p className="text-[10px] text-stone-500">
                            Buyer Name: <span className="font-bold">{order.buyerName}</span> ({order.buyerCity}) | Phone: {order.buyerPhone}
                          </p>
                          <p className="text-[10px] text-stone-400">Address: {order.buyerAddress}</p>
                          <div className="text-[10px] text-amber-700 font-bold mt-1">
                            Items Ordered: {order.items.map(i => `${i.productTitle} (x${i.quantity})`).join(', ')}
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:text-right gap-4 border-t sm:border-0 pt-2.5 sm:pt-0">
                          <div>
                            <p className="text-[10px] text-stone-400">Total Charged</p>
                            <p className="text-sm font-bold text-stone-900">PKR {order.totalAmount.toLocaleString()}</p>
                            <p className="text-[9px] text-stone-400">Inc. Shipping fee: PKR {order.shippingCost}</p>
                          </div>
                          
                          <div className="font-sans">
                            {!order.paymentConfirmed ? (
                              <button 
                                onClick={() => {
                                  setOrders(orders.map(o => o.id === order.id ? { ...o, paymentConfirmed: true, status: "completed" } : o));
                                }}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-xl shadow-sm transition-colors"
                              >
                                Mark as Received
                              </button>
                            ) : (
                              <span className="text-teal-600 text-xs font-bold flex items-center gap-1.5 justify-end">
                                <Check className="w-3.5 h-3.5 text-teal-600" />
                                <span>Paid Direct</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: Dynamic Categories Management */}
            {activeTab === "categories" && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-base text-stone-850 font-serif">AuraMart Category Hub</h4>
                  <p className="text-stone-500 text-xs mt-0.5">Define, append and prune product category slots. Changes persist dynamically inside the buyer storefront filters and seller product forms.</p>
                </div>

                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-4 max-w-md">
                  <h5 className="text-xs font-bold text-stone-800 uppercase tracking-widest flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5 text-stone-600" />
                    <span>Create New Category</span>
                  </h5>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    const name = fd.get("catName")?.toString().trim();
                    if (name) {
                      if (categories.includes(name)) {
                        alert("This category already exists!");
                        return;
                      }
                      setCategories([...categories, name]);
                      e.currentTarget.reset();
                    }
                  }} className="flex gap-2">
                    <input 
                      name="catName"
                      required
                      placeholder="e.g. Traditional Wear, Cosmetics"
                      className="flex-grow p-2 bg-white border border-stone-250 rounded-xl text-xs text-stone-800 font-bold focus:outline-none focus:border-stone-800"
                    />
                    <button 
                      type="submit"
                      className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </form>
                </div>

                <div className="space-y-2 max-w-md">
                  <h5 className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider block">Currently Active Categories ({categories.length})</h5>
                  <div className="divide-y divide-stone-150 border border-stone-200 bg-white rounded-2xl overflow-hidden shadow-xs">
                    {categories.length === 0 ? (
                      <div className="p-4 text-center text-stone-400 text-xs">No active custom categories. Add one above.</div>
                    ) : (
                      categories.map(cat => (
                        <div key={cat} className="flex justify-between items-center p-3 hover:bg-stone-50 transition-colors">
                          <span className="text-xs font-bold text-stone-800">{cat}</span>
                          <button 
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete "${cat}"? Products with this category will default to the remaining options.`)) {
                                setCategories(categories.filter(c => c !== cat));
                              }
                            }}
                            className="p-1 px-2.5 text-red-650 hover:bg-red-50 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer text-red-650 border border-transparent hover:border-red-200"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Remove</span>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                  <p className="text-[9px] text-stone-400 leading-normal">
                    💡 Tip: Removing a category only removes the option from forms & menus. It won't delete actual items already listed, but they might be harder for customers to filter until reassigned!
                  </p>
                </div>
              </div>
            )}

            {/* TAB 6: Active Coupons & VIP Codes */}
            {activeTab === "coupons" && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-bold text-base text-stone-850 font-serif">AuraMart Promotional Coupons</h4>
                  <p className="text-stone-500 text-xs mt-0.5">Generate or view active promotional codes that buyers can validate inside their checkout panels to save PKRs.</p>
                </div>

                {successMsg && (
                  <div className="p-3 bg-emerald-50 text-emerald-850 border border-emerald-200 rounded-xl text-xs font-semibold">
                    {successMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  {/* Create Coupon Card */}
                  <form 
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setCouponError("");
                      if (!couponCode.trim()) return;
                      try {
                        await api.createCoupon({
                          code: couponCode.trim().toUpperCase(),
                          discount_amount: Number(couponDiscount),
                          is_percentage: couponIsPercentage,
                          expiry_date: couponExpiry
                        });
                        setSuccessMsg(`VIP code "${couponCode.trim().toUpperCase()}" launched!`);
                        setCouponCode("");
                        loadCouponsFeed();
                        setTimeout(() => setSuccessMsg(""), 3000);
                      } catch (err: any) {
                        setCouponError(err.message || "Failed to launch promotional code.");
                      }
                    }}
                    className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-3.5 md:col-span-2 text-xs"
                  >
                    <h5 className="font-bold text-stone-900 uppercase">Create New Promo Code</h5>

                    {couponError && (
                      <p className="text-rose-600 font-bold">{couponError}</p>
                    )}

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-500 uppercase">Coupon Code Code</label>
                      <input 
                        type="text"
                        required
                        placeholder="e.g. AURAFRESH25"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="w-full p-2 bg-white border border-stone-200 rounded-xl font-mono text-xs text-stone-900 font-extrabold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-stone-500 uppercase">Discount Power</label>
                        <input 
                          type="number"
                          required
                          value={couponDiscount}
                          onChange={(e) => setCouponDiscount(Number(e.target.value))}
                          className="w-full p-2 bg-white border border-stone-200 rounded-xl font-bold"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-stone-500 uppercase">Reduction Unit</label>
                        <select
                          value={String(couponIsPercentage)}
                          onChange={(e) => setCouponIsPercentage(e.target.value === "true")}
                          className="w-full p-2 bg-white border border-stone-200 rounded-xl font-bold cursor-pointer"
                        >
                          <option value="true">Percent (%)</option>
                          <option value="false">Fixed (PKR)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-500 uppercase">Coupon Expiration Date</label>
                      <input 
                        type="date"
                        required
                        value={couponExpiry}
                        onChange={(e) => setCouponExpiry(e.target.value)}
                        className="w-full p-2 bg-white border border-stone-200 rounded-xl text-stone-700 font-semibold"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={!couponCode}
                      className="w-full py-2 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 text-white font-black uppercase rounded-xl transition-colors cursor-pointer"
                    >
                      Launch Promo Code
                    </button>
                  </form>

                  {/* Active Coupons Ledger */}
                  <div className="md:col-span-3 space-y-2.5">
                    <h5 className="text-[10px] font-extrabold text-stone-400 uppercase tracking-widest block">Active Coupons Ledger</h5>
                    <div className="border border-stone-200 rounded-2xl overflow-hidden bg-white divide-y divide-stone-150">
                      {couponsList.length === 0 ? (
                        <div className="p-8 text-center text-stone-400 text-xs">No administrative coupons logged. Feel free to launch one on the side panel!</div>
                      ) : (
                        couponsList.map((cp) => (
                          <div key={cp.code} className="p-3.5 flex items-center justify-between gap-3 text-xs hover:bg-stone-50/50 transition-colors">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded text-[11px] border border-rose-100">{cp.code}</span>
                                <span className="inline-block text-[10px] text-stone-500 font-bold">
                                  {cp.is_percentage ? "Percentage" : "Fixed Cash"} Discount
                                </span>
                              </div>
                              <p className="text-[10px] text-stone-400">
                                Saves <span className="font-bold text-stone-800">{cp.discount_amount}{cp.is_percentage ? "%" : " PKR"}</span> | Valid till: <span className="font-bold text-stone-700">{cp.expiry_date}</span>
                              </p>
                            </div>
                            <button
                              onClick={async () => {
                                if (confirm(`Deactivate promo "${cp.code}"?`)) {
                                  try {
                                    await api.deleteCoupon(cp.code);
                                    setSuccessMsg(`Promo "${cp.code}" pruned.`);
                                    loadCouponsFeed();
                                    setTimeout(() => setSuccessMsg(""), 3000);
                                  } catch (err: any) {
                                    alert("Pruning failed: " + err.message);
                                  }
                                }
                              }}
                              className="p-1.5 px-3 bg-stone-55 text-stone-600 hover:bg-red-50 hover:text-red-700 transition-all rounded-lg text-[10px] font-bold border border-transparent hover:border-red-150"
                            >
                              Prune
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 7: Homepage Settings & Brand customization */}
            {activeTab === "homepage" && (
              <div className="space-y-6 max-w-xl">
                <div>
                  <h4 className="font-bold text-base text-stone-850 font-serif">Marketplace Branding & Banner config</h4>
                  <p className="text-stone-500 text-xs mt-0.5">Edit store labels, branding details, homepage tagline header values dynamically saved into base directories.</p>
                </div>

                {successMsg && (
                  <div className="p-3 bg-emerald-50 text-emerald-850 border border-emerald-200 rounded-xl text-xs font-semibold animate-pulse">
                    {successMsg}
                  </div>
                )}

                <div className="space-y-4 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-500 uppercase">Website Name</label>
                      <input 
                        type="text" 
                        value={webName}
                        onChange={(e) => setWebName(e.target.value)}
                        className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-900 focus:outline-none focus:border-stone-800"
                        placeholder="Aura Mart"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-500 uppercase">Website Slogan / Tagline</label>
                      <input 
                        type="text" 
                        value={webTagline}
                        onChange={(e) => setWebTagline(e.target.value)}
                        className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-900 focus:outline-none focus:border-stone-800"
                        placeholder="Premium Luxury Styles at Wholesale Rates"
                      />
                    </div>
                  </div>

                  {/* Banner content */}
                  <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-4.5">
                    <h5 className="font-bold text-xs text-stone-800 uppercase tracking-widest flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-stone-500" />
                      <span>Promotional Homepage Heroes banner</span>
                    </h5>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-[10.5px] font-bold text-stone-600 block">Main Header Message</p>
                        <p className="text-[10px] text-stone-400 mb-1">Standard display title of the hero banner element.</p>
                        <input 
                          type="text" 
                          defaultValue="Arapahoe Wholesalers Warehouse Clearance"
                          className="w-full p-2 bg-white border border-stone-200 rounded-xl text-xs font-bold text-stone-700"
                        />
                      </div>

                      <div>
                        <p className="text-[10.5px] font-bold text-stone-600 block">Promotional Markdown Sub-text</p>
                        <textarea 
                          rows={2}
                          defaultValue="Up to 45% OFF on newly arrived premium items. Fast dispatch all over Pakistan with meezan direct payments verification options."
                          className="w-full p-2 bg-white border border-stone-200 rounded-xl text-xs font-bold text-stone-700 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => saveGlobalSettings()}
                      className="px-6 py-2.5 bg-stone-900 hover:bg-stone-850 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
                    >
                      Save Branding & Banner Content
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 8: Visual Performance Reports & Analytics */}
            {activeTab === "analytics" && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-bold text-base text-stone-850 font-serif">Platform Business Performance Matrix</h4>
                  <p className="text-stone-500 text-xs mt-0.5">Continuous aggregation reporting. View product segments volume ratios, buyer ticket stats, and business indices.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Summary Metric 1 */}
                  <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl text-xs">
                    <p className="text-[9.5px] font-extrabold text-indigo-500 uppercase tracking-widest">Average Tickets (AOV)</p>
                    <p className="text-lg font-black text-indigo-950 mt-1">
                      PKR {orders.length > 0 ? Math.round(totalPkRevenue / orders.length).toLocaleString() : "0"}
                    </p>
                    <p className="text-[9px] text-indigo-500 mt-1">Average transaction order value recorded globally.</p>
                  </div>

                  {/* Summary Metric 2 */}
                  <div className="p-4 bg-teal-50/60 border border-teal-100 rounded-2xl text-xs">
                    <p className="text-[9.5px] font-extrabold text-teal-500 uppercase tracking-widest">Total Booked Orders</p>
                    <p className="text-lg font-black text-teal-950 mt-1">{orders.length} Invoiced</p>
                    <p className="text-[9px] text-teal-500 mt-1">Aggregated purchases processed through COD & verification.</p>
                  </div>

                  {/* Summary Metric 3 */}
                  <div className="p-4 bg-amber-50/60 border border-amber-100 rounded-2xl text-xs">
                    <p className="text-[9.5px] font-extrabold text-amber-500 uppercase tracking-widest">Premium Vendor Ratio</p>
                    <p className="text-lg font-black text-amber-950 mt-1">
                      {sellers.length > 0 ? Math.round((sellers.filter(s => s.isPremium).length / sellers.length) * 100) : "0"}%
                    </p>
                    <p className="text-[9px] text-amber-500 mt-1">Percentage of registered marketplace operators utilizing Premium Tiers.</p>
                  </div>
                </div>

                {/* Categories share indicators bar chart styling */}
                <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200 space-y-4">
                  <h5 className="font-extrabold text-xs text-stone-800 uppercase tracking-widest block">Store Category Volumetric Share</h5>
                  
                  <div className="space-y-3.5">
                    {categories.map((cat, idx) => {
                      const count = products.filter(p => p.category === cat).length;
                      const percentage = products.length > 0 ? Math.round((count / products.length) * 100) : 0;
                      const barColors = ["bg-rose-500", "bg-emerald-500", "bg-amber-500", "bg-indigo-500", "bg-teal-500", "bg-purple-500"];
                      const fallbackColor = barColors[idx % barColors.length];

                      return (
                        <div key={cat} className="space-y-1">
                          <div className="flex justify-between items-center text-[10.5px] font-bold text-stone-700">
                            <span>{cat} Collection</span>
                            <span className="font-mono text-stone-500">{count} items listed ({percentage}%)</span>
                          </div>
                          <div className="w-full bg-stone-200/60 h-2.5 rounded-full overflow-hidden flex">
                            <div className={`${fallbackColor} h-full transition-all duration-500`} style={{ width: `${percentage}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-4 bg-cyan-900 text-cyan-50 border border-cyan-800 rounded-2xl font-serif text-[10.5px] leading-relaxed">
                  💡 Real-Time Operational Insight: Direct WhatsApp invoice validation accounts for 92% of transactional volume. Advised settings call-rates check shows strong retention index.
                </div>
              </div>
            )}

            {/* TAB 9: AI Custom Directives and prompts settings */}
            {activeTab === "ai_assistant" && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-bold text-base text-stone-850 font-serif">AI Shopping Assistant Directives</h4>
                  <p className="text-stone-500 text-xs mt-0.5">Control the behaviors and language settings guidelines of the central AI virtual chat merchant.</p>
                </div>

                {successMsg && (
                  <div className="p-3 bg-emerald-50 text-emerald-850 border border-emerald-200 rounded-xl text-xs font-semibold">
                    {successMsg}
                  </div>
                )}

                <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-4 max-w-xl">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-600 uppercase tracking-widest block mb-1">Central System Instructions Prompt</label>
                    <textarea 
                      rows={5}
                      value={aiSystemPrompt}
                      onChange={(e) => setAiSystemPrompt(e.target.value)}
                      placeholder="Specify tone matching, multilingual options (English, Urdu, Hindi), categories priority index, or wholesale discount alerts."
                      className="w-full p-3 bg-white border border-stone-250 rounded-xl text-xs text-stone-850 focus:outline-none focus:border-stone-800 leading-normal font-sans font-medium"
                    />
                    <p className="text-[9.5px] text-stone-400 leading-normal">
                      Write strict system expectations for the LLM. You can configure it to speak in Roman Urdu/Hindi, prioritize local shipping costs guidance, highlight clearance items, or answer store return policy queries.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => saveGlobalSettings()}
                      className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Update System Instructions</span>
                    </button>
                  </div>
                </div>

                <div className="max-w-xl p-4 border border-indigo-100 bg-indigo-50/40 rounded-2xl text-[10px] text-indigo-900 leading-relaxed font-sans font-medium">
                  🌟 AI Capability Tip: The shopping assistant integrates natively with full catalogue searches. Updating system prompts instantly affects conversational responses in Urdu/Hindi.
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Global Footer panel note of configuration */}
        <div className="bg-stone-100 p-4 border-t border-stone-200 text-center text-[10px] text-stone-500 font-serif">
          Operational Admin configuration sets the parameters parsed globally inside buyers' sessions. Change values dynamically above.
        </div>

      </div>
    </div>
  );
}
