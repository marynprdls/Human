import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import { supabase } from '../config/supabase';
import stellarService from '../services/stellar.service';
import { 
  OrderCreateRequest, 
  OrderCreateResponse,
  OrderPayRequest,
  OrderPayResponse 
} from '../types';

export class OrderController {
  /**
   * POST /api/orders/create
   * Artesano/comerciante crea orden de pago
   */
  async createOrder(req: Request, res: Response): Promise<void> {
    try {
      const { 
        artisan_address,
        product_id,
        amount_xlm, 
        description,
        currency = 'XLM'
      }: OrderCreateRequest = req.body;
      
      console.log('📦 Creating order:', { artisan_address, amount_xlm, currency, product_id });
      
      // Validaciones
      if (!artisan_address || !amount_xlm) {
        res.status(400).json({ error: 'Missing required fields: artisan_address, amount_xlm' });
        return;
      }
      
      if (!stellarService.isValidStellarAddress(artisan_address)) {
        res.status(400).json({ error: 'Invalid Stellar address' });
        return;
      }
      
      if (amount_xlm <= 0) {
        res.status(400).json({ error: 'Amount must be positive' });
        return;
      }
      
      // Verificar que cuenta existe y está fondeada
      const isFunded = await stellarService.isAccountFunded(artisan_address);
      if (!isFunded) {
        res.status(400).json({ 
          error: 'Artisan account not found or not funded',
          hint: 'Account must have at least 1 XLM to receive payments'
        });
        return;
      }
      
      // Si hay product_id, verificar que existe
      if (product_id) {
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('id')
          .eq('id', product_id)
          .single();
        
        if (productError || !product) {
          res.status(400).json({ error: 'Product not found' });
          return;
        }
      }
      
      // Crear orden
      const orderId = uuidv4();
      const memo = orderId.substring(0, 8).toUpperCase();
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min
      
      // Guardar en DB
      const { error: dbError } = await supabase.from('orders').insert({
        id: orderId,
        artisan_address,
        product_id: product_id || null,
        amount_xlm,
        currency,
        description: description || 'Pago',
        memo,
        status: 'pending',
        expires_at: expiresAt.toISOString()
      });
      
      if (dbError) {
        console.error('artisan_address DB error:', dbError);
        res.status(500).json({ error: 'Failed to create order' });
        return;
      }
      
      // Generar QR (apunta a tu app)
      const appURL = process.env.FRONTEND_URL || 'http://localhost:5173';
      const orderURL = `${appURL}/pay/${orderId}`;
      
      const qrImage = await QRCode.toDataURL(orderURL, {
        errorCorrectionLevel: 'H',
        width: 512,
        margin: 2
      });
      
      console.log('✅ Order created:', orderId);
      
      const response: OrderCreateResponse = {
        order_id: orderId,
        order_url: orderURL,
        qr_image: qrImage,
        artisan_address,
        product_id: product_id || undefined,
        amount_xlm,
        currency,
        memo,
        expires_at: expiresAt.toISOString(),
        status: 'pending'
      };
      
      res.status(201).json(response);
      
    } catch (error) {
      console.error('artisan_address Error creating order:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * GET /api/orders/:id
   * Obtener detalles de orden
   */
  async getOrder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      console.log('🔍 Getting order:', id);
      
      const { data: order, error } = await supabase
        .from('orders')
        .select(`
          *,
          products (
            id,
            name,
            description,
            price_usdc,
            image_url
          )
        `)
        .eq('id', id)
        .single();
      
      if (error || !order) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }
      
      // Check si expiró
      if (new Date(order.expires_at) < new Date() && order.status === 'pending') {
        console.log('⏰ Order expired:', id);
        
        await supabase
          .from('orders')
          .update({ status: 'expired' })
          .eq('id', id);
        
        order.status = 'expired';
      }
      
      res.json(order);
      
    } catch (error) {
      console.error('artisan_address Error getting order:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * POST /api/orders/:id/pay
   * Confirmar pago de orden
   */
  async confirmOrderPayment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { tx_hash, payer_address }: OrderPayRequest = req.body;
      
      console.log('💳 Confirming order payment:', { orderId: id, tx_hash });
      
      if (!tx_hash) {
        res.status(400).json({ error: 'Missing tx_hash' });
        return;
      }
      
      // Obtener orden
      const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();
      
      if (fetchError || !order) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }
      
      if (order.status !== 'pending') {
        res.status(400).json({ 
          error: `Order is ${order.status}`,
          order_status: order.status
        });
        return;
      }
      
      // Check si expiró
      if (new Date(order.expires_at) < new Date()) {
        await supabase
          .from('orders')
          .update({ status: 'expired' })
          .eq('id', id);
        
        res.status(400).json({ error: 'Order has expired' });
        return;
      }
      
      // Verificar TX en Stellar
      console.log('🔍 Verifying transaction on Stellar...');
      
      const verification = order.currency === 'XLM'
        ? await stellarService.verifyPaymentXLM(
            tx_hash,
            order.artisan_address,
            order.amount_xlm
          )
        : await stellarService.verifyPayment(
            tx_hash,
            order.artisan_address,
            order.amount_xlm
          );
      
      if (!verification.valid) {
        console.error('artisan_address Payment verification failed:', verification.reason);
        
        res.status(400).json({ 
          error: 'Payment verification failed',
          reason: verification.reason 
        });
        return;
      }
      
      // Verificar que TX no está duplicada
      const { data: existingOrder } = await supabase
        .from('orders')
        .select('id')
        .eq('tx_hash', tx_hash)
        .neq('id', id)
        .single();
      
      if (existingOrder) {
        res.status(400).json({ 
          error: 'Transaction hash already used for another order' 
        });
        return;
      }
      
      // Actualizar orden
      const paidAt = new Date().toISOString();
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'paid',
          tx_hash,
          payer_address: payer_address || null,
          paid_at: paidAt
        })
        .eq('id', id);
      
