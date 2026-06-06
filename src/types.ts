export interface Store {
  id: string;
  name: string;
  location?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  storeId: string;
  code: string; // Barcode or SKU
  name: string;
  category: string;
  costPrice: number; // Cost Price (Preço de custo)
  salePrice: number; // Sale Price (Preço de venda)
  stock: number;
  minStock: number; // Threshold for low stock warning
  partnerId?: string; // Optional linked partner
  brand?: string; // Optional brand / marca
  image?: string; // Optional product image URL or Base64 string
}

export interface SaleItem {
  productId: string;
  name: string;
  quantity: number;
  costPrice: number;
  salePrice: number;
  partnerId?: string;
  commissionAmount?: number;
}

export interface Sale {
  id: string;
  storeId: string;
  date: string; // ISO date string
  items: SaleItem[];
  paymentMethod: string; // 'Dinheiro' | 'Cartão de Crédito' | 'Cartão de Débito' | 'Pix'
  discount: number;
  total: number;
  profit: number; 
  commissionPaid?: boolean; // Track if commissions from this sale have been disbursed
}

export interface Partner {
  id: string;
  storeId: string;
  name: string;
  email?: string;
  phone?: string;
  commissionPercent: number; // Default commission for this partner
}

export interface Expense {
  id: string;
  storeId: string;
  description: string;
  category: string;
  amount: number;
  date: string;
  status: 'Pago' | 'Pendente';
  dueDate?: string;
}

export interface CashEntry {
  id: string;
  storeId: string;
  type: 'entrada' | 'saída';
  description: string;
  amount: number;
  date: string;
  category: string;
}

export interface MonthlyGoal {
  id: string;
  storeId: string;
  targetValue: number;
  profitTargetValue?: number;
  yearMonth: string; // Format "YYYY-MM"
}

export interface MonthlyDesiredSalary {
  id: string;
  storeId: string;
  amount: number;
  yearMonth: string; // Format "YYYY-MM"
}

export interface Notification {
  id: string;
  storeId: string;
  type: 'info' | 'warning' | 'success';
  title: string;
  message: string;
  date: string;
  read: boolean;
  soldProduct?: string;
  quantity?: number;
  partnerProfit?: number;
  accumulatedBalance?: number;
  partnerId?: string;
}
