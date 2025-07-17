import { Router } from 'express';
import { Request, Response } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();

// Middleware pour vérifier les permissions admin
const requireAdmin = (req: Request, res: Response, next: Function) => {
  const user = (req as any).user;
  if (!user || (user.email !== 'admin@globegenius.com' && user.role !== 'admin')) {
    return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }
  next();
};

// Toutes les routes admin nécessitent une authentification et des permissions admin
router.use(authenticate);
router.use(requireAdmin);

// Dashboard stats
router.get('/dashboard-stats', async (req, res) => {
  try {
    // Simuler des données réelles - à remplacer par de vraies requêtes DB
    const stats = {
      users: {
        total: 2847,
        active: 1923,
        growth: 12.5,
        byPlan: {
          free: 1450,
          basic: 892,
          premium: 378,
          premiumPlus: 127
        }
      },
      alerts: {
        total: 15623,
        opened: 12456,
        clicked: 3892,
        openRate: 79.7,
        clickRate: 31.2,
        conversionRate: 8.4
      },
      revenue: {
        total: 45680,
        monthly: 8940,
        growth: 18.3,
        arpu: 23.50
      },
      routes: {
        total: 1247,
        active: 1089,
        tier1: 234,
        tier2: 567,
        tier3: 288,
        topPerforming: [
          { origin: 'Paris', destination: 'New York', volume: 2340, alertCount: 456, successRate: 89.3 },
          { origin: 'London', destination: 'Tokyo', volume: 1890, alertCount: 378, successRate: 92.1 },
          { origin: 'Berlin', destination: 'Bangkok', volume: 1567, alertCount: 234, successRate: 87.8 }
        ]
      },
      system: {
        uptime: 99.8,
        cpu: 67.2,
        memory: 78.9,
        errors: 23,
        apiCalls: {
          total: 2840567,
          thisMonth: 234567,
          limit: 500000
        }
      }
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// Users management
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 50, filter = 'all', search = '' } = req.query;
    
    // Simuler des données utilisateur - à remplacer par de vraies requêtes DB
    const mockUsers = [
      {
        id: '1',
        email: 'user1@example.com',
        name: 'Jean Dupont',
        plan: 'premium',
        status: 'active',
        createdAt: '2024-01-15T10:00:00Z',
        lastLogin: '2024-01-18T15:30:00Z',
        alertsCount: 23,
        totalSpent: 49.99
      },
      {
        id: '2',
        email: 'user2@example.com',
        name: 'Marie Martin',
        plan: 'basic',
        status: 'active',
        createdAt: '2024-01-10T14:00:00Z',
        lastLogin: '2024-01-19T09:15:00Z',
        alertsCount: 12,
        totalSpent: 19.99
      }
    ];

    // Filtrer et paginer les utilisateurs
    let filteredUsers = mockUsers;
    if (filter !== 'all') {
      filteredUsers = mockUsers.filter(user => user.status === filter);
    }
    if (search) {
      filteredUsers = filteredUsers.filter(user => 
        user.email.toLowerCase().includes(search.toString().toLowerCase()) ||
        user.name.toLowerCase().includes(search.toString().toLowerCase())
      );
    }

    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        users: paginatedUsers,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(filteredUsers.length / Number(limit)),
          totalItems: filteredUsers.length,
          itemsPerPage: Number(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Routes management
router.get('/routes', async (req, res) => {
  try {
    const { filter = 'all', search = '' } = req.query;
    
    // Simuler des données de routes - à remplacer par de vraies requêtes DB
    const mockRoutes = [
      {
        id: '1',
        origin: 'Paris',
        destination: 'New York',
        tier: 'tier1',
        avgVolume: 2340,
        scanFrequency: 15,
        isActive: true,
        lastScan: '2024-01-19T10:30:00Z',
        alertCount: 456,
        successRate: 89.3,
        priority: 'high'
      },
      {
        id: '2',
        origin: 'London',
        destination: 'Tokyo',
        tier: 'tier2',
        avgVolume: 1890,
        scanFrequency: 60,
        isActive: true,
        lastScan: '2024-01-19T09:45:00Z',
        alertCount: 378,
        successRate: 92.1,
        priority: 'medium'
      }
    ];

    // Filtrer les routes
    let filteredRoutes = mockRoutes;
    if (filter !== 'all') {
      filteredRoutes = mockRoutes.filter(route => route.tier === filter);
    }
    if (search) {
      filteredRoutes = filteredRoutes.filter(route => 
        route.origin.toLowerCase().includes(search.toString().toLowerCase()) ||
        route.destination.toLowerCase().includes(search.toString().toLowerCase())
      );
    }

    res.json({
      success: true,
      data: {
        routes: filteredRoutes,
        stats: {
          total: mockRoutes.length,
          active: mockRoutes.filter(r => r.isActive).length,
          byTier: {
            tier1: mockRoutes.filter(r => r.tier === 'tier1').length,
            tier2: mockRoutes.filter(r => r.tier === 'tier2').length,
            tier3: mockRoutes.filter(r => r.tier === 'tier3').length
          }
        }
      }
    });
  } catch (error) {
    console.error('Error fetching routes:', error);
    res.status(500).json({ error: 'Failed to fetch routes' });
  }
});

// Update route configuration
router.put('/routes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { tier, scanFrequency, priority, isActive } = req.body;

    // Simuler la mise à jour - à remplacer par de vraies requêtes DB
    console.log(`Updating route ${id}:`, { tier, scanFrequency, priority, isActive });

    res.json({
      success: true,
      message: 'Route updated successfully',
      data: {
        id,
        tier,
        scanFrequency,
        priority,
        isActive,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error updating route:', error);
    res.status(500).json({ error: 'Failed to update route' });
  }
});

// Analytics data
router.get('/analytics', async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    // Simuler des données analytiques - à remplacer par de vraies requêtes DB
    const analytics = {
      engagement: {
        openRate: 79.7,
        clickRate: 31.2,
        conversionRate: 8.4,
        unsubscribeRate: 2.1
      },
      apiUsage: {
        thisMonth: 234567,
        limit: 500000,
        dailyAverage: 7800,
        projectedMonth: 280000
      },
      subscriptions: {
        free: { count: 1450, percentage: 50.9 },
        basic: { count: 892, percentage: 31.3 },
        premium: { count: 378, percentage: 13.3 },
        premiumPlus: { count: 127, percentage: 4.5 }
      },
      trends: {
        userGrowth: [
          { date: '2024-01-12', value: 2650 },
          { date: '2024-01-13', value: 2689 },
          { date: '2024-01-14', value: 2734 },
          { date: '2024-01-15', value: 2778 },
          { date: '2024-01-16', value: 2801 },
          { date: '2024-01-17', value: 2825 },
          { date: '2024-01-18', value: 2847 }
        ],
        revenueGrowth: [
          { date: '2024-01-12', value: 43200 },
          { date: '2024-01-13', value: 43890 },
          { date: '2024-01-14', value: 44567 },
          { date: '2024-01-15', value: 45123 },
          { date: '2024-01-16', value: 45456 },
          { date: '2024-01-17', value: 45680 },
          { date: '2024-01-18', value: 45680 }
        ]
      }
    };

    res.json({ success: true, data: analytics });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
});

// System monitoring
router.get('/system', async (req, res) => {
  try {
    // Simuler des données système - à remplacer par de vraies métriques
    const systemInfo = {
      server: {
        uptime: 99.8,
        cpu: 67.2,
        memory: 78.9,
        disk: 45.6,
        network: {
          inbound: 234.5,
          outbound: 567.8
        }
      },
      database: {
        connections: 45,
        maxConnections: 100,
        queryTime: 23.4,
        size: 2.3 // GB
      },
      services: {
        api: { status: 'healthy', responseTime: 145 },
        scraper: { status: 'healthy', responseTime: 2340 },
        notifications: { status: 'healthy', responseTime: 89 },
        scheduler: { status: 'healthy', responseTime: 234 }
      },
      logs: {
        errors: 23,
        warnings: 156,
        info: 12456
      }
    };

    res.json({ success: true, data: systemInfo });
  } catch (error) {
    console.error('Error fetching system info:', error);
    res.status(500).json({ error: 'Failed to fetch system information' });
  }
});

// User actions
router.post('/users/:id/suspend', async (req, res) => {
  try {
    const { id } = req.params;
    // Simuler la suspension - à remplacer par de vraies requêtes DB
    console.log(`Suspending user ${id}`);
    res.json({ success: true, message: 'User suspended successfully' });
  } catch (error) {
    console.error('Error suspending user:', error);
    res.status(500).json({ error: 'Failed to suspend user' });
  }
});

router.post('/users/:id/activate', async (req, res) => {
  try {
    const { id } = req.params;
    // Simuler l'activation - à remplacer par de vraies requêtes DB
    console.log(`Activating user ${id}`);
    res.json({ success: true, message: 'User activated successfully' });
  } catch (error) {
    console.error('Error activating user:', error);
    res.status(500).json({ error: 'Failed to activate user' });
  }
});

export default router;
