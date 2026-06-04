import { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Tag, 
  Trash2, 
  Plus, 
  Minus, 
  X, 
  Check, 
  Truck, 
  CreditCard, 
  ShieldCheck, 
  ExternalLink,
  ChevronRight,
  Info,
  Activity,
  Image,
  Heart,
  Star,
  Ticket
} from 'lucide-react';
import { Product, CartItem, Order, GlobalSettings, StoreCategory, ThemeConfig, CustomerProfile, SellerProfile } from '../types';
import { LangType } from '../utils/translations';
import CustomerDashboard from './CustomerDashboard';
import { api } from '../services/api';

interface BuyerStorefrontProps {
  products: Product[];
  orders: Order[];
  setOrders: (o: Order[]) => void;
  settings: GlobalSettings;
  directAddToCartId: string | null;
  onClearDirectAdd: () => void;
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  onGoToVendorConsole: () => void;
  activeLang: LangType;
  themeConfig: ThemeConfig;
  customerProfile: CustomerProfile;
  setCustomerProfile: (p: CustomerProfile) => void;
  translateMap: any;
  categories?: string[];
  currentUser?: SellerProfile | null;
  onShowAuth?: () => void;
}

const PAKISTAN_CITIES = [
  "Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad", 
  "Multan", "Peshawar", "Quetta", "Hyderabad", "Sialkot", "Other City"
];

