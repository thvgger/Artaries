export interface ReceiptItem {
  id: string;
  description: string;
  qty: number;
  rate: number;
}

export interface ReceiptData {
  name: string;
  phone: string;
  date: string;
  items: ReceiptItem[];
  sn: string;
  imei: string;
}
