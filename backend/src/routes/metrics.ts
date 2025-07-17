import { Router } from 'express';

const router = Router();

// Metrics routes
router.get('/', async (req, res) => {
  res.json({ message: 'Metrics endpoint - to be implemented' });
});

router.get('/system', async (req, res) => {
  res.json({ message: 'System metrics endpoint - to be implemented' });
});

router.get('/alerts', async (req, res) => {
  res.json({ message: 'Alert metrics endpoint - to be implemented' });
});

router.get('/performance', async (req, res) => {
  res.json({ message: 'Performance metrics endpoint - to be implemented' });
});

export default router;
