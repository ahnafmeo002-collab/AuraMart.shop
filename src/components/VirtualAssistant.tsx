import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, ShoppingBag, ArrowRight } from 'lucide-react';
import { Product, CartItem } from '../types';
import { translations, LangType } from '../utils/translations';
import { api } from '../services/api';

interface VirtualAssistantProps {
  products: Product[];
  currentLang: LangType;
  onAddProductToCart: (product: Product) => void;
  shippingCostKarachi: number;
  shippingCostOther: number;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  recommendedProducts?: Product[];
}

export default function VirtualAssistant({
  products,
  currentLang,
  onAddProductToCart,
  shippingCostKarachi,
  shippingCostOther
}: VirtualAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const text = translations[currentLang] || translations.en;

  // Initialize with greeting
  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        sender: 'assistant',
        text: text.assistantGreeting
      }
    ]);
  }, [currentLang]);

  // Scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isTyping) return;

    const userQuery = inputValue;
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userQuery
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    try {
      // Gather active chat history for Gemini context alignment
      const historyToSend = messages.concat(userMsg).map(m => ({
        sender: m.sender,
        text: m.text
      }));

      const response = await api.callAssistant(historyToSend, products);
      
      // Map suggested product ids to actual Product instances
      const recommendedItems = (response.recommendedProductIds || [])
        .map((id: string) => products.find(p => p.id === id))
        .filter(Boolean) as Product[];

      setMessages(prev => [...prev, {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: response.reply,
        recommendedProducts: recommendedItems
      }]);
    } catch (err) {
      console.warn("Server AI offline, triggers high-fidelity fallback match:", err);
      // Perfect South Asian multilingual safe fallback
      const response = generateAIResponse(userQuery);
      setMessages(prev => [...prev, {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: response.replyText,
        recommendedProducts: response.recommendedItems
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const selectSuggestion = (query: string) => {
    setInputValue(query);
  };

  // Rule-based localized AI match for high safety and zero API key dependency
  const generateAIResponse = (query: string): { replyText: string; recommendedItems?: Product[] } => {
    const q = query.toLowerCase().trim();
    
    // Help categories
    const isUrdu = currentLang === 'ur';
    const isHindi = currentLang === 'hi';

    // 1. Shoes match
    if (q.includes('shoe') || q.includes('sneaker') || q.includes('jogger') || q.includes('جوتے') || q.includes('بوٹ') || q.includes('जूता') || q.includes('जूते')) {
      const shoes = products.filter(p => p.category === 'Shoes');
      if (isUrdu) {
        return {
          replyText: "مجھے خوشی ہے کہ آپ ہمارے جوتے دیکھنا چاہتے ہیں! ہمارے پاس اعلیٰ معیار کے 'Aura Luxe' اسنیکرز اور ایتھلیٹک رننگ جوتے دستیاب ہیں۔ ذیل میں چیک کریں:",
          recommendedItems: shoes
        };
      } else if (isHindi) {
        return {
          replyText: "मुझे अत्यंत खुशी है कि आप जूते देखना चाहते हैं! हमारे पास उच्चतम प्रीमियम क्वालिटी के 'Aura Luxe' स्नीकर्स और रनिंग जूते उपलब्ध हैं:",
          recommendedItems: shoes
        };
      } else {
        return {
          replyText: "Excellent choice! We have premium footwear choices like our signature 'Aura Luxe Chunky Sneakers' and performance runners. Take a look below:",
          recommendedItems: shoes
        };
      }
    }

    // 2. Bags match
    if (q.includes('bag') || q.includes('tote') || q.includes('handbag') || q.includes('تھیلا') || q.includes('پرس') || q.includes('बैग') || q.includes('थैला')) {
      const bags = products.filter(p => p.category === 'Bags');
      if (isUrdu) {
        return {
          replyText: "ہمارے ہاتھ سے بنے خالص چمڑے کے ریٹرو بیگز کراچی اور پاکستان بھر میں مشہور ہیں۔ یہاں دیکھیں:",
          recommendedItems: bags
        };
      } else if (isHindi) {
        return {
          replyText: "हमारे हाथ से बने हुए लेदर बैग्स को लोगों द्वारा बहुत पसंद किया जाता है। यहाँ प्रस्तुत हैं हमारे चुनिंदा प्रीमियम बैग्स:",
          recommendedItems: bags
        };
      } else {
        return {
          replyText: "Our fine collection of handcrafted luxury bags features premium leather textures and comfort straps. Here are our top options:",
          recommendedItems: bags
        };
      }
    }

    // 3. Watches match
    if (q.includes('watch') || q.includes('gold') || q.includes('clock') || q.includes('گھڑی') || q.includes('گھڑیاں') || q.includes('घड़ी') || q.includes('घड़ियाँ')) {
      const watches = products.filter(p => p.category === 'Watches');
      if (isUrdu) {
        return {
          replyText: "ہمارے پاس عیش و عشرت کا شاہکار 'Royal Sovereign Gold Watch' موجود ہے، جو کوارٹز ڈیلی موومنٹ فراہم کرتی ہے۔ نیچے دیکھیں:",
          recommendedItems: watches
        };
      } else if (isHindi) {
        return {
          replyText: "हमारे प्रीमियम घड़ियों के शानदार संग्रह में आपका स्वागत है। पेश है हमारे सबसे बेहतरीन मॉडल्स:",
          recommendedItems: watches
        };
      } else {
        return {
          replyText: "We offer masterclass premium wristwatches like our Royal Sovereign Oyster watch. Perfect formal elegance in PKR. See below:",
          recommendedItems: watches
        };
      }
    }

    // 4. Delivery & Price Query
    if (q.includes('delivery') || q.includes('cod') || q.includes('shipping') || q.includes('time') || q.includes('کراچی') || q.includes('خرچہ') || q.includes('شہر') || q.includes('डिलीवरी') || q.includes('शिपिंग')) {
      if (isUrdu) {
        return {
          replyText: `کراچی کے لیے ڈیلیوری چارجز PKR ${shippingCostKarachi} ہیں، جہاں آپکو 24-48 گھنٹوں میں پارسل مل جاتا ہے۔ دیگر شہروں کے لیے فیس PKR ${shippingCostOther} ہے اور ڈیلیوری کا دورانیہ 3 سے 5 دن ہے۔`
        };
      } else if (isHindi) {
        return {
          replyText: `कराची के लिए वितरण शुल्क PKR ${shippingCostKarachi} है, जहाँ पार्सल 24-48 घंटे में पहुँच जाता है। अन्य पाकिस्तानी शहरों के लिए डिलीवरी प्रभार PKR ${shippingCostOther} है।`
        };
      } else {
        return {
          replyText: `Logistics Policy: Karachi delivery is standard PKR ${shippingCostKarachi} (24-48 hours rapid shift). Other locations across Pakistan cost PKR ${shippingCostOther} (approx 3-5 days delivery with tracking).`
        };
      }
    }

    // 5. Secure Payment & Pricing Currency
    if (q.includes('pay') || q.includes('secure') || q.includes('price') || q.includes('pkr') || q.includes('پیسے') || q.includes('پیمنٹ') || q.includes('भुगतान') || q.includes('पैसे')) {
      if (isUrdu) {
        return {
          replyText: "ہمارا پلیٹ فارم پاکستان بھر میں 100٪ محفوظ کیش آن ڈیلیوری (COD) اور بینک ٹرانسفر / ایزی پیسہ کے ذریعے کام کرتا ہے۔ تمام قیمتیں PKR میں وصول کی جاتی ہیں۔"
        };
      } else if (isHindi) {
        return {
          replyText: "हमारा पूरा ई-कॉमर्स प्लेटफ़ॉर्म अत्यंत सुरक्षित कूरियर कैश ऑन डिलीवरी (COD) तथा बैंक ट्रांसफर/ईजीपैसा के जरिए काम करता है। सभी मूल्य PKR में हैं।"
        };
      } else {
        return {
          replyText: "Security & Currency checkout: All prices are strictly stated in Pakistani Rupees (PKR). We ensure encrypted dispatch processing. Choose COD or secure bank / EasyPaisa checkout."
        };
      }
    }

    // Generic response with best-popular products
    const populars = products.slice(0, 2);
    if (isUrdu) {
      return {
        replyText: "شکریہ! مجھے آپکا پیغام موصول ہوا۔ میں اورا مارٹ کسٹمر ہیلپ ڈیپوٹ پر ہوں۔ اپنی پسند کے ملبوسات یا سائز کی تفصیلات لکھنے کے لیے بلا جھجھک آزادانہ پوچھیں، یا یہ شاندار پروڈکٹ نمونے دیکھیں:",
        recommendedItems: populars
      };
    } else if (isHindi) {
      return {
        replyText: "धन्यवाद! मुझे आपका संदेश मिल गया है। आप हमसे हमारे जूतों, बैग, घडियों के साइज या मूल्यों के बारे में और जान सकते हैं। ये हमारे सबसे लोकप्रिय उत्पाद हैं:",
        recommendedItems: populars
      };
    } else {
      return {
        replyText: "Thank you! I've logged your request. I am here to facilitate sizing metrics, orders, styling rules or address dispatch questions. Take a look at these luxury bestsellers:",
        recommendedItems: populars
      };
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        id="chatbot_floating_btn"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-45 w-14 h-14 bg-stone-900 text-amber-400 hover:bg-stone-850 rounded-2xl flex items-center justify-center shadow-2xl transition-all hover:scale-105 active:scale-95 cursor-pointer border-2 border-amber-400/20"
        title="Live Support Chat"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-amber-400" />
        ) : (
          <div className="relative">
            <MessageSquare className="w-6 h-6 text-amber-400" />
            <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-red-500 rounded-full animate-ping" />
            <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-red-500 rounded-full" />
          </div>
        )}
      </button>

      {/* Expanded Chat UI */}
      {isOpen && (
        <div 
          id="assistant_chat_drawer" 
          className="fixed bottom-24 right-4 sm:right-6 z-45 w-92 max-w-[calc(100vw-2rem)] h-[510px] bg-white rounded-3xl border border-stone-200 shadow-2xl flex flex-col justify-between overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200"
        >
          {/* Header */}
          <div className="p-4 bg-stone-900 border-b border-stone-800 flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-400 flex items-center justify-center text-stone-900">
                <Sparkles className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h5 className="text-xs font-black uppercase tracking-wider text-amber-400">{text.assistantTitle}</h5>
                <p className="text-[9px] text-stone-400 font-mono">⚡ PKR Multilingual Live Help</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              className="p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-400 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Suggestions Shelf */}
          <div className="bg-stone-100 border-b p-2 flex gap-1 overflow-x-auto scrollbar-none text-[9.5px] font-bold">
            <button 
              onClick={() => selectSuggestion(currentLang === 'ur' ? 'جوتے دکھائیں' : currentLang === 'hi' ? 'जूते दिखाओ' : 'Show luxury shoes')}
              className="px-2.5 py-1 bg-white hover:bg-stone-50 border rounded-lg whitespace-nowrap cursor-pointer hover:text-amber-650"
            >
              👟 {currentLang === 'ur' ? 'جوتے' : currentLang === 'hi' ? 'जूते' : 'Shoes'}
            </button>
            <button 
              onClick={() => selectSuggestion(currentLang === 'ur' ? 'بیگ کولیکشن' : currentLang === 'hi' ? 'बैग कलेक्शन' : 'Elegant leather bags')}
              className="px-2.5 py-1 bg-white hover:bg-stone-50 border rounded-lg whitespace-nowrap cursor-pointer hover:text-amber-650"
            >
              👜 {currentLang === 'ur' ? 'بیگز' : currentLang === 'hi' ? 'बैग' : 'Bags'}
            </button>
            <button 
              onClick={() => selectSuggestion(currentLang === 'ur' ? 'گھڑی کی قیمت' : currentLang === 'hi' ? 'घड़ी की कीमत' : 'Gold watch price')}
              className="px-2.5 py-1 bg-white hover:bg-stone-50 border rounded-lg whitespace-nowrap cursor-pointer hover:text-amber-650"
            >
              ⌚ {currentLang === 'ur' ? 'گھڑیاں' : currentLang === 'hi' ? 'घड़ी' : 'Watches'}
            </button>
            <button 
              onClick={() => selectSuggestion(currentLang === 'ur' ? 'کراچی ڈیلیوری' : currentLang === 'hi' ? 'डिलीवरी कूरियर' : 'Delivery schedule & cost')}
              className="px-2.5 py-1 bg-white hover:bg-stone-50 border rounded-lg whitespace-nowrap cursor-pointer hover:text-amber-650"
            >
              🇵🇰 {currentLang === 'ur' ? 'ڈیلیوری' : currentLang === 'hi' ? 'डिलीवरी' : 'Delivery'}
            </button>
          </div>

          {/* Conversational Screen */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-stone-50/70">
            {messages.map((m) => (
              <div 
                key={m.id} 
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'} space-y-1`}
              >
                <span className="text-[8px] uppercase tracking-widest font-mono text-stone-400">
                  {m.sender === 'user' ? 'Client' : 'Assistant'}
                </span>
                <div 
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs font-sans leading-relaxed shadow-xs ${
                    m.sender === 'user' 
                      ? 'bg-stone-905 text-white bg-stone-900 rounded-tr-none' 
                      : 'bg-white text-stone-800 border border-stone-200 rounded-tl-none'
                  }`}
                >
                  <p>{m.text}</p>
                </div>

                {/* Inline Product card helper inside Assistant support! */}
                {m.recommendedProducts && m.recommendedProducts.length > 0 && (
                  <div className="w-full flex gap-2 overflow-x-auto p-1.5 scrollbar-none">
                    {m.recommendedProducts.map(p => (
                      <div key={p.id} className="min-w-44 bg-white border rounded-xl overflow-hidden shadow-xs shrink-0 flex flex-col justify-between">
                        <img 
                          src={p.imageUrl} 
                          alt={p.title} 
                          className="w-full h-20 object-cover" 
                          referrerPolicy="no-referrer"
                        />
                        <div className="p-2 space-y-1">
                          <h6 className="font-extrabold text-[10px] text-stone-900 truncate leading-none">{p.title}</h6>
                          <p className="text-[10px] font-black text-amber-650">PKR {p.price.toLocaleString()}</p>
                          <button
                            onClick={() => onAddProductToCart(p)}
                            className="w-full mt-1 py-1 bg-amber-400 hover:bg-amber-500 text-[9px] font-black uppercase text-stone-900 rounded flex items-center justify-center gap-1 cursor-pointer transition-colors"
                          >
                            <ShoppingBag className="w-3 h-3" />
                            <span>{text.addToCart}</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="flex flex-col items-start space-y-1">
                <span className="text-[8px] uppercase tracking-widest font-mono text-stone-400">Assistant</span>
                <div className="bg-white text-stone-500 border border-stone-200 rounded-2xl rounded-tl-none px-3.5 py-2.5 text-xs font-sans flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Form sending queries */}
          <form onSubmit={handleSendMessage} className="p-3 border-t bg-white flex items-center gap-2">
            <input 
              type="text" 
              placeholder={text.placeholderMessage}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:border-stone-800 text-stone-900"
            />
            <button 
              type="submit" 
              className="p-2 bg-stone-900 hover:bg-stone-850 text-amber-400 rounded-xl cursor-pointer shadow-sm transition-transform active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