      if (updateError) {
        console.error('artisan_address Error updating order:', updateError);
        res.status(500).json({ error: 'Failed to update order' });
        return;
      }
      
      console.log('✅ Order paid successfully:', id);
      
      // TODO: Aquí hacer visible al artesano en mapa si es su primera venta
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('artisan_address', order.artisan_address)
        .eq('status', 'paid');
      
      if (count === 1) {
        // Primera venta → hacer visible en mapa
        console.log('🎉 First sale! Making artisan visible on map');
        await supabase
          .from('artisans')
          .update({ visible_in_map: true })
          .eq('stellar_address', order.artisan_address);
      }
      
      const response: OrderPayResponse = {
        status: 'paid',
        order_id: id,
        tx_hash,
        paid_at: paidAt
      };
      
      res.json(response);
      
    } catch (error) {
      console.error('artisan_address Error confirming payment:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * GET /api/orders/artisan/:address
   * Obtener órdenes de un artesano
   */
  async getArtisanOrders(req: Request, res: Response): Promise<void> {
    try {
      const { address } = req.params;
      const { status, limit = 20, offset = 0 } = req.query;
      
      console.log('📋 Getting artisan orders:', { address, status });
      
      if (!stellarService.isValidStellarAddress(address)) {
        res.status(400).json({ error: 'Invalid Stellar address' });
        return;
      }
      
      let query = supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .eq('artisan_address', address)
        .order('created_at', { ascending: false })
        .range(
          parseInt(offset as string), 
          parseInt(offset as string) + parseInt(limit as string) - 1
        );
      
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data: orders, error, count } = await query;
      
      if (error) {
        console.error('artisan_address DB error:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
        return;
      }
      
      res.json({
        total: count,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        orders: orders || []
      });
      
    } catch (error) {
      console.error('artisan_address Error getting artisan orders:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default new OrderController();