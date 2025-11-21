import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import { supabase } from '../config/supabase';
import stellarService from '../services/stellar.service';
import { 
  PaymentInitiateRequest, 
  PaymentInitiateResponse,
  PaymentConfirmRequest,
  PaymentConfirmResponse 
} from '../types';

export class PaymentController {
  /**
   * POST /api/payments/initiate
   * Generar QR para pago USDC
   */
  async initiatePayment(req: Request, res: Response): Promise<void> {
    try {
      const { artisan_address, amount_usdc, product_id }: PaymentInitiateRequest = req.body;
      
      // Validaciones
      if (!artisan_address || !amount_usdc) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }
      
      if (!stellarService.isValidStellarAddress(artisan_address)) {
        res.status(400).json({ error: 'Invalid Stellar address' });
        return;
      }
      
      if (amount_usdc <= 0) {
        res.status(400).json({ error: 'Amount must be positive' });
        return;
      }
      
      // Verificar trustline USDC
      const hasTrustline = await stellarService.hasUSDCTrustline(artisan_address);
      if (!hasTrustline) {
        res.status(400).json({ 
          error: 'Artisan does not have USDC trustline',
          hint: 'Artisan must add USDC trustline first'
        });
        return;
      }
      
      // Crear payment intent en DB
      const paymentId = uuidv4();
      const memo = paymentId.substring(0, 8).toUpperCase();
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min
      
      const { error: dbError } = await supabase.from('payments').insert({
        id: paymentId,
        artisan_address,
        product_id: product_id || null,
        amount_usdc,
        memo,
        status: 'pending',
        created_at: new Date().toISOString()
      });
      
      if (dbError) {
        console.error('Database error:', dbError);
        res.status(500).json({ error: 'Failed to create payment intent' });
        return;
      }
      
      // Generar Stellar URI para QR
      const qrData = stellarService.generatePaymentURI(
        artisan_address,
        amount_usdc,
        memo
      );
      
      // Generar imagen QR
      const qrImageUrl = await QRCode.toDataURL(qrData);
      
      const response: PaymentInitiateResponse = {
        payment_id: paymentId,
        qr_data: qrData,
        qr_image_url: qrImageUrl,
        artisan_address,
        amount_usdc,
        memo,
        expires_at: expiresAt.toISOString()
      };
      
      res.status(201).json(response);
      
    } catch (error) {
      console.error('Error initiating payment:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * POST /api/payments/confirm
   * Verificar pago USDC en Horizon
   */
  async confirmPayment(req: Request, res: Response): Promise<void> {
    try {
      const { payment_id, stellar_tx_hash }: PaymentConfirmRequest = req.body;
      
      // Validaciones
      if (!payment_id || !stellar_tx_hash) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }
      
      // Obtener payment de DB
      const { data: payment, error: fetchError } = await supabase
        .from('payments')
        .select('*')
        .eq('id', payment_id)
        .single();
      
      if (fetchError || !payment) {
        res.status(404).json({ error: 'Payment not found' });
        return;
      }
      
      // Verificar que no esté ya confirmado
      if (payment.status === 'confirmed') {
        res.status(400).json({ 
          error: 'Payment already confirmed',
          confirmed_at: payment.confirmed_at
        });
        return;
      }
      
      // Verificar TX en Stellar usando SDK
      const verification = await stellarService.verifyPayment(
        stellar_tx_hash,
        payment.artisan_address,
        payment.amount_usdc
      );
      
      if (!verification.valid) {
        // Actualizar como failed
        await supabase
          .from('payments')
          .update({ 
            status: 'failed',
            stellar_tx_hash 
          })
          .eq('id', payment_id);
        
        const response: PaymentConfirmResponse = {
          status: 'failed',
          payment_id,
          error: verification.reason
        };
        
        res.status(400).json(response);
        return;
      }
      
      // Verificar que TX hash no esté duplicado
      const { data: existingPayment } = await supabase
        .from('payments')
        .select('id')
        .eq('stellar_tx_hash', stellar_tx_hash)
        .neq('id', payment_id)
        .single();
      
      if (existingPayment) {
        res.status(400).json({ 
          error: 'Transaction hash already used',
          hint: 'This transaction has already been confirmed for another payment'
        });
        return;
      }
      
      // Actualizar payment como confirmed
      const confirmedAt = new Date().toISOString();
      const { error: updateError } = await supabase
        .from('payments')
        .update({
          stellar_tx_hash,
          status: 'confirmed',
          confirmed_at: confirmedAt
        })
        .eq('id', payment_id);
      
      if (updateError) {
        console.error('Error updating payment:', updateError);
        res.status(500).json({ error: 'Failed to confirm payment' });
        return;
      }
      
      const response: PaymentConfirmResponse = {
        status: 'confirmed',
        payment_id,
        stellar_tx_hash,
        confirmed_at: confirmedAt
      };
      
      res.status(200).json(response);
      
    } catch (error) {
      console.error('Error confirming payment:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * GET /api/payments/:id/status
   * Obtener estado de un pago
   */
  async getPaymentStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const { data: payment, error } = await supabase
        .from('payments')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error || !payment) {
        res.status(404).json({ error: 'Payment not found' });
        return;
      }
      
      res.json({
        payment_id: payment.id,
        status: payment.status,
        amount_usdc: payment.amount_usdc,
        artisan_address: payment.artisan_address,
        stellar_tx_hash: payment.stellar_tx_hash,
        created_at: payment.created_at,
        confirmed_at: payment.confirmed_at
      });
      
    } catch (error) {
      console.error('Error getting payment status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default new PaymentController();