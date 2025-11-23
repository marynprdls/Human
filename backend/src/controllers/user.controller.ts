import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { UserRegisterRequest, UserResponse } from '../types';

export class UserController {
  /**
   * POST /api/users/register
   * Registrar nuevo usuario (artesano o cliente)
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      console.log('👤 POST /api/users/register - Request received');
      console.log('📦 Request body:', req.body);

      const userData: UserRegisterRequest = req.body;

      // Validaciones básicas
      if (!userData.stellar_address || !userData.google_sub || !userData.role || !userData.name) {
        res.status(400).json({
          error: 'Missing required fields: stellar_address, google_sub, role, name'
        });
        return;
      }

      // Validar rol
      if (!['artisan', 'client'].includes(userData.role)) {
        res.status(400).json({ error: 'Invalid role. Must be artisan or client' });
        return;
      }

      // Validaciones adicionales para artesanos
      if (userData.role === 'artisan') {
        if (!userData.business_name) {
          res.status(400).json({ error: 'business_name is required for artisans' });
          return;
        }
        if (userData.latitude && !userData.longitude || !userData.latitude && userData.longitude) {
          res.status(400).json({ error: 'Both latitude and longitude are required for location' });
          return;
        }
      }

      // Verificar si ya existe
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('stellar_address', userData.stellar_address)
        .single();

      if (existingUser) {
        res.status(409).json({
          error: 'User already registered',
          user: existingUser
        });
        return;
      }

      // Insertar usuario
      console.log('💾 Inserting user to Supabase:', userData);

      const { data: newUser, error: dbError } = await supabase
        .from('users')
        .insert(userData)
        .select()
        .single();

      if (dbError) {
        console.error('[F] DB error:', dbError);
        res.status(500).json({ error: 'Failed to register user' });
        return;
      }

      console.log('[ok] User registered successfully:', newUser.stellar_address);

      res.status(201).json(newUser);

    } catch (error) {
      console.error('[F] Error registering user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * GET /api/users/:stellar_address
   * Obtener datos de usuario por dirección Stellar
   */
  async getUser(req: Request, res: Response): Promise<void> {
    try {
      const { stellar_address } = req.params;

      console.log('🔍 Getting user:', stellar_address);

      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('stellar_address', stellar_address)
        .single();

      if (error || !user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json(user);

    } catch (error) {
      console.error('[F] Error getting user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * GET /api/users/by-google/:google_sub
   * Obtener usuario por Google Sub ID
   */
  async getUserByGoogleSub(req: Request, res: Response): Promise<void> {
    try {
      const { google_sub } = req.params;

      console.log('🔍 Getting user by Google sub:', google_sub);

      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('google_sub', google_sub)
        .single();

      if (error || !user) {
        console.log('[F] User not found for Google sub:', google_sub);
        if (error) {
          console.error('📊 Supabase error:', error);
        }
        res.status(404).json({ error: 'User not found' });
        return;
      }

      console.log('[ok] User found:', { role: user.role, name: user.name });
      res.json(user);

    } catch (error) {
      console.error('[F] Error getting user by Google sub:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * GET /api/users
   * Obtener todos los usuarios
   */
  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      console.log('📋 Getting all users');

      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ DB error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
        return;
      }

      console.log(`✅ Found ${users?.length || 0} users`);

      res.json({ users: users || [] });

    } catch (error) {
      console.error('❌ Error getting users:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * PUT /api/users/:stellar_address
   * Actualizar datos de usuario
   */
  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { stellar_address } = req.params;
      const updates = req.body;

      console.log('📝 Updating user:', stellar_address, updates);

      // No permitir cambiar stellar_address, google_sub, o role
      delete updates.stellar_address;
      delete updates.google_sub;
      delete updates.role;

      const { data: updatedUser, error } = await supabase
        .from('users')
        .update(updates)
        .eq('stellar_address', stellar_address)
        .select()
        .single();

      if (error) {
        console.error('[F] DB error:', error);
        res.status(500).json({ error: 'Failed to update user' });
        return;
      }

      console.log('[ok] User updated successfully');

      res.json(updatedUser);

    } catch (error) {
      console.error('[F] Error updating user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default new UserController();
