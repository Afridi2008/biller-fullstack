export type NavigationTab = 
  | 'dashboard' 
  | 'new_bill' 
  | 'bills' 
  | 'products' 
  | 'customers' 
  | 'payments' 
  | 'analytics' 
  | 'settings' 
  | 'invoice_preview';

export type ProductType = 'area' | 'qty' | 'fixed' | 'custom';

export type BillStatus = 'PAID' | 'PARTIAL' | 'UNPAID';

export type PaymentMethod = 'Cash' | 'UPI' | 'Card' | 'Bank Tx';

export type PaymentStatus = 'Success' | 'Pending' | 'Failed';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  username: string;
  role: string;
  avatarUrl?: string;
}

export interface SizeVariant {
  id: string;
  name: string;
  width?: number;
  height?: number;
  costRate: number;
  sellingRate: number;
}

export interface Product {
  id: string;
  name: string;
  subtitle?: string;
  type: ProductType;
  costRate?: number;
  sellingRate?: number;
  unitLabel?: string; // e.g. "Sq.Ft", "Box of 100", "Hourly Rate"
  status: 'active' | 'inactive';
  variants?: SizeVariant[];
  description?: string;
}

export interface Customer {
  id: string;
  name: string;
  companyName?: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstin?: string;
  totalPurchases: number;
  totalPaid: number;
  pendingBalance: number;
  lastPurchaseDate?: string;
}

export interface BillItem {
  id: string;
  productId?: string;
  productName: string;
  specs?: string;
  type: ProductType;
  width?: number;
  height?: number;
  sqft?: number;
  quantity: number;
  rate: number;
  costRate?: number;
  amount: number;
  finishing?: string;
}

export interface Bill {
  id: string;
  invoiceNumber: string;
  draftNumber?: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  customerGstin?: string;
  date: string;
  dueDate: string;
  items: BillItem[];
  itemsSummary: string;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  cgstPercent: number;
  cgstAmount: number;
  sgstPercent: number;
  sgstAmount: number;
  taxAmount: number;
  totalAmount: number;
  advancePaid: number;
  balanceDue: number;
  paymentMethod: PaymentMethod;
  status: BillStatus;
  notes?: string;
  createdAt: string;
}

export interface PaymentRecord {
  id: string;
  date: string;
  time: string;
  timestamp: number;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerType?: string;
  method: PaymentMethod;
  amount: number;
  collectedBy: string;
  refTxnId?: string;
  status: PaymentStatus;
}

export interface ShopSettings {
  shopName: string;
  tagline: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  gstin: string;
  currency: string; // '₹' or '$'
  defaultCgstPercent: number;
  defaultSgstPercent: number;
  terms: string[];
}
