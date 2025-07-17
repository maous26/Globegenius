import { Router, Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { connectDatabase } from '../database/connection';
import { authenticate } from '../middleware/auth';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = Router();

// Create a function to get auth service when needed
const getAuthService = () => {
  return new AuthService(connectDatabase.getPool());
};

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  departureAirport: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Token de rafraîchissement requis'),
});

// Register endpoint
router.post('/register', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = registerSchema.parse(req.body);
    
    logger.info('Registration attempt', { email: validatedData.email });

    // Register user
    const authService = getAuthService();
    const result = await authService.register(validatedData);
    
    logger.info('Registration successful', { 
      userId: result.user.id,
      email: result.user.email 
    });

    res.status(201).json({
      success: true,
      message: 'Inscription réussie',
      data: {
        user: result.user,
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken
      }
    });
  } catch (error: any) {
    logger.error('Registration failed', { error: error.message });
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: error.errors
      });
    }
    
    res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors de l\'inscription'
    });
  }
});

// Login endpoint
router.post('/login', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = loginSchema.parse(req.body);
    
    logger.info('Login attempt', { email: validatedData.email });

    // Login user
    const authService = getAuthService();
    const result = await authService.login(validatedData);
    
    logger.info('Login successful', { 
      userId: result.user.id,
      email: result.user.email 
    });

    res.json({
      success: true,
      message: 'Connexion réussie',
      data: {
        user: result.user,
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken
      }
    });
  } catch (error: any) {
    logger.error('Login failed', { error: error.message });
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: error.errors
      });
    }
    
    res.status(401).json({
      success: false,
      message: error.message || 'Erreur lors de la connexion'
    });
  }
});

// Refresh token endpoint
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const validatedData = refreshSchema.parse(req.body);
    
    const authService = getAuthService();
    const tokens = await authService.refreshToken(validatedData.refreshToken);
    
    res.json({
      success: true,
      message: 'Token rafraîchi',
      data: tokens
    });
  } catch (error: any) {
    logger.error('Token refresh failed', { error: error.message });
    
    res.status(401).json({
      success: false,
      message: error.message || 'Token de rafraîchissement invalide'
    });
  }
});

// Get profile endpoint (protected)
router.get('/profile', authenticate, async (req: Request, res: Response) => {
  try {
    const authService = getAuthService();
    const user = await authService.getProfile(req.user!.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error: any) {
    logger.error('Get profile failed', { error: error.message });
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil'
    });
  }
});

// Update profile endpoint (protected)
router.put('/profile', authenticate, async (req: Request, res: Response) => {
  try {
    const authService = getAuthService();
    const user = await authService.updateProfile(req.user!.id, req.body);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Profil mis à jour',
      data: { user }
    });
  } catch (error: any) {
    logger.error('Update profile failed', { error: error.message });
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du profil'
    });
  }
});

// Logout endpoint (protected)
router.post('/logout', authenticate, async (req: Request, res: Response) => {
  try {
    // In a real implementation, you might want to blacklist the token
    // For now, we'll just send a success response
    logger.info('User logged out', { userId: req.user!.id });
    
    res.json({
      success: true,
      message: 'Déconnexion réussie'
    });
  } catch (error: any) {
    logger.error('Logout failed', { error: error.message });
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la déconnexion'
    });
  }
});

export default router;