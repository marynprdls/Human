export interface PaymentInitiateRequest {
    artisan_address: string;
    amount_usdc: number;
    product_id?: string;
  }
  
  export interface PaymentInitiateResponse {
    payment_id: string;
    qr_data: string;
    qr_image_url: string;
    artisan_address: string;
    amount_usdc: number;
    memo: string;
    expires_at: string;
  }
  
  export interface PaymentConfirmRequest {
    payment_id: string;
    stellar_tx_hash: string;
  }
  
  export interface PaymentConfirmResponse {
    status: 'confirmed' | 'failed';
    payment_id: string;
    stellar_tx_hash?: string;
    confirmed_at?: string;
    error?: string;
  }
  // Orders
 // Orders (sistema unificado de pagos)
export interface OrderCreateRequest {
  artisan_address: string;
  product_id?: string;
  amount_xlm: number;
  currency?: 'XLM' | 'USDC';
  description?: string;
}

export interface OrderCreateResponse {
  order_id: string;
  order_url: string;
  qr_image: string;
  artisan_address: string;
  product_id?: string;
  amount_xlm: number;
  currency: string;
  memo: string;
  expires_at: string;
  status: string;
}

export interface OrderPayRequest {
  tx_hash: string;
  payer_address?: string;
}

export interface OrderPayResponse {
  status: 'paid' | 'failed';
  order_id: string;
  tx_hash?: string;
  paid_at?: string;
  error?: string;
}