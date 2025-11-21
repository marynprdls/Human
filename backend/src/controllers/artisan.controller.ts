import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import stellarService from '../services/stellar.service';

export class ArtisanController {
  /**
   * POST /api/artisans/metadata
   * Guardar metadata off-chain (después de registro on-chain)
   */
  async saveMetadata(req: Request, res: Response): Promise<void> {
    try {
      const { 
        stellar_address, 
        name, 
        description, 
        phone, 
        email,
        photo_url,
        latitude,
        longitude,
        location_name 
      } = req.body;
      
      // Validaciones
      if (!stellar_address || !name) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }
      
      if (!stellarService.isValidStellarAddress(stellar_address)) {
        res.status(400).json({ error: 'Invalid Stellar address' });
        return;
      }
      
      // TODO: Verificar que esté registrado on-chain
      // (esto requiere el TypeScript client del contract)
      
      // Guardar en Supabase
      const { data, error } = await supabase
        .from('artisans')
        .upsert({
          stellar_address,
          name,
          description: description || null,
          phone: phone || null,
          email: email || null,
          photo_url: photo_url || null,
          latitude: latitude || null,
          longitude: longitude || null,
          location_name: location_name || null,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'stellar_address'
        })
        .select()
        .single();
      
      if (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Failed to save metadata' });
        return;
      }
      
      res.status(201).json({
        message: 'Metadata saved successfully',
        artisan: data
      });
      
    } catch (error) {
      console.error('Error saving metadata:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * GET /api/artisans/:address
   * Obtener artisan completo (on-chain + off-chain)
   */
  async getArtisan(req: Request, res: Response): Promise<void> {
    try {
      const { address } = req.params;
      
      if (!stellarService.isValidStellarAddress(address)) {
        res.status(400).json({ error: 'Invalid Stellar address' });
        return;
      }
      
      // TODO: Obtener datos on-chain del contract
      // Por ahora, solo metadata off-chain
      
      const { data: metadata, error } = await supabase
        .from('artisans')
        .select('*')
        .eq('stellar_address', address)
        .single();
      
      if (error || !metadata) {
        res.status(404).json({ error: 'Artisan not found' });
        return;
      }
      
      // Obtener productos
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('artisan_address', address)
        .eq('available', true);
      
      // Obtener balance USDC
      const usdcBalance = await stellarService.getUSDCBalance(address);
      
      res.json({
        stellar_address: metadata.stellar_address,
        name: metadata.name,
        description: metadata.description,
        photo_url: metadata.photo_url,
        phone: metadata.phone,
        email: metadata.email,
        location: {
          lat: metadata.latitude,
          lng: metadata.longitude,
          name: metadata.location_name
        },
        usdc_balance: usdcBalance,
        products: products || [],
        // TODO: agregar datos on-chain (verified, total_payments, etc)
      });
      
    } catch (error) {
      console.error('Error getting artisan:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * GET /api/artisans/nearby
   * Obtener artesanos cercanos (geolocalización)
   */
  async getNearbyArtisans(req: Request, res: Response): Promise<void> {
    try {
      const { lat, lng, radius = 5 } = req.query;
      
      if (!lat || !lng) {
        res.status(400).json({ error: 'Missing lat or lng parameters' });
        return;
      }
      
      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lng as string);
      const radiusKm = parseFloat(radius as string);
      
      // Calcular bounding box (aproximado)
      const latDelta = radiusKm / 111; // 1 grado ≈ 111 km
      const lngDelta = radiusKm / (111 * Math.cos(latitude * Math.PI / 180));
      
      const { data: artisans, error } = await supabase
        .from('artisans')
        .select('stellar_address, name, photo_url, latitude, longitude, location_name')
        .gte('latitude', latitude - latDelta)
        .lte('latitude', latitude + latDelta)
        .gte('longitude', longitude - lngDelta)
        .lte('longitude', longitude + lngDelta)
        .not('latitude', 'is', null);
      
      if (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Failed to fetch artisans' });
        return;
      }
      
      // TODO: Enriquecer con datos on-chain (verified, total_payments)
      
      res.json({
        count: artisans?.length || 0,
        artisans: artisans || []
      });
      
    } catch (error) {
      console.error('Error getting nearby artisans:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * GET /api/artisans
   * Listar todos los artesanos
   */
  async listArtisans(req: Request, res: Response): Promise<void> {
    try {
      const { limit = 20, offset = 0 } = req.query;
      
      const { data: artisans, error, count } = await supabase
        .from('artisans')
        .select('stellar_address, name, photo_url, location_name', { count: 'exact' })
        .range(
          parseInt(offset as string), 
          parseInt(offset as string) + parseInt(limit as string) - 1
        );
      
      if (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Failed to fetch artisans' });
        return;
      }
      
      res.json({
        total: count,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        artisans: artisans || []
      });
      
    } catch (error) {
      console.error('Error listing artisans:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default new ArtisanController();