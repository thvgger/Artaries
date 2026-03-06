export interface ReceiptItem {
  id: string;
  description: string;
  qty: number;
  rate: number;
  sn?: string;
  imei?: string;
}

export interface ReceiptData {
  name: string;
  phone: string;
  date: string;
  items: ReceiptItem[];
}
