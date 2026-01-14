
export interface PriceDataPoint {
  month: string;
  price: number;
}

export interface RetailerSource {
  title: string;
  uri: string;
  trustScore: number; // 1-5
  deliveryCharge: string;
  deliveryTime: string;
  offers: string[];
  branchInfo?: string;
  isSponsored?: boolean;
  isFeatured?: boolean;
}

export interface AnalysisResult {
  productName: string;
  category: 'Electronics' | 'Groceries' | 'Fashion' | 'Home' | 'Other';
  currentFoundPrice: string;
  marketAverage: string;
  verdict: 'BUY_NOW' | 'WAIT' | 'CAUTION';
  advice: string;
  priceHistory: PriceDataPoint[];
  sources: RetailerSource[];
  bestBuyLink?: string;
  productImageUrl?: string;
  emiOptions?: string;
  bankCashback?: string;
}

export type ScanStatus = 'IDLE' | 'SCANNING' | 'ANALYZING' | 'RESULT' | 'ERROR';

export interface TrackedItem {
  id: string;
  name: string;
  price: string;
  image: string;
  addedAt: number;
  alertPrice?: string;
}

export interface AnalyticsEvent {
  timestamp: number;
  type: 'SEARCH' | 'CLICK_BUY' | 'TRACK_PRICE';
  productName: string;
  category: string;
  retailer?: string;
}
