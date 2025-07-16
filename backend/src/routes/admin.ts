import { Router } from 'express';

const router = Router();

// Admin routes
router.get('/users', async (req, res) => {
  res.json({ message: 'Admin users endpoint - to be implemented' });
});

router.get('/analytics', async (req, res) => {
  res.json({ message: 'Admin analytics endpoint - to be implemented' });
});

router.get('/system', async (req, res) => {
  res.json({ message: 'Admin system endpoint - to be implemented' });
});

export default router;
