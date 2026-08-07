export interface ReceiptItem {
  id: string;
  description: string;
  qty: number;
  rate: number;
  sn?: string;
  imei?: string;
}

export interface ReceiptData {
  receiptNo?: string;
  name: string;
  phone: string;
  date: string;
  paymentMethod?: string;
  items: ReceiptItem[];
  customerSignature?: string;
  managerSignature?: string;
}
