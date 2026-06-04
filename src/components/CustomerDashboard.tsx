import { useState, useEffect } from 'react';
import { 
  User, 
  MapPin, 
  Phone, 
  Clock, 
  CheckCircle2, 
  Bell, 
  Activity, 
  Calendar,
  Sparkles,
  AlertCircle,
  Truck,
  Building,
  Check,
  Heart,
  ShoppingBag,
  X
} from 'lucide-react';
import { Order, CustomerProfile, StoreCategory, Product } from '../types';
import { translations, LangType } from '../utils/translations';

interface CustomerDashboardProps {
  orders: Order[];
  currentLang: LangType;
  profile: CustomerProfile;
  onSaveProfile: (p: CustomerProfile) => void;
  categories?: string[];
  wishlist: string[];
  onToggleWishlist: (id: string) => void;
  products: Product[];
  onAddToCart: (p: Product) => void;
}

export default function CustomerDashboard({
  orders,
  currentLang,
  profile,
  onSaveProfile,
  categories,
  wishlist,
  onToggleWishlist,
  products,
  onAddToCart
}: CustomerDashboardProps) {
  const activeCategories = categories || ["Shoes", "Bags", "Watches", "Fancy Tees", "Home Essentials"];
  // Localized string dictionary helper
  const text = translations[currentLang] || translations.en;

  // Filter products to find currently wishlisted selections
  const wishlistProducts = products.filter(p => (wishlist || []).includes(p.id));

  // Profile Form state
  const [name, setName] = useState(profile.name || "");
  const [phone, setPhone] = useState(profile.phone || "");
  const [address, setAddress] = useState(profile.address || "");
  const [city, setCity] = useState(profile.city || "Karachi");

  // Routinepreferences state
  const [notifyOnNewArrivals, setNotifyOnNewArrivals] = useState(profile.routinePreferences.notifyOnNewArrivals);
  const [dailyAlertTime, setDailyAlertTime] = useState(profile.routinePreferences.dailyAlertTime || "09:00");
  const [preferredCategories, setPreferredCategories] = useState<StoreCategory[]>(profile.routinePreferences.preferredCategories || []);
  const [targetGenderInterest, setTargetGenderInterest] = useState<"Boys" | "Girls" | "Unisex" | "All">(profile.routinePreferences.targetGenderInterest || "All");

  const [routineStatusMsg, setRoutineStatusMsg] = useState("");
  const [isSavedSuccessfully, setIsSavedSuccessfully] = useState(false);

  // Search input for order tracking
  const [searchTrackingQuery, setSearchTrackingQuery] = useState("");
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);

  useEffect(() => {
    setName(profile.name);
    setPhone(profile.phone);
    setAddress(profile.address);
    setCity(profile.city);
    setNotifyOnNewArrivals(profile.routinePreferences.notifyOnNewArrivals);
    setDailyAlertTime(profile.routinePreferences.dailyAlertTime);
    setPreferredCategories(profile.routinePreferences.preferredCategories);
    setTargetGenderInterest(profile.routinePreferences.targetGenderInterest);
  }, [profile]);

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedProfile: CustomerProfile = {
      name,
      phone,
      address,
      city,
      routinePreferences: {
        notifyOnNewArrivals,
        dailyAlertTime,
        preferredCategories,
        targetGenderInterest
      }
    };
    onSaveProfile(updatedProfile);
    setIsSavedSuccessfully(true);
    setRoutineStatusMsg(text.activeRoutineStatus);
    
    setTimeout(() => {
      setIsSavedSuccessfully(false);
      setRoutineStatusMsg("");
    }, 4000);
  };

  const toggleCategorySelection = (cat: StoreCategory) => {
    if (preferredCategories.includes(cat)) {
      setPreferredCategories(preferredCategories.filter(c => c !== cat));
    } else {
      setPreferredCategories([...preferredCategories, cat]);
    }
  };

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTrackingQuery.trim()) return;

    // Search case-insensitive name or exact order ID
    const match = orders.find(ord => 
      ord.id.toLowerCase() === searchTrackingQuery.toLowerCase().trim() ||
      ord.buyerName.toLowerCase().includes(searchTrackingQuery.toLowerCase().trim())
    );

    if (match) {
      setTrackedOrder(match);
    } else {
      setTrackedOrder(null);
      // Fallback: search for first approximate order matching custom terms
      const approximate = orders.filter(o => 
        o.buyerName.toLowerCase().includes(searchTrackingQuery.toLowerCase())
      )[0];
      setTrackedOrder(approximate || null);
    }
  };

  return (
    <div id="customer_dashboard_layout" className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
      
      {/* LEFT SECTION: PROFILE & ROUTINE MANAGEMENT */}
      <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs space-y-6">
        <div className="flex items-center gap-3 border-b border-stone-100 pb-3">
          <div className="w-10 h-10 rounded-xl bg-stone-900 flex items-center justify-center text-amber-400">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-stone-900 uppercase tracking-wider">{text.shoppingRoutineTitle}</h4>
            <p className="text-[11px] text-stone-500">{text.shoppingRoutineDesc}</p>
          </div>
        </div>

        {routineStatusMsg && (
          <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center gap-2 font-bold animate-pulse">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{routineStatusMsg}</span>
          </div>
        )}

        <form onSubmit={handleSavePreferences} className="space-y-5">
          {/* PERSONAL INFO FIELDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone-550 uppercase">{text.nameLabel}</label>
              <input 
                type="text"
                placeholder="e.g. Ahnaf Ali"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-stone-850 text-stone-900"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone-550 uppercase">{text.phoneLabel}</label>
              <input 
                type="text"
                placeholder="e.g. 03202838491"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-stone-850 text-stone-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone-550 uppercase">{text.addressLabel}</label>
              <input 
                type="text"
                placeholder="e.g. Tariq Road Storehouse, Karachi"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-stone-850 text-stone-900"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone-550 uppercase">{text.deliveryCity}</label>
              <select 
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-stone-850 text-stone-900"
              >
                <option value="Karachi">Karachi</option>
                <option value="Lahore">Lahore</option>
                <option value="Islamabad">Islamabad</option>
                <option value="Rawalpindi">Rawalpindi</option>
                <option value="Faisalabad">Faisalabad</option>
                <option value="Peshawar">Peshawar</option>
                <option value="Quetta">Quetta</option>
                <option value="Hyderabad">Hyderabad</option>
              </select>
            </div>
          </div>

          {/* CREATIVE ROUTINE PREFERENCES */}
          <div className="border-t border-stone-100 pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="text-xs font-bold text-stone-900 uppercase tracking-wide flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-amber-500 animate-swing" />
                  <span>Routine Notification Trigger</span>
                </h5>
                <p className="text-[10px] text-stone-450 mt-0.5">Automate customized system style messages according to selected alert hours.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={notifyOnNewArrivals} 
                  onChange={(e) => setNotifyOnNewArrivals(e.target.checked)}
                  className="sr-only peer" 
                />
                <div className="w-9 h-5 bg-stone-250 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-stone-900"></div>
              </label>
            </div>

            {notifyOnNewArrivals && (
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-150 space-y-4 animate-in fade-in duration-200">
                
                {/* Time picker */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-stone-600 block uppercase">{text.routineDailyAlertTime}:</span>
                  <input 
                    type="time"
                    value={dailyAlertTime}
                    onChange={(e) => setDailyAlertTime(e.target.value)}
                    className="p-1.5 bg-white border rounded-lg text-xs font-bold text-stone-900"
                  />
                </div>

                {/* Preferred categories multi-select */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-extrabold text-stone-400 block uppercase tracking-wider">{text.routineCategories}:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeCategories.map(cat => {
                      const isSelected = preferredCategories.includes(cat);
                      return (
                        <button
                          type="button"
                          key={cat}
                          onClick={() => toggleCategorySelection(cat)}
                          className={`px-3 py-1 text-[10.5px] font-bold rounded-lg border transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-stone-900 text-white border-stone-900 shadow-xs' 
                              : 'bg-white hover:bg-stone-100 text-stone-600 border-stone-200'
                          }`}
                        >
                          {isSelected && <span className="inline-block mr-1 text-amber-400">✓</span>}
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Target Gender Preferences */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-1">
                  <span className="text-[11px] font-bold text-stone-650 uppercase">{text.routineGender}:</span>
                  <div className="flex gap-1">
                    {(["All", "Boys", "Girls", "Unisex"] as const).map(g => (
                      <button
                        type="button"
                        key={g}
                        onClick={() => setTargetGenderInterest(g)}
                        className={`px-2 py-1 text-[10px] font-bold rounded-md uppercase transition-all ${
                          targetGenderInterest === g 
                            ? 'bg-amber-100 text-amber-900 border border-amber-250 font-extrabold' 
                            : 'bg-white hover:bg-stone-100 text-stone-500 border border-stone-200'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </div>

          <button 
            type="submit"
            className="w-full py-2.5 bg-stone-900 hover:bg-stone-850 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-md cursor-pointer transition-transform active:scale-98"
          >
            {text.savePreferences}
          </button>
        </form>
      </div>

      {/* RIGHT SECTION: INTERACTIVE ORDER TRACKER TIMELINE */}
      <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs space-y-6">
        
        <div className="flex items-center gap-3 border-b border-stone-100 pb-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center text-stone-900">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-stone-900 uppercase tracking-wider">{text.trackOrderTitle}</h4>
            <p className="text-[11px] text-stone-500">{text.trackOrderDesc}</p>
          </div>
        </div>

        <form onSubmit={handleTrackSubmit} className="flex gap-2">
          <input 
            type="text" 
            placeholder="Type Name or Order # eg: ord-123" 
            value={searchTrackingQuery}
            onChange={(e) => setSearchTrackingQuery(e.target.value)}
            className="flex-grow text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-stone-850 text-stone-900"
          />
          <button 
            type="submit"
            className="px-4 py-2.5 bg-stone-900 hover:bg-stone-850 text-white text-xs font-bold rounded-xl whitespace-nowrap cursor-pointer transition-colors"
          >
            Track Order
          </button>
        </form>

        {trackedOrder ? (
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-150 space-y-4 animate-in fade-in duration-250">
            
            {/* Header info */}
            <div className="flex justify-between items-start border-b border-stone-200 pb-2">
              <div>
                <span className="text-[8px] font-extrabold uppercase font-mono bg-stone-800 text-amber-400 px-1.5 py-0.5 rounded">
                  {trackedOrder.id}
                </span>
                <p className="font-bold text-stone-900 text-xs mt-1">Recipient: {trackedOrder.buyerName}</p>
                <p className="text-[10px] text-stone-550 truncate max-w-[200px]">{trackedOrder.buyerAddress}, {trackedOrder.buyerCity}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-stone-500 block">Total Secure Cost</span>
                <span className="font-extrabold text-xs text-stone-900">PKR {trackedOrder.totalAmount.toLocaleString()}</span>
              </div>
            </div>

            {/* Premium Vertical Timeline status */}
            <div className="space-y-4 pt-1.5">
              
              {/* Step 1: Placed */}
              <div className="relative pl-6">
                <div className="absolute left-1.5 top-0.5 w-3 h-3 rounded-full bg-emerald-500 shadow-sm z-10 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                </div>
                <div className="absolute left-2.5 top-3.5 w-0.5 h-6 bg-emerald-400" />
                
                <div>
                  <h6 className="text-[11px] font-black uppercase text-stone-900">1. Order Placed via AuraMart</h6>
                  <p className="text-[10px] text-stone-500">Logistics queued securely. Recorded on {new Date(trackedOrder.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Step 2: Payment Gateway Authenticated */}
              <div className="relative pl-6">
                <div className={`absolute left-1.5 top-0.5 w-3 h-3 rounded-full shadow-sm z-10 flex items-center justify-center ${
                  trackedOrder.paymentConfirmed || trackedOrder.status === 'completed' || trackedOrder.status === 'paid'
                    ? 'bg-emerald-500' 
                    : 'bg-amber-400 animate-pulse'
                }`}>
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                </div>
                <div className="absolute left-2.5 top-3.5 w-0.5 h-6 bg-stone-300" />
                
                <div>
                  <h6 className="text-[11px] font-black uppercase text-stone-900">
                    2. Payment Authenticated & Verified
                  </h6>
                  <p className="text-[10px] text-stone-500">
                    {trackedOrder.paymentConfirmed || trackedOrder.status === 'completed' || trackedOrder.status === 'paid'
                      ? 'PKR Ledger confirmed securely on local server routing.' 
                      : 'Pending manual WhatsApp ledger review.'}
                  </p>
                </div>
              </div>

              {/* Step 3: Courier Handover */}
              <div className="relative pl-6">
                <div className={`absolute left-1.5 top-0.5 w-3 h-3 rounded-full shadow-sm z-10 flex items-center justify-center ${
                  trackedOrder.status === 'completed'
                    ? 'bg-emerald-500' 
                    : 'bg-stone-300'
                }`}>
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                </div>
                <div className="absolute left-2.5 top-3.5 w-0.5 h-6 bg-stone-200" />
                
                <div>
                  <h6 className="text-[11px] font-black uppercase text-stone-900">3. Karachi Courier Handover (Rapid Transport)</h6>
                  <p className="text-[10px] text-stone-450 border-none">
                    {trackedOrder.buyerCity === 'Karachi' 
                      ? 'Karachi 24-48hr courier delivery activated.'
                      : 'Leopard / TCS Domestic parcel routing applied.'
                    }
                  </p>
                </div>
              </div>

              {/* Step 4: Arrived */}
              <div className="relative pl-6">
                <div className={`absolute left-1.5 top-0.5 w-3 h-3 rounded-full shadow-sm z-10 flex items-center justify-center ${
                  trackedOrder.status === 'completed' 
                    ? 'bg-emerald-500' 
                    : 'bg-stone-100 border'
                }`}>
                  {trackedOrder.status === 'completed' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                </div>
                
                <div>
                  <h6 className="text-[11px] font-black uppercase text-stone-900">4. Delivered & Handed off</h6>
                  <p className="text-[10px] text-stone-450">
                    {trackedOrder.status === 'completed' 
                      ? 'Courier transaction closed successfully.' 
                      : 'Awaiting shipping milestone handoff.'}
                  </p>
                </div>
              </div>

            </div>

          </div>
        ) : (
          <div className="bg-stone-50 border border-stone-200/60 rounded-2xl p-8 text-center text-stone-450 text-xs">
            <Building className="w-8 h-8 text-stone-300 mx-auto mb-2" />
            <p className="font-semibold text-[11px]">No active dispatch order search matched.</p>
            <p className="text-[9.5px] text-stone-400 mt-1">Check credentials or submit a mock purchase inside the Curated Selection catalog.</p>
          </div>
        )}

      </div>

      {/* LOWER FULL-WIDTH ROW: SAVED WISHLIST SHELF */}
      <div className="lg:col-span-12 bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 border border-rose-100 shadow-xs">
              <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-stone-900 uppercase tracking-wider">Your Curated Wishlist</h4>
              <p className="text-[11px] text-stone-500">Quick-view, purchase, or manage your saved items instantly sync-secured with your local browser cache.</p>
            </div>
          </div>
          <span className="text-xs font-black text-stone-700 bg-stone-50 border border-stone-200 px-3 py-1 rounded-xl shadow-xs">
            {wishlistProducts.length} Items Saved
          </span>
        </div>

        {wishlistProducts.length === 0 ? (
          <div className="py-12 text-center text-stone-450 border border-dashed border-stone-200 rounded-2xl bg-stone-50/50">
            <p className="font-bold text-xs text-stone-700">Your wishlist is currently peaceful</p>
            <p className="text-[10px] text-stone-400 mt-1">Navigate to the main Catalog page and tap the ❤️ heart icon on any product to save it here!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {wishlistProducts.map(p => (
              <div key={p.id} className="border border-stone-150 rounded-2xl overflow-hidden p-3 bg-stone-50/30 hover:bg-white hover:border-stone-300 hover:shadow-xs transition-all flex flex-col justify-between gap-3 group">
                <div className="relative aspect-video rounded-xl overflow-hidden bg-stone-100 shrink-0">
                  <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300" referrerPolicy="no-referrer" />
                  <span className="absolute top-2 left-2 text-[8px] font-black uppercase tracking-wider bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded-md border text-stone-700 border-stone-250">
                    {p.category}
                  </span>
                </div>

                <div className="space-y-1">
                  <h5 className="font-extrabold text-stone-900 text-xs line-clamp-1">{p.title}</h5>
                  <p className="text-[10px] text-stone-500 line-clamp-1 leading-normal">{p.description}</p>
                  <p className="text-xs font-black text-stone-900 mt-1 font-mono">PKR {p.price.toLocaleString()}</p>
                </div>

                <div className="flex gap-1.5 pt-1">
                  <button
                    onClick={() => onAddToCart(p)}
                    className="flex-grow py-2 bg-stone-900 hover:bg-stone-850 text-white rounded-xl text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-97"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                    <span>Quick Buy</span>
                  </button>
                  <button
                    onClick={() => onToggleWishlist(p.id)}
                    className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-[10px] font-bold transition-all border border-rose-200 cursor-pointer flex items-center justify-center active:scale-97"
                    title="Remove item"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