export default function BuyerStorefront({
  products,
  orders,
  setOrders,
  settings,
  directAddToCartId,
  onClearDirectAdd,
  cart,
  setCart,
  onGoToVendorConsole,
  activeLang,
  themeConfig,
  customerProfile,
  setCustomerProfile,
  translateMap,
  categories,
  currentUser,
  onShowAuth
}: BuyerStorefrontProps) {
  const CATEGORIES: (StoreCategory | "All")[] = ["All", ...(categories || ["Shoes", "Bags", "Watches", "Fancy Tees", "Home Essentials"])];

  // Navigation & filtering state
  const [buyerTab, setBuyerTab] = useState<"catalog" | "dashboard">("catalog");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Wishlist state and handler using localStorage
  const [wishlist, setWishlist] = useState<string[]>(() => {
    const saved = localStorage.getItem("auramart_wishlist");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  const toggleWishlist = (productId: string) => {
    setWishlist(prev => {
      const isFav = prev.includes(productId);
      const next = isFav ? prev.filter(id => id !== productId) : [...prev, productId];
      localStorage.setItem("auramart_wishlist", JSON.stringify(next));
      return next;
    });
  };
  const [selectedCategory, setSelectedCategory] = useState<StoreCategory | "All">("All");
  const [selectedGender, setSelectedGender] = useState<"All" | "Boys" | "Girls" | "Unisex">("All");
  
  // Checkout & view states
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isOrderCompleted, setIsOrderCompleted] = useState(false);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);

  // Product Details Modal state and dynamic ratings/reviews state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [ratingInput, setRatingInput] = useState<number>(5);
  const [commentInput, setCommentInput] = useState<string>("");
  const [reviewError, setReviewError] = useState<string>("");
  const [reviewSuccess, setReviewSuccess] = useState<string>("");
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);

  // Dynamic Coupon verification states
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount_amount: number; is_percentage: boolean } | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [couponStatusMsg, setCouponStatusMsg] = useState("");

  const handleApplyCoupon = async () => {
    if (!couponCodeInput.trim()) return;
    setIsApplyingCoupon(true);
    setCouponStatusMsg("");
    try {
      const couponObj = await api.getCoupon(couponCodeInput.trim().toUpperCase());
      if (couponObj) {
        setAppliedCoupon({
          code: couponObj.code,
          discount_amount: Number(couponObj.discount_amount),
          is_percentage: !!couponObj.is_percentage
        });
        const symbol = couponObj.is_percentage ? "%" : " PKR";
        setCouponStatusMsg(`Applied successfully! code "${couponObj.code}" saves ${couponObj.discount_amount}${symbol} off list subtotal.`);
      }
    } catch (err: any) {
      setCouponStatusMsg(err.message || "This coupon code is invalid or has expired.");
      setAppliedCoupon(null);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  // Fetch reviews whenever a product details modal is activated
  useEffect(() => {
    if (selectedProduct) {
      const fetchReviews = async () => {
        setIsLoadingReviews(true);
        setReviewError("");
        setReviewSuccess("");
        try {
          const list = await api.getReviews(selectedProduct.id);
          setReviews(Array.isArray(list) ? list : []);
        } catch (err: any) {
          console.warn("Failed to fetch reviews feed:", err);
          setReviews([]);
        } finally {
          setIsLoadingReviews(false);
        }
      };
      fetchReviews();
      // Reset review entry inputs
      setRatingInput(5);
      setCommentInput("");
    } else {
      setReviews([]);
    }
  }, [selectedProduct]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (!commentInput.trim()) {
      setReviewError("Please include some textual feedback comment.");
      return;
    }
    
    setIsSubmittingReview(true);
    setReviewError("");
    setReviewSuccess("");
    
    try {
      const payload = {
        productId: selectedProduct.id,
        rating: ratingInput,
        comment: commentInput.trim()
      };
      
      const res = await api.postReview(payload);
      if (res.error) {
        throw new Error(res.error);
      }
      
      setReviewSuccess("Review submitted successfully! Thank you for your feedback.");
      setCommentInput("");
      setRatingInput(5);
      
      // Re-fetch reviews to update display dynamically
      const list = await api.getReviews(selectedProduct.id);
      setReviews(Array.isArray(list) ? list : []);
    } catch (err: any) {
      setReviewError(err.message || "Failed to submit review. Make sure you are signed in.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Customer Checkout Details State
  const [customerDetails, setCustomerDetails] = useState({
    name: customerProfile.name || "",
    phone: customerProfile.phone || "",
    address: customerProfile.address || "",
    city: customerProfile.city || "Karachi",
    paymentMethod: "Bank Transfer",
    transactionId: ""
  });

  const [paymentScreenshot, setPaymentScreenshot] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPaymentScreenshot(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setPaymentScreenshot(event.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const [formErrors, setFormErrors] = useState<Partial<typeof customerDetails>>({});

  useEffect(() => {
    setCustomerDetails(prev => ({
      ...prev,
      name: customerProfile.name || prev.name,
      phone: customerProfile.phone || prev.phone,
      address: customerProfile.address || prev.address,
      city: customerProfile.city || prev.city
    }));
  }, [customerProfile]);

  // Direct checkout link automation
  useEffect(() => {
    if (directAddToCartId) {
      const matchProduct = products.find(p => p.id === directAddToCartId);
      if (matchProduct) {
        // Auto add to cart
        const existingIdx = cart.findIndex(item => item.product.id === matchProduct.id);
        if (existingIdx > -1) {
          const updated = [...cart];
          updated[existingIdx].quantity += 1;
          setCart(updated);
        } else {
          setCart([...cart, {
            product: matchProduct,
            quantity: 1,
            selectedColor: matchProduct.colors[0] || "Standard",
            selectedSize: matchProduct.sizes[0] || "Medium"
          }]);
        }
        setIsCartOpen(true);
        onClearDirectAdd(); // Clear trigger
      }
    }
  }, [directAddToCartId, products]);

  // Adjust item quantities
  const updateQty = (index: number, val: number) => {
    const updated = [...cart];
    updated[index].quantity += val;
    if (updated[index].quantity <= 0) {
      updated.splice(index, 1);
    }
    setCart(updated);
  };

  const removeCartItem = (index: number) => {
    const updated = [...cart];
    updated.splice(index, 1);
    setCart(updated);
  };

  // Compute pricing totals in PKR with dynamic Coupon verification
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const discountVal = appliedCoupon 
    ? (appliedCoupon.is_percentage 
        ? Math.round(cartSubtotal * (Number(appliedCoupon.discount_amount) / 100)) 
        : Number(appliedCoupon.discount_amount))
    : 0;
  const finalSubtotal = Math.max(0, cartSubtotal - discountVal);
  const shippingFee = customerDetails.city === "Karachi" 
    ? settings.karachiShippingCost 
    : settings.otherCitiesShippingCost;
  const cartTotalVal = cartSubtotal > 0 ? (finalSubtotal + shippingFee) : 0;

  // Search and filter operations
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    const matchesGender = selectedGender === "All" || p.forGender === selectedGender;
    return matchesSearch && matchesCategory && matchesGender;
  });

  // Handle order completions
  const handleCheckOutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Partial<typeof customerDetails> = {};
    if (!customerDetails.name) errors.name = "Billing full name required";
    if (!customerDetails.phone) errors.phone = "WhatsApp Phone Number required";
    if (!customerDetails.address) errors.address = "Detailed Courier Address required";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const payload = {
        buyerName: customerDetails.name,
        buyerPhone: customerDetails.phone,
        buyerAddress: customerDetails.address,
        buyerCity: customerDetails.city,
        items: cart.map(item => ({
          productId: item.product.id,
          productTitle: item.product.title,
          quantity: item.quantity,
          price: item.product.price,
          selectedColor: item.selectedColor,
          selectedSize: item.selectedSize,
          imageUrl: item.product.imageUrl
        })),
        paymentMethod: customerDetails.paymentMethod,
        txnId: customerDetails.transactionId || null,
        couponCode: appliedCoupon?.code || null,
        discountAmount: discountVal
      };

      const result = await api.createOrder(payload);

      const newOrder: Order = {
        id: result.orderId,
        sellerId: "admin-system",
        buyerName: customerDetails.name,
        buyerPhone: customerDetails.phone,
        buyerAddress: customerDetails.address,
        buyerCity: customerDetails.city,
        items: cart.map(item => ({
          productId: item.product.id,
          productTitle: item.product.title,
          quantity: item.quantity,
          price: item.product.price,
          selectedColor: item.selectedColor,
          selectedSize: item.selectedSize,
          imageUrl: item.product.imageUrl
        })),
        subtotal: cartSubtotal,
        shippingCost: result.shippingCost || shippingFee,
        totalAmount: result.totalAmount || cartTotalVal,
        paymentMethod: customerDetails.paymentMethod,
        status: "pending",
        createdAt: new Date().toISOString(),
        paymentConfirmed: !!customerDetails.transactionId,
        notified: true,
        couponCode: appliedCoupon?.code || undefined,
        discountAmount: discountVal || undefined
      };

      // Format WhatsApp message text
      const itemsText = cart.map(item => `• ${item.product.title} (Qty: ${item.quantity}, Size: ${item.selectedSize}, Color: ${item.selectedColor})`).join("\n");
      const couponSnippet = appliedCoupon ? `*Coupon Applied:* ${appliedCoupon.code} (-PKR ${discountVal.toLocaleString()})\n` : "";
      const whatsAppText = `*NEW ORDER SUBMITTED ON AURAMART* 🛍️\n\n` +
        `*Order ID:* ${newOrder.id}\n` +
        `*Customer Name:* ${newOrder.buyerName}\n` +
        `*Active Phone:* ${newOrder.buyerPhone}\n` +
        `*Shipping Destination:* ${newOrder.buyerCity}\n` +
        `*Complete Address:* ${newOrder.buyerAddress}\n\n` +
        `*Items Ordered:*\n${itemsText}\n\n` +
        `*Subtotal:* PKR ${newOrder.subtotal.toLocaleString()}\n` +
        couponSnippet +
        `*Shipping Fee:* PKR ${newOrder.shippingCost.toLocaleString()}\n` +
        `*Grand Total:* *PKR ${newOrder.totalAmount.toLocaleString()}*\n\n` +
        `*Payment Method:* ${newOrder.paymentMethod}\n` +
        `*Payment Reference/ID:* ${customerDetails.transactionId || 'N/A'}\n\n` +
        `⚠️ *Please see/verify the uploaded screenshot receipt signature attached in chat.*`;

      const encodedText = encodeURIComponent(whatsAppText);
      const targetWhatsAppNumber = settings.adminWhatsApp.replace('+', '').replace(' ', '').trim();
      const waUrl = `https://wa.me/${targetWhatsAppNumber}?text=${encodedText}`;

      // Proceed to open WhatsApp securely
      try {
        window.open(waUrl, '_blank');
      } catch(err) {
        console.log("Blocked by popup blocker");
      }

      setOrders([newOrder, ...orders]);
      setLastOrder(newOrder);
      setCart([]);
      setIsCheckoutOpen(false);
      setIsCartOpen(false);
      setIsOrderCompleted(true);
    } catch (err: any) {
      alert("Failed to submit order transaction: " + err.message);
    }
  };

  const getThemeClasses = () => {
    switch(themeConfig.primaryColor) {
      case 'rose':
        return {
          primaryBg: 'bg-rose-700 hover:bg-rose-800 text-white',
          secondaryBg: 'bg-rose-50 text-rose-800 border-rose-200',
          badgeBg: 'bg-rose-100 text-rose-850 border-rose-200',
          textActive: 'text-rose-800',
          accentBorder: 'border-rose-100',
          hoverColorClass: 'group-hover:text-rose-850'
        };
      case 'emerald':
        return {
          primaryBg: 'bg-emerald-700 hover:bg-emerald-800 text-white',
          secondaryBg: 'bg-emerald-50 text-emerald-850 border-emerald-200',
          badgeBg: 'bg-emerald-100 text-emerald-850 border-emerald-250',
          textActive: 'text-emerald-800',
          accentBorder: 'border-emerald-100',
          hoverColorClass: 'group-hover:text-emerald-850'
        };
      case 'amber':
        return {
          primaryBg: 'bg-amber-500 hover:bg-amber-600 text-stone-950',
          secondaryBg: 'bg-amber-50 text-amber-900 border-amber-250',
          badgeBg: 'bg-amber-100 text-amber-900 border-amber-250',
          textActive: 'text-amber-800',
          accentBorder: 'border-amber-100',
          hoverColorClass: 'group-hover:text-amber-700'
        };
      case 'slate':
      default:
        return {
          primaryBg: 'bg-stone-900 hover:bg-stone-850 text-white',
          secondaryBg: 'bg-stone-100 text-stone-800 border-stone-200',
          badgeBg: 'bg-stone-100 text-stone-850 border-stone-250',
          textActive: 'text-stone-900',
          accentBorder: 'border-stone-200/80',
          hoverColorClass: 'group-hover:text-stone-950'
        };
    }
  };

  const activeTheme = getThemeClasses();
  const resolvedBanner = translateMap.promoBanner
    .replace('{karachi}', settings.karachiShippingCost.toString())
    .replace('{other}', settings.otherCitiesShippingCost.toString());

  return (
    <div className="min-h-screen bg-stone-50 pb-16">
      
      {/* Dynamic Promotion Banner */}
      <div className="bg-stone-900 border-b border-amber-500/20 py-2.5 px-4 text-center">
        <p className="text-[10px] sm:text-[11px] text-amber-400 font-extrabold tracking-wider uppercase flex items-center justify-center gap-1.5 font-sans">
          <Truck className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
          <span>{resolvedBanner}</span>
        </p>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        
        {/* Interactive Tab Switcher */}
        <div className="flex gap-2 mb-6 border-b border-stone-200 pb-3">
          <button
            onClick={() => setBuyerTab("catalog")}
            className={`px-4.5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
              buyerTab === "catalog" 
                ? `${activeTheme.primaryBg} shadow-md` 
                : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-amber-400" />
            <span>{translateMap.catalogTitle}</span>
          </button>
          
          <button
            onClick={() => setBuyerTab("dashboard")}
            className={`px-4.5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
              buyerTab === "dashboard" 
                ? `${activeTheme.primaryBg} shadow-md` 
                : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
            }`}
          >
            <Activity className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>{translateMap.dashboardTitle}</span>
          </button>
        </div>

        {buyerTab === "dashboard" ? (
          <CustomerDashboard 
            orders={orders} 
            currentLang={activeLang} 
            profile={customerProfile} 
            onSaveProfile={setCustomerProfile} 
            wishlist={wishlist}
            onToggleWishlist={toggleWishlist}
            products={products}
            onAddToCart={(p) => {
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
              setIsCartOpen(true);
            }}
          />
        ) : (
          <>
            {/* Filtering & Search Section */}
            <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row gap-3.5 items-center justify-between">
                <div className="relative w-full md:w-80">
                  <input 
                    type="text" 
                    placeholder={translateMap.searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs focus:outline-none focus:border-stone-800"
                  />
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3.5" />
                </div>

                <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold tracking-wide transition-all cursor-pointer ${
                        selectedCategory === cat 
                          ? `${activeTheme.primaryBg} shadow-xs` 
                          : "bg-stone-100 hover:bg-stone-200 text-stone-600"
                      }`}
                    >
                      {cat === "All" ? translateMap.allCategories : cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-widest">{translateMap.filterStyles}:</span>
                {["All", "Boys", "Girls", "Unisex"].map((gender: any) => (
                  <button
                    key={gender}
                    onClick={() => setSelectedGender(gender)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all border cursor-pointer ${
                      selectedGender === gender 
                        ? `${activeTheme.secondaryBg} border-stone-300 font-black` 
                        : "bg-white text-stone-500 border-stone-200 hover:bg-stone-50"
                    }`}
                  >
                    {gender === "All" ? translateMap.genderAll : gender}
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic products catalog shelf */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-5 border-b border-stone-200 pb-2">
                <h4 className="font-bold text-base text-stone-850 leading-none">{translateMap.catalogTitle}</h4>
                <p className="text-xs text-stone-400 font-bold">Showing {filteredProducts.length} items</p>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="bg-white border rounded-3xl p-16 text-center text-stone-400 text-xs shadow-xs">
                  {translateMap.noProductsFound}
                </div>
              ) : themeConfig.layoutType === "compact" ? (
                /* Sleek Row catalog (Compact density layout mode) */
                <div className="space-y-3">
                  {filteredProducts.map((p) => (
                    <div key={p.id} className="bg-white rounded-2xl border border-stone-200/80 p-3 shadow-xs hover:shadow-xs transition-all flex flex-col sm:flex-row items-center justify-between gap-4 group">
                      <div className="flex items-center gap-4 w-full cursor-pointer" onClick={() => setSelectedProduct(p)}>
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-stone-100 shrink-0">
                          <img 
                            src={p.imageUrl} 
                            alt={p.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-350"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${activeTheme.badgeBg}`}>
                              {p.category}
                            </span>
                            <h5 className={`font-bold text-stone-900 text-xs group-hover:text-stone-950 transition-colors ${activeTheme.hoverColorClass}`}>{p.title}</h5>
                          </div>
                          <p className="text-[10.5px] text-stone-550 mt-1 line-clamp-1">{p.description}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
                        <div className="text-left sm:text-right">
                          <p className="text-[9px] font-bold text-stone-400 uppercase leading-none">{translateMap.priceLabel}</p>
                          <p className="text-xs font-black text-stone-950 mt-0.5 font-mono">PKR {p.price.toLocaleString()}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleWishlist(p.id)}
                            className="p-2 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 transition-colors cursor-pointer group/heart"
                            title={wishlist.includes(p.id) ? "Remove from Wishlist" : "Save to Wishlist"}
                          >
                            <Heart className={`w-3.5 h-3.5 transition-all ${wishlist.includes(p.id) ? 'fill-rose-500 text-rose-500 scale-110' : 'text-stone-450 group-hover/heart:text-rose-500 group-hover/heart:scale-105'}`} />
                          </button>

                          <button
                            onClick={() => {
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
                              setIsCartOpen(true);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold transition-all active:scale-97 flex items-center gap-1.5 cursor-pointer ${activeTheme.primaryBg}`}
                          >
                            <ShoppingBag className="w-3 h-3" />
                            <span>Buy Now</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Traditional 4-Column Card Grid */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {filteredProducts.map((p) => (
                    <div key={p.id} className="bg-white rounded-3xl border border-stone-200/80 overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col justify-between">
                      <div className="relative aspect-square overflow-hidden bg-stone-100 cursor-pointer" onClick={() => setSelectedProduct(p)}>
                        <img 
                          src={p.imageUrl} 
                          alt={p.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                        <span className={`absolute top-2.5 left-2.5 text-[8px] font-black uppercase px-2 py-0.5 rounded-lg border backdrop-blur-xs ${activeTheme.badgeBg}`}>
                          {p.category}
                        </span>

                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleWishlist(p.id);
                          }}
                          className="absolute top-2.5 right-2.5 p-2 rounded-full bg-white/95 backdrop-blur-xs shadow-sm hover:scale-110 active:scale-95 transition-all cursor-pointer z-10 group/heart"
                          title={wishlist.includes(p.id) ? "Remove from Wishlist" : "Save to Wishlist"}
                        >
                          <Heart className={`w-3.5 h-3.5 transition-all ${wishlist.includes(p.id) ? 'fill-rose-500 text-rose-500 scale-110' : 'text-stone-500 group-hover/heart:text-rose-500'}`} />
                        </button>
                      </div>

                      <div className="p-4 space-y-1 bg-white flex-grow flex flex-col justify-between">
                        <div className="cursor-pointer" onClick={() => setSelectedProduct(p)}>
                          <h5 className={`font-bold text-stone-900 text-xs leading-snug line-clamp-1 group-hover:text-stone-990 transition-colors ${activeTheme.hoverColorClass}`}>{p.title}</h5>
                          <p className="text-[10px] text-stone-500 leading-normal line-clamp-2 mt-1">{p.description}</p>
                        </div>
                        
                        <div className="pt-2.5 flex items-center justify-between">
                          <div>
                            <p className="text-[8.5px] font-bold text-stone-400 uppercase leading-none">{translateMap.priceLabel}</p>
                            <p className="text-xs font-extrabold text-stone-900 mt-1">PKR {p.price.toLocaleString()}</p>
                          </div>

                          <button
                            onClick={() => {
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
                              setIsCartOpen(true);
                            }}
                            className={`px-3.5 py-1.5 rounded-xl text-[10px] font-bold transition-all hover:scale-102 flex items-center gap-1.5 cursor-pointer ${activeTheme.primaryBg}`}
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>Buy Now</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

      </div>

      {/* Floating cart checker anchor */}
      {cart.length > 0 && !isCartOpen && (
        <button 
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-stone-900 text-white shadow-xl hover:scale-105 transition-all flex items-center gap-2 hover:bg-stone-850 cursor-pointer"
        >
          <ShoppingBag className="w-5 h-5 text-amber-400" />
          <span className="text-xs font-bold leading-none">{cart.reduce((s,i) => s + i.quantity, 0)} Items Added</span>
          <span className="text-[10.5px] text-amber-300 font-extrabold border-l border-stone-700 pl-2 leading-none">PKR {cartSubtotal.toLocaleString()}</span>
        </button>
      )}

      {/* CART DRAWER PANEL */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs" onClick={() => setIsCartOpen(false)} />
          
          <div className="bg-white w-full max-w-md relative z-10 p-6 shadow-2xl flex flex-col justify-between border-l border-stone-200">
            <div>
              <div className="flex items-center justify-between border-b border-stone-200 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-stone-800" />
                  <span className="text-sm font-bold text-stone-900">Your E-Commerce Cart</span>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="p-1 rounded-full hover:bg-stone-100 text-stone-500">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Cart listing scrollable box */}
              <div className="space-y-3.5 max-h-[55vh] overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <div className="py-12 text-center text-stone-400 text-xs">
                    Your shopping cart is currently empty! Added items will catalog here.
                  </div>
                ) : (
                  cart.map((item, idx) => (
                    <div key={idx} className="flex gap-3 p-3 bg-stone-50 border border-stone-200/70 rounded-xl relative">
                      <img 
                        src={item.product.imageUrl} 
                        alt={item.product.title} 
                        className="w-12 h-12 rounded-lg object-cover border"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-grow space-y-0.5">
                        <p className="text-xs font-bold text-stone-900 line-clamp-1">{item.product.title}</p>
                        <p className="text-[10px] text-stone-500">PKR {item.product.price.toLocaleString()} each</p>

                        <div className="flex items-center justify-between pt-1.5">
                          <div className="flex items-center border border-stone-250 bg-white rounded-lg">
                            <button onClick={() => updateQty(idx, -1)} className="p-1 text-stone-600 hover:text-stone-900">
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2 text-xs font-bold text-stone-800">{item.quantity}</span>
                            <button onClick={() => updateQty(idx, 1)} className="p-1 text-stone-600 hover:text-stone-900">
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <button onClick={() => removeCartItem(idx)} className="text-stone-400 hover:text-red-600 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Bottom aggregate section */}
            {cart.length > 0 && (
              <div className="border-t border-stone-200 pt-5 space-y-4">
                
                {/* Coupon Code Verification Block */}
                <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[9.5px] font-extrabold text-stone-500 uppercase tracking-widest flex items-center gap-1">
                      <Ticket className="w-3.5 h-3.5 text-stone-400" />
                      <span>Promotional Coupon Code</span>
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    <input 
                      type="text"
                      placeholder="e.g. AURAMART10"
                      value={couponCodeInput}
                      onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                      disabled={!!appliedCoupon}
                      className="flex-grow p-2.5 bg-white border border-stone-250 rounded-xl text-xs font-mono font-bold uppercase focus:outline-none focus:border-stone-850 disabled:bg-stone-100 disabled:text-stone-500 text-stone-800"
                    />
                    {appliedCoupon ? (
                      <button
                        onClick={() => {
                          setAppliedCoupon(null);
                          setCouponCodeInput("");
                          setCouponStatusMsg("");
                        }}
                        className="px-3 bg-red-50 hover:bg-red-100 text-red-650 hover:text-red-700 font-bold rounded-xl text-xs transition-colors border border-red-100 cursor-pointer shrink-0"
                      >
                        Reset
                      </button>
                    ) : (
                      <button
                        onClick={handleApplyCoupon}
                        disabled={isApplyingCoupon || !couponCodeInput}
                        className="px-4 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer whitespace-nowrap"
                      >
                        {isApplyingCoupon ? "Validating..." : "Apply"}
                      </button>
                    )}
                  </div>
                  {couponStatusMsg && (
                    <p className={`text-[10px] font-bold leading-tight ${appliedCoupon ? "text-emerald-600" : "text-rose-600"}`}>
                      {couponStatusMsg}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5 text-xs text-stone-600">
                  <div className="flex justify-between">
                    <span>Products Subtotal</span>
                    <span className="font-bold text-stone-900">PKR {cartSubtotal.toLocaleString()}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-emerald-600">
                      <span className="flex items-center gap-1 font-semibold">Special Discount ({appliedCoupon.code})</span>
                      <span className="font-bold">- PKR {discountVal.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1">
                      <span>Delivery Cost</span>
                      <span title="Karachi: 300, Other cities: 350"><Info className="w-3 h-3 text-stone-400" /></span>
                    </span>
                    <span className="font-bold text-stone-900">PKR {shippingFee}</span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-stone-950 border-t pt-2 mt-1">
                    <span>Grand Total (PKR)</span>
                    <span className="text-amber-600">PKR {cartTotalVal.toLocaleString()}</span>
                  </div>
                </div>

                <button 
                  onClick={() => setIsCheckoutOpen(true)}
                  className="w-full py-3 bg-stone-900 hover:bg-stone-850 text-white font-bold rounded-2xl text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CreditCard className="w-4 h-4 text-amber-500" />
                  <span>Verify Pay & Complete Order</span>
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* CHECKOUT POPUP DIALOG */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs" onClick={() => setIsCheckoutOpen(false)} />
          
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl relative w-full max-w-md border border-stone-200 z-10 max-h-[90vh] flex flex-col font-sans">
            <div className="p-5 border-b border-stone-200 bg-stone-900 text-stone-100 flex justify-between items-center">
              <span className="text-sm font-extrabold flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-amber-400" />
                <span>Secure Direct Checkout</span>
              </span>
              <button onClick={() => setIsCheckoutOpen(false)} className="text-stone-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCheckOutSubmit} className="p-5 overflow-y-auto space-y-4 text-xs flex-grow">
              
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-stone-500 uppercase">Customer Full Name*</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Ahnaf Ali"
                  value={customerDetails.name}
                  onChange={(e) => setCustomerDetails({...customerDetails, name: e.target.value})}
                  className="w-full p-2.5 bg-stone-50 border border-stone-250 rounded-xl"
                />
                {formErrors.name && <p className="text-red-500 text-[10px]">{formErrors.name}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-stone-500 uppercase">WhatsApp Active Number*</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. +92 320 2838491"
                  value={customerDetails.phone}
                  onChange={(e) => setCustomerDetails({...customerDetails, phone: e.target.value})}
                  className="w-full p-2.5 bg-stone-50 border border-stone-250 rounded-xl"
                />
                {formErrors.phone && <p className="text-red-500 text-[10px]">{formErrors.phone}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-stone-500 uppercase">City Selection (Select rates)*</label>
                <select 
                  value={customerDetails.city}
                  onChange={(e) => setCustomerDetails({...customerDetails, city: e.target.value})}
                  className="w-full p-2.5 bg-stone-50 border border-stone-250 rounded-xl font-bold text-stone-800"
                >
                  {PAKISTAN_CITIES.map(city => (
                    <option key={city} value={city}>
                      {city} ({city === 'Karachi' ? 'Shipping: 300 PKR' : 'Shipping: 350 PKR'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-stone-500 uppercase">Complete Home Address*</label>
                <textarea 
                  required
                  placeholder="Street name, house number, apartment details, building name..."
                  value={customerDetails.address}
                  onChange={(e) => setCustomerDetails({...customerDetails, address: e.target.value})}
                  className="w-full p-2.5 bg-stone-50 border border-stone-250 rounded-xl h-16 resize-none"
                />
                {formErrors.address && <p className="text-red-500 text-[10px]">{formErrors.address}</p>}
              </div>

              <div className="space-y-3 p-3 rounded-2xl bg-amber-50/70 border border-amber-200">
                <label className="text-[10px] font-bold text-amber-900 uppercase flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                  <span>Secure PKR Direct Transfer Payment Gateway</span>
                </label>
                
                <p className="text-[10px] text-amber-800 leading-normal mb-1">
                  We process payments instantly direct to Admin. Please transfer the grand total in PKR using your preferred mobile wallet or bank account, then fill out the transaction details below.
                </p>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-stone-600 uppercase">Select Payment Channel*</label>
                  <select 
                    value={customerDetails.paymentMethod}
                    onChange={(e) => setCustomerDetails({...customerDetails, paymentMethod: e.target.value})}
                    className="w-full p-2 bg-white border border-amber-300 rounded-lg text-[10px] font-bold text-stone-800 focus:outline-none"
                  >
                    <option value="Meezan Bank Ltd Transfer">Meezan Bank Wire Transfer</option>
                    <option value="EasyPaisa Wallet">EasyPaisa Mobile Wallet</option>
                    <option value="JazzCash Wallet">JazzCash Mobile Wallet</option>
                  </select>
                </div>

                {/* Secure Dynamic Instruction Plate */}
                <div className="p-2.5 bg-white rounded-xl border border-amber-200/80 text-[10px] text-stone-700 leading-normal space-y-1">
                  {customerDetails.paymentMethod === "Meezan Bank Ltd Transfer" ? (
                    <>
                      <p>🏦 <strong>Bank:</strong> Meezan Bank Limited</p>
                      <p>💳 <strong>Account Title:</strong> AuraMart Store Ledger</p>
                      <p>🔢 <strong>IBAN / Acc No:</strong> PK34MEZN0034200283849101</p>
                    </>
                  ) : customerDetails.paymentMethod === "EasyPaisa Wallet" ? (
                    <>
                      <p>📱 <strong>Mobile Wallet:</strong> EasyPaisa Wallet Channel</p>
                      <p>👤 <strong>Account Name:</strong> Ahnaf Ali</p>
                      <p>📞 <strong>Wallet Number:</strong> 0320-2838491</p>
                    </>
                  ) : (
                    <>
                      <p>📱 <strong>Mobile Wallet:</strong> JazzCash Wallet Channel</p>
                      <p>👤 <strong>Account Name:</strong> Ahnaf Ali</p>
                      <p>📞 <strong>Wallet Number:</strong> 0320-2838491</p>
                    </>
                  )}
                  <p className="text-[9px] text-[#25D366] font-bold border-t pt-1 mt-1 flex items-center gap-1">
                    🛡️ Authenticated & secure under standard PKR transaction protocol.
                  </p>
                </div>

                {/* Reference ID input */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-stone-605 uppercase">Transaction reference ID*</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Enter wallet transaction ID / Reference Code"
                    value={customerDetails.transactionId}
                    onChange={(e) => setCustomerDetails({...customerDetails, transactionId: e.target.value})}
                    className="w-full p-2 bg-white border border-amber-200 rounded-xl text-[10.5px] focus:outline-none focus:border-amber-500 text-stone-850 font-mono font-bold"
                  />
                </div>

                {/* Screenshot upload zone */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-stone-605 uppercase">Proof of Payment Receipt Screenshot*</label>
                  <div 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-3.5 text-center cursor-pointer transition-all ${
                      isDragging ? 'border-amber-600 bg-amber-105/50 border-solid' : 'border-amber-300 bg-white hover:bg-stone-50'
                    }`}
                    onClick={() => document.getElementById('screenshot-receipt-file')?.click()}
                  >
                    <input 
                      type="file" 
                      id="screenshot-receipt-file"
                      required
                      accept="image/*"
                      onChange={handleScreenshotChange}
                      className="hidden"
                    />
                    {paymentScreenshot ? (
                      <div className="flex flex-col items-center gap-1.5 font-sans">
                        <img 
                          src={paymentScreenshot} 
                          alt="Receipt screenshot preview" 
                          className="h-20 object-contain rounded-lg border border-stone-200 pointer-events-none" 
                        />
                        <span className="text-[9px] text-emerald-600 font-extrabold flex items-center gap-1 justify-center">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Screenshot loaded successfully</span>
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-1 py-1">
                        <Image className="w-5 h-5 text-amber-600 mx-auto animate-pulse" />
                        <p className="text-[9.5px] font-bold text-stone-600">Drag Receipt Screenshot here or Click</p>
                        <p className="text-[8.5px] text-stone-400">Supports PNG, JPG, JPEG (Receipt image checks enforced)</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              <div className="border-t border-stone-200 pt-3 space-y-1.5 font-bold">
                <div className="flex justify-between text-stone-600">
                  <span>Cart Items sum</span>
                  <span>PKR {cartSubtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Shipping Cost ({customerDetails.city})</span>
                  <span>PKR {shippingFee}</span>
                </div>
                <div className="flex justify-between text-[13px] text-stone-900 pt-1 border-t">
                  <span>Grand Total PKR</span>
                  <span className="text-amber-600">PKR {cartTotalVal.toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-2">
                <button 
                  type="submit"
                  className="w-full py-3 bg-stone-900 hover:bg-stone-850 text-white font-extrabold uppercase rounded-2xl tracking-wider hover:scale-101 transition-all shadow-md cursor-pointer"
                >
                  Confirm Payment - PKR {cartTotalVal.toLocaleString()}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* PRODUCT DETAILS MODAL VIEW WITH REVIEWS */}
      {selectedProduct && (
        <div className="fixed inset-0 z-55 overflow-y-auto flex items-center justify-center p-4">
          {/* Backdrop screen */}
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs" onClick={() => setSelectedProduct(null)} />
          
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl relative w-full max-w-2xl border border-stone-200 z-10 max-h-[90vh] flex flex-col font-sans">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-stone-150 bg-stone-900 text-stone-100 flex justify-between items-center shrink-0">
              <span className="text-sm font-extrabold flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-400" />
                <span>Product Detailed Specifications</span>
              </span>
              <button 
                onClick={() => setSelectedProduct(null)} 
                className="text-stone-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs flex-grow">
              
              {/* Product Info Block (Image left, meta right) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start pb-5 border-b border-stone-100">
                {/* Product image container */}
                <div className="aspect-square w-full rounded-2xl overflow-hidden bg-stone-50 border border-stone-150 relative shadow-inner">
                  <img 
                    src={selectedProduct.imageUrl} 
                    alt={selectedProduct.title} 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                  <span className={`absolute top-3 left-3 text-[9px] font-black uppercase px-2.5 py-1 rounded-lg border backdrop-blur-xs shadow-xs ${activeTheme.badgeBg}`}>
                    {selectedProduct.category}
                  </span>
                </div>

                {/* Details list column */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-black text-stone-900 leading-tight">{selectedProduct.title}</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">For style:</span>
                      <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase bg-stone-100 text-stone-600 rounded-md">
                        {selectedProduct.forGender}
                      </span>
                    </div>
                  </div>

                  {/* Pricing Frame */}
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-150 flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-bold text-stone-400 uppercase leading-none">Pakistan Retail Price</p>
                      <p className="text-sm font-extrabold text-stone-900 mt-1 font-mono">PKR {selectedProduct.price.toLocaleString()}</p>
                    </div>
                    
                    {selectedProduct.stockCount > 0 ? (
                      <span className="text-[9.5px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg">
                        In Stock ({selectedProduct.stockCount})
                      </span>
                    ) : (
                      <span className="text-[9.5px] font-bold text-red-500 bg-red-50 border border-red-100 px-2 py-1 rounded-lg">
                        Out of Stock
                      </span>
                    )}
                  </div>

                  {/* Color & Size Specs */}
                  <div className="grid grid-cols-2 gap-3 text-[10px]">
                    <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-100">
                      <p className="font-bold text-stone-400 uppercase text-[8px] tracking-wider mb-1">Available Colors</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedProduct.colors && selectedProduct.colors.length > 0 ? (
                          selectedProduct.colors.map(color => (
                            <span key={color} className="px-1.5 py-0.5 bg-white border border-stone-200 text-stone-700 rounded text-[9px] font-medium">{color}</span>
                          ))
                        ) : (
                          <span className="text-stone-400">Standard</span>
                        )}
                      </div>
                    </div>

                    <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-100">
                      <p className="font-bold text-stone-400 uppercase text-[8px] tracking-wider mb-1">Available Sizes</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedProduct.sizes && selectedProduct.sizes.length > 0 ? (
                          selectedProduct.sizes.map(size => (
                            <span key={size} className="px-1.5 py-0.5 bg-white border border-stone-200 text-stone-700 rounded text-[9px] font-medium">{size}</span>
                          ))
                        ) : (
                          <span className="text-stone-400">Regular</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Add to Cart button */}
                  <button
                    disabled={selectedProduct.stockCount <= 0}
                    onClick={() => {
                      const existingIdx = cart.findIndex(item => item.product.id === selectedProduct.id);
                      if (existingIdx > -1) {
                        const u = [...cart];
                        u[existingIdx].quantity += 1;
                        setCart(u);
                      } else {
                        setCart([...cart, {
                          product: selectedProduct,
                          quantity: 1,
                          selectedColor: selectedProduct.colors[0] || "Standard",
                          selectedSize: selectedProduct.sizes[0] || "Medium"
                        }]);
                      }
                      setIsCartOpen(true);
                      setSelectedProduct(null); // Close modal
                    }}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      selectedProduct.stockCount <= 0 ? 'bg-stone-200 text-stone-400 cursor-not-allowed' : activeTheme.primaryBg
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4 text-amber-400" />
                    <span>Add to Shopping Cart</span>
                  </button>

                </div>
              </div>

              {/* Product description area */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-stone-800 uppercase tracking-widest leading-none">Product Description</h4>
                <p className="text-xs text-stone-600 leading-relaxed bg-stone-50 p-4 rounded-2xl border border-stone-150">
                  {selectedProduct.description}
                </p>
              </div>

              {/* REVIEWS AND RATINGS SECTION */}
              <div className="space-y-4 pt-4 border-t border-stone-150">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-stone-800 uppercase tracking-widest leading-none flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-550 fill-amber-500 text-amber-500" />
                    <span>Customer Reviews ({reviews.length})</span>
                  </h4>
                  
                  {reviews.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-stone-800">
                        Avg: {(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)} / 5.0
                      </span>
                      <div className="flex items-center text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => {
                          const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
                          return (
                            <Star 
                              key={i} 
                              className={`w-3 h-3 ${i < Math.round(avg) ? 'text-amber-500 fill-amber-500' : 'text-stone-200'}`} 
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Submitting form widget */}
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-150 space-y-3">
                  <p className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider">Leave Your Star Feedback</p>
                  
                  {currentUser ? (
                    <form onSubmit={handleReviewSubmit} className="space-y-3">
                      
                      {/* Interactive Stars selector bar */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-stone-500 font-medium">Your Rating Score:</span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRatingInput(star)}
                              className="p-1 hover:scale-110 active:scale-95 transition-all text-amber-400 hover:text-amber-500 cursor-pointer"
                              title={`Rate ${star} Stars`}
                            >
                              <Star 
                                className={`w-5 h-5 transition-colors ${
                                  star <= ratingInput ? 'fill-amber-400 text-amber-500 text-amber-500' : 'text-stone-300'
                                }`} 
                              />
                            </button>
                          ))}
                        </div>
                        <span className="text-[11px] font-black text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md ml-1 font-mono">
                          {ratingInput} / 5
                        </span>
                      </div>

                      {/* Text Comment message box */}
                      <div className="space-y-1">
                        <textarea
                          required
                          value={commentInput}
                          onChange={(e) => setCommentInput(e.target.value)}
                          placeholder="Write your honest comments about product color, delivery quality, sizing or fabrics..."
                          className="w-full p-3 text-xs bg-white border border-stone-200 rounded-xl h-16 focus:outline-none focus:border-stone-850 resize-none leading-relaxed text-stone-800"
                        />
                      </div>

                      {/* Error & Success indicators */}
                      {reviewError && (
                        <p className="text-red-500 text-[10px] font-bold">⚠️ {reviewError}</p>
                      )}
                      {reviewSuccess && (
                        <p className="text-emerald-600 text-[10px] font-bold">✅ {reviewSuccess}</p>
                      )}

                      {/* Post Review CTA button */}
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={isSubmittingReview}
                          className={`px-4 py-2 text-[10.5px] font-extrabold uppercase rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                            activeTheme.primaryBg
                          }`}
                        >
                          {isSubmittingReview ? "Posting feedback..." : "Submit Review"}
                        </button>
                      </div>

                    </form>
                  ) : (
                    <div className="py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-stone-500 text-[11px]">
                      <div>
                        <p className="font-bold text-stone-800">Only signed in customers can leave star ratings and comments.</p>
                        <p className="text-stone-400 mt-0.5">Your honest checkout experience is highly appreciated under PKR trade rules.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProduct(null); // Close modal
                          if (onShowAuth) onShowAuth();
                        }}
                        className="px-3.5 py-1.5 bg-stone-900 text-white font-extrabold rounded-lg text-[10px] uppercase hover:bg-stone-850 whitespace-nowrap self-start sm:self-auto cursor-pointer"
                      >
                        Sign In Now
                      </button>
                    </div>
                  )}
                </div>

                {/* Reviews entries timeline shelf */}
                <div className="space-y-2.5">
                  <p className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider">Verified Purchase Stories</p>
                  
                  {isLoadingReviews ? (
                    <div className="py-4 text-center text-stone-450 text-[11px] animate-pulse font-bold">
                      Retrieving customer database reviews feed...
                    </div>
                  ) : reviews.length === 0 ? (
                    <div className="text-center py-8 text-stone-400 border border-dashed rounded-2xl bg-stone-50/50">
                      <p className="text-[11px]">No feedback submitted for this item yet.</p>
                      <p className="text-[9.5px] text-stone-400/85 mt-0.5">Be the first to review and tell others about your purchase!</p>
                    </div>
                  ) : (
                    <div className="space-y-3.5 max-h-[40vh] overflow-y-auto pr-1">
                      {reviews.map((rev) => (
                        <div key={rev.id} className="p-3 bg-stone-50 border border-stone-200/80 rounded-2xl space-y-2 font-sans">
                          
                          {/* Review top metarow */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center font-bold text-[10.5px] border border-stone-300">
                                {rev.user_name ? rev.user_name.slice(0, 2).toUpperCase() : "VC"}
                              </div>
                              <div>
                                <p className="text-[11px] font-black text-stone-800">{rev.user_name || "Verified customer"}</p>
                                <p className="text-[8.5px] text-stone-400 leading-none">
                                  {rev.created_at ? new Date(rev.created_at).toLocaleDateString(undefined, {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  }) : "Recently"}
                                </p>
                              </div>
                            </div>

                            {/* Stars badge layout */}
                            <div className="flex items-center text-amber-400 gap-0.5 scale-90">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`w-3.5 h-3.5 ${
                                    i < rev.rating ? 'fill-amber-400 text-amber-500 text-amber-500' : 'text-stone-250'
                                  }`} 
                                />
                              ))}
                            </div>
                          </div>

                          {/* Review Text Body */}
                          <p className="text-[11px] text-stone-600 leading-relaxed pl-1 italic font-light">
                            "{rev.comment}"
                          </p>

                        </div>
                      ))}
                    </div>
                  )}

                </div>

              </div>

            </div>

          </div>
        </div>
      )}

      {/* FINAL ORDER CONFIRMED SUCCESS PANEL */}
      {isOrderCompleted && lastOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs" onClick={() => {
            setIsOrderCompleted(false);
            setPaymentScreenshot(null);
          }} />
          
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl relative w-full max-w-md border border-stone-200 z-10 p-6 flex flex-col items-center justify-center text-center font-sans">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mb-4">
              <ShieldCheck className="w-8 h-8 text-emerald-600" />
            </div>
            
            <h3 className="text-lg font-bold text-stone-900 font-serif leading-tight">Order Payment Completed!</h3>
            <p className="text-[10px] text-emerald-600 font-bold uppercase mt-1 tracking-widest">AuraMart WhatsApp Routing Core Active</p>
            
            <p className="text-[11px] text-stone-500 leading-relaxed mt-3">
              Salam, <strong className="text-stone-800">{lastOrder.buyerName}</strong>! Your order with transaction value <strong>PKR {lastOrder.totalAmount.toLocaleString()}</strong> has been submitted. The shipping parameters apply standard rates to <strong className="text-stone-800">{lastOrder.buyerCity}</strong>.
            </p>

            {paymentScreenshot && (
              <div className="my-3 w-full text-center">
                <p className="text-[9px] font-bold text-stone-400 uppercase mb-1">Uploaded Receipt Proof Screenshot</p>
                <div className="mx-auto inline-block p-1 bg-stone-100 rounded-xl border border-stone-200">
                  <img 
                    src={paymentScreenshot} 
                    alt="Receipt preview" 
                    className="max-h-24 object-contain rounded-lg shadow-sm" 
                  />
                </div>
              </div>
            )}

            <div className="my-3 p-3.5 bg-stone-50 rounded-2xl border border-stone-150 text-[10px] w-full text-left space-y-1">
              <p className="text-stone-400">Order Ref: <strong className="text-stone-800 uppercase font-mono">{lastOrder.id.slice(-8)}</strong></p>
              <p className="text-stone-400">Transferred via: <strong className="text-stone-800">{lastOrder.paymentMethod}</strong></p>
              <p className="text-stone-400">Reference/ID: <strong className="text-stone-800 font-mono">{customerDetails.transactionId || 'N/A'}</strong></p>
              <p className="text-stone-405 mt-1 border-t border-stone-200 pt-1 text-center font-semibold text-emerald-600">
                🛡️ All transaction logs sent directly to our backend & WhatsApp chats.
              </p>
            </div>

            {/* Direct manual WhatsApp trigger button */}
            <div className="w-full space-y-2 mb-2">
              <button
                onClick={() => {
                  const itemsText = lastOrder.items.map(item => `• ${item.productTitle} (Qty: ${item.quantity}, Size: ${item.selectedSize || 'N/A'}, Color: ${item.selectedColor || 'N/A'})`).join("\n");
                  const whatsAppText = `*NEW ORDER SUBMITTED ON AURAMART* 🛍️\n\n` +
                    `*Order ID:* ${lastOrder.id.slice(-8).toUpperCase()}\n` +
                    `*Customer Name:* ${lastOrder.buyerName}\n` +
                    `*Active Phone:* ${lastOrder.buyerPhone}\n` +
                    `*Shipping Destination:* ${lastOrder.buyerCity}\n` +
                    `*Complete Address:* ${lastOrder.buyerAddress}\n\n` +
                    `*Items Ordered:*\n${itemsText}\n\n` +
                    `*Subtotal:* PKR ${lastOrder.subtotal.toLocaleString()}\n` +
                    `*Shipping Fee:* PKR ${lastOrder.shippingCost.toLocaleString()}\n` +
                    `*Grand Total:* *PKR ${lastOrder.totalAmount.toLocaleString()}*\n\n` +
                    `*Payment Method:* ${lastOrder.paymentMethod}\n` +
                    `*Payment Reference/ID:* ${customerDetails.transactionId || 'N/A'}\n\n` +
                    `⚠️ *Please see/verify the uploaded screenshot receipt signature attached.*`;

                  const encodedText = encodeURIComponent(whatsAppText);
                  const targetWhatsAppNumber = settings.adminWhatsApp.replace('+', '').replace(' ', '').trim();
                  const waUrl = `https://wa.me/${targetWhatsAppNumber}?text=${encodedText}`;
                  window.open(waUrl, '_blank');
                }}
                className="w-full py-2.5 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer animate-bounce"
              >
                <span>💬 Open WhatsApp Chat to Finalize</span>
              </button>
            </div>

            <button 
              onClick={() => {
                setIsOrderCompleted(false);
                setPaymentScreenshot(null);
              }}
              className="px-6 py-2 bg-stone-900 hover:bg-stone-800 text-white text-[11px] font-bold rounded-xl w-full"
            >
              Back to Catalog Shopping
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
