import { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  Sparkles, 
  ShoppingBag, 
  Copy, 
  Link2,
  Bell, 
  AlertCircle, 
  ShieldAlert,
  Send,
  MessageSquare,
  DollarSign
} from 'lucide-react';
import { Product, SellerProfile, Order, GlobalSettings, ChatMessage, StoreCategory } from '../types';

interface SellerDashboardProps {
  currentProfile: SellerProfile | null;
  onUpgradeToPremium: () => void;
  products: Product[];
  setProducts: (p: Product[]) => void;
  orders: Order[];
  setOrders: (o: Order[]) => void;
  settings: GlobalSettings;
  onClose: () => void;
  categories?: string[];
}

export default function SellerDashboard({
  currentProfile,
  onUpgradeToPremium,
  products,
  setProducts,
  orders,
  setOrders,
  settings,
  onClose,
  categories
}: SellerDashboardProps) {
  const sellerId = currentProfile?.uid || "mock-seller-id";
  
  // Filter products/orders belonging to this seller
  const sellerProducts = products.filter(p => p.sellerId === sellerId);
  const sellerOrders = orders.filter(o => o.sellerId === sellerId);

  // States
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Product Form State
  const [formData, setFormData] = useState<Partial<Product>>({
    title: "",
    description: "",
    price: 0,
    wholesalePrice: 0,
    category: "Shoes",
    imageUrl: "",
    forGender: "Unisex",
    colors: ["Alabaster White", "Shadow Black"],
    sizes: ["40", "41", "42", "43"],
    stockCount: 15
  });

  const [formError, setFormError] = useState("");

  // Simulated Chat Notification center
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "ch-1",
      sender: "assistant",
      content: "Assalam-o-Alaikum! Welcome to your AuraMart Vendor Console. Here you can configure prices in PKR, fetch direct shopper checkout links, and view immediate payment reports. Standard delivery config applies (Karachi: 300 PKR, National: 350 PKR). Let me know if you need to upgrade to Premium for unlimited listings! ✅",
      timestamp: new Date().toISOString()
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    // Free tier checks
    if (!currentProfile?.isPremium && sellerProducts.length >= settings.maxFreeListings) {
      setFormError(`⚠️ You've reached the free account limit of ${settings.maxFreeListings} listings! Upgrade to AuraMart Premium for unlimited listings and direct cart connections.`);
      return;
    }

    if (!formData.title || !formData.imageUrl || Number(formData.price) <= 0) {
      setFormError("Please fill out Name, pricing and exact photo URLs.");
      return;
    }

    const newProd: Product = {
      ...(formData as Product),
      id: `prod-${Date.now()}`,
      sellerId: sellerId,
      price: Number(formData.price),
      wholesalePrice: Number(formData.wholesalePrice || Math.round(Number(formData.price) * 0.8)),
      stockCount: Number(formData.stockCount || 10),
      createdAt: new Date().toISOString()
    };

    setProducts([newProd, ...products]);
    setIsAddingProduct(false);
    
    // Clear Form
    setFormData({
      title: "",
      description: "",
      price: 0,
      wholesalePrice: 0,
      category: "Shoes",
      imageUrl: "",
      forGender: "Unisex",
      colors: ["Alabaster White", "Shadow Black"],
      sizes: ["40", "41", "42", "43"],
      stockCount: 15
    });

    // Add chatbot verification
    setChatMessages(prev => [...prev, {
      id: `ch-add-${Date.now()}`,
      sender: "assistant",
      content: `🎉 Product listed successfully: "${newProd.title}" is now active in PKR catalog. Shoppers can now buy this directly!`,
      timestamp: new Date().toISOString()
    }]);
  };

  const deleteProduct = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to remove this product listing?")) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  // Helper copy cart direct shopper link
  const copyDirectBuyerLink = (prodId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const currentOrigin = window.location.origin;
    const directLink = `${currentOrigin}?buyer=true&directAddToCart=${prodId}`;
    
    // Fallback normal alerts or clipboard
    navigator.clipboard.writeText(directLink).then(() => {
      setCopiedId(prodId);
      setTimeout(() => setCopiedId(null), 3000);
    }).catch(() => {
      alert(`Direct Checkout Link generated: ${directLink}`);
    });
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const userText = chatInput.trim();
    setChatInput("");

    setChatMessages(prev => [...prev, {
      id: `chat-user-${Date.now()}`,
      sender: "user",
      content: userText,
      timestamp: new Date().toISOString()
    }]);

    // Simulated quick helpdesk assistant replies
    setTimeout(() => {
      let replyContent = "Hum aapka message confirm kar chuke hain. AuraMart help desks are processing request structures. Let us know if you need automated fast delivery validations!";
      
      const query = userText.toLowerCase();
      if (query.includes("premium") || query.includes("upgrade")) {
        replyContent = "AuraMart Premium package lets you list unlimited luxury sneakers, bags, or chronographs! It also enables styled color settings. Tap 'Upgrade to Premium' at the top of the dashboard to enable full catalog functionality!";
      } else if (query.includes("delivery") || query.includes("ship") || query.includes("karachi")) {
        replyContent = `Our baseline logistics structures are verified across Pakistan: Deliveries in All of Karachi count at ${settings.karachiShippingCost} PKR. Deliveries outside Karachi are computed at ${settings.otherCitiesShippingCost} PKR. All values can be overridden by system administrators.`;
      } else if (query.includes("pkr") || query.includes("price")) {
        replyContent = "Yes! All pricing calculations in AuraMart are natively transacted in Pakistani Rupees (PKR). Buyers directly transmit verification screenshots. We receive direct notification inside your dashboard chat logs instantly upon order submit!";
      }

      setChatMessages(prev => [...prev, {
        id: `chat-reply-${Date.now()}`,
        sender: "assistant",
        content: replyContent,
        timestamp: new Date().toISOString()
      }]);
    }, 1000);
  };

  // Compute calculated balance PKR
  const totalSellerRevenue = sellerOrders
    .filter(o => o.status === "completed" || o.status === "paid")
    .reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 font-sans">
      <div className="fixed inset-0 bg-stone-900/65 backdrop-blur-sm" onClick={onClose} />
      
      <div className="bg-white rounded-3xl overflow-hidden shadow-2xl relative w-full max-w-4xl border border-stone-200 z-10 max-h-[90vh] flex flex-col">
        
        {/* Top Header Row of dashboard */}
        <div className="bg-stone-900 text-stone-100 p-6 flex flex-wrap justify-between items-center border-b border-stone-850 gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-full ${currentProfile?.isPremium ? 'bg-amber-500' : 'bg-stone-750'}`}>
              <Sparkles className="w-5 h-5 text-stone-950" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-serif leading-tight">
                {currentProfile?.storeName || "My Boutique Dashboard"}
              </h3>
              <p className="text-[10px] text-stone-400">
                Partner Store: {currentProfile?.displayName} | 🏷️ Selling in PKR
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Subscription toggle banner */}
            {!currentProfile?.isPremium ? (
              <button 
                onClick={onUpgradeToPremium}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 text-xs font-bold rounded-2xl shadow-md hover:brightness-105 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 fill-stone-950 text-stone-950" />
                <span>Upgrade to Premium</span>
              </button>
            ) : (
              <span className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/40 text-[10px] font-bold uppercase tracking-wider">
                👑 Premium Account Enabled
              </span>
            )}

            <button 
              onClick={onClose} 
              className="p-1.5 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-all border border-stone-750"
              aria-label="Close dashboard"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dynamic metrics grids */}
        <div className="grid grid-cols-3 gap-3 p-4 bg-stone-50 border-b border-stone-200">
          <div className="p-3 bg-white border border-stone-200 rounded-xl">
            <p className="text-[9px] text-stone-450 font-medium">TOTAL PKR SALES</p>
            <p className="text-sm font-bold text-stone-900">PKR {totalSellerRevenue.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-white border border-stone-200 rounded-xl">
            <p className="text-[9px] text-stone-450 font-medium">ACTIVE LISTINGS</p>
            <p className="text-sm font-bold text-stone-900">
              {sellerProducts.length} 
              <span className="text-[10px] text-stone-400 font-normal"> / {currentProfile?.isPremium ? "Unltd" : settings.maxFreeListings}</span>
            </p>
          </div>
          <div className="p-3 bg-white border border-stone-200 rounded-xl">
            <p className="text-[9px] text-stone-450 font-medium">TOTAL RECEIVED ORDERS</p>
            <p className="text-sm font-bold text-stone-900">{sellerOrders.length} Booked</p>
          </div>
        </div>

        {/* Master Workspace Splits: Listings vs Notification Chat */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-grow overflow-hidden h-[50vh]">
          
          {/* LEFT: Listings Manager */}
          <div className="md:col-span-7 p-5 overflow-y-auto border-r border-stone-200 flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
              <div>
                <h4 className="font-bold text-sm text-stone-850">Manage Product Listings</h4>
                <p className="text-[11px] text-stone-500">Add options, specify prices (PKR), and copy secure buyer checkout links.</p>
              </div>

              {!isAddingProduct && (
                <button 
                  onClick={() => setIsAddingProduct(true)}
                  className="px-3.5 py-1.5 bg-stone-900 text-white rounded-xl text-xs font-bold hover:bg-stone-800 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-500" />
                  <span>New Listing</span>
                </button>
              )}
            </div>

            {formError && (
              <div className="p-3 bg-amber-50 text-amber-850 border border-amber-200 rounded-xl text-[11px] leading-relaxed flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {/* inline Form layout */}
            {isAddingProduct && (
              <form onSubmit={handleCreateProduct} className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-3 font-sans">
                <div className="flex items-center justify-between border-b border-stone-200 pb-1.5">
                  <span className="text-xs font-bold text-stone-805">Listing Specifications</span>
                  <button type="button" onClick={() => { setIsAddingProduct(false); setFormError(""); }} className="text-stone-400 hover:text-stone-700">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="col-span-2 space-y-0.5">
                    <label className="text-[9px] font-bold text-stone-605">Product Title</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Minimalist Retro Clock"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full p-2 bg-white border border-stone-250 rounded-xl text-xs"
                    />
                  </div>

                  <div className="space-y-0.5">
                    <label className="text-[9px] font-bold text-stone-605">Selling Price (PKR)</label>
                    <input 
                      type="number" 
                      required
                      placeholder="e.g. 3500"
                      value={formData.price || ""}
                      onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                      className="w-full p-2 bg-white border border-stone-250 rounded-xl text-xs"
                    />
                  </div>

                  <div className="space-y-0.5">
                    <label className="text-[9px] font-bold text-stone-605">Category</label>
                    <select 
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value as StoreCategory})}
                      className="w-full p-2 bg-white border border-stone-250 rounded-xl text-xs"
                    >
                      {(categories || ["Shoes", "Bags", "Watches", "Fancy Tees", "Home Essentials"]).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2 space-y-0.5">
                    <label className="text-[9px] font-bold text-stone-600">Product Image URL</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. https://images.unsplash.com/photo-..."
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                      className="w-full p-2 bg-white border border-stone-200 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button type="button" onClick={() => { setIsAddingProduct(false); setFormError(""); }} className="px-3.5 py-1.5 border border-stone-250 text-stone-605 rounded-xl text-xs">
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-1.5 bg-stone-900 text-white font-bold rounded-xl text-xs hover:bg-stone-805">
                    Publish List
                  </button>
                </div>
              </form>
            )}

            {/* List Showcase */}
            <div className="space-y-2">
              {sellerProducts.length === 0 ? (
                <div className="text-center py-10 bg-stone-50 border border-dashed border-stone-200 rounded-2xl text-xs text-stone-500">
                  You have not published any custom designs yet. Create one above in PKR!
                </div>
              ) : (
                sellerProducts.map((p) => {
                  return (
                    <div key={p.id} className="p-3.5 rounded-2xl border border-stone-200/80 bg-white hover:border-amber-400 transition-colors flex flex-col gap-2.5 relative group">
                      
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img 
                            src={p.imageUrl} 
                            alt={p.title} 
                            className="w-10 h-10 rounded-xl object-cover object-center border border-stone-200"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <p className="text-xs font-bold text-stone-900">{p.title}</p>
                            <p className="text-[9px] text-stone-450 uppercase font-bold tracking-wide">{p.category} | PKR {p.price.toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button 
                            onClick={(e) => copyDirectBuyerLink(p.id, e)}
                            className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all border ${
                              copiedId === p.id 
                                ? 'bg-teal-50 text-teal-700 border-teal-200' 
                                : 'bg-stone-150 hover:bg-stone-200 text-stone-700 border-stone-250'
                            } flex items-center gap-1`}
                          >
                            <Link2 className="w-3 h-3" />
                            <span>{copiedId === p.id ? "Link Copied!" : "Copy Buyer Cart Link"}</span>
                          </button>
                          
                          <button 
                            onClick={(e) => deleteProduct(p.id, e)}
                            className="p-2 rounded-xl bg-stone-50 hover:bg-red-50 text-stone-500 hover:text-red-700 border border-stone-200 transition-colors"
                            aria-label="Delete item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })
              )}
            </div>

          </div>

          {/* RIGHT: Notifications & Chat logs */}
          <div className="md:col-span-5 p-5 bg-stone-50 overflow-hidden flex flex-col h-full">
            <div className="flex items-center gap-2 border-b border-stone-200 pb-3 mb-3">
              <MessageSquare className="w-4.5 h-4.5 text-stone-700" />
              <div>
                <h4 className="font-bold text-xs text-stone-850">Direct Payment Alerts & Chat</h4>
                <p className="text-[9px] font-medium text-stone-450 uppercase">Order reports verified here</p>
              </div>
            </div>

            {/* Chat message streams */}
            <div className="flex-grow overflow-y-auto space-y-2.5 pr-1 py-1 no-scrollbar text-xs">
              {chatMessages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`p-3 rounded-2xl max-w-[85%] ${
                    msg.sender === 'assistant' 
                      ? 'bg-amber-100/50 text-stone-900 mr-auto border border-amber-200/50' 
                      : 'bg-stone-900 text-stone-100 ml-auto'
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-line">{msg.content}</p>
                </div>
              ))}
              
              {/* Special notification highlight for pending orders */}
              {sellerOrders.some(o => !o.paymentConfirmed && o.status === "paid") && (
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-850 flex items-start gap-2.5">
                  <Bell className="w-4.5 h-4.5 text-teal-600 shrink-0 mt-0.5 animate-bounce" />
                  <div>
                    <p className="font-extrabold text-[10px] uppercase">New Order Confirmation</p>
                    <p className="text-[10.5px]">A customer has clicked Checkout Payment! The billing details show "Direct Transfer" order values. Click received in Admin Panel to verify.</p>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Chat Input row */}
            <div className="flex gap-2 pt-3 border-t border-stone-200 mt-2">
              <input 
                type="text" 
                placeholder="Ask helper about PKR sales, logistics, etc." 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                className="flex-grow p-2.5 bg-white border border-stone-200 rounded-xl text-xs focus:outline-none focus:border-stone-800"
              />
              <button 
                onClick={handleSendChat}
                className="p-2.5 rounded-xl bg-stone-900 hover:bg-stone-850 text-white"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
