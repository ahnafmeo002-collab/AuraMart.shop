export type StoreCategory = string;

export interface SellerProfile {
  uid: string;
  email: string;
  displayName: string;
  isPremium: boolean;
  contactWhatsApp: string;
  storeName: string;
  bio?: string;
  customColor?: string; // HEX or tailwind class name
  createdAt: any;
}

export interface Product {
  id: string;
  sellerId: string; // ID of the seller/user who listed it
  title: string;
  description: string;
  price: number; // Retail listing price in PKR
  wholesalePrice: number; // Wholesale price in PKR
  category: StoreCategory;
  imageUrl: string;
  isPopular: boolean;
  forGender: "Boys" | "Girls" | "Unisex";
  colors: string[];
  sizes: string[];
  stockCount: number;
  buyerCartLink?: string; // shareable buyer link that automatically adds this product to cart
  createdAt: any;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor: string;
  selectedSize: string;
}

export interface Order {
  id: string;
  sellerId: string;
  buyerName: string;
  buyerPhone: string;
  buyerAddress: string;
  buyerCity: string;
  items: {
    productId: string;
    productTitle: string;
    quantity: number;
    price: number;
    selectedColor: string;
    selectedSize: string;
    imageUrl: string;
  }[];
  subtotal: number;
  shippingCost: number;
  totalAmount: number;
  paymentMethod: string;
  status: "pending" | "paid" | "completed" | "cancelled";
  createdAt: any;
  paymentConfirmed: boolean;
  notified: boolean;
  couponCode?: string;
  discountAmount?: number;
}

export interface ThemeConfig {
  primaryColor: "slate" | "rose" | "emerald" | "amber";
  fontFamily: "Inter" | "Space Grotesk" | "Playfair Display";
  layoutType: "grid" | "compact";
}

export interface CustomerProfile {
  name: string;
  phone: string;
  address: string;
  city: string;
  routinePreferences: {
    notifyOnNewArrivals: boolean;
    dailyAlertTime: string; // e.g. "09:00"
    preferredCategories: StoreCategory[];
    targetGenderInterest: "Boys" | "Girls" | "Unisex" | "All";
  };
}

export interface GlobalSettings {
  karachiShippingCost: number; // 300 PKR
  otherCitiesShippingCost: number; // 350 PKR
  adminWhatsApp: string;
  maxFreeListings: number; // e.g., 3
  websiteName?: string;
  tagline?: string;
  aiSystemPrompt?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: any;
  recommendedProductIds?: string[];
}

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}
