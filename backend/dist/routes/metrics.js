"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
// Metrics routes
router.get('/system', async (req, res) => {
    res.json({ message: 'System metrics endpoint - to be implemented' });
});
router.get('/alerts', async (req, res) => {
    res.json({ message: 'Alert metrics endpoint - to be implemented' });
});
router.get('/performance', async (req, res) => {
    res.json({ message: 'Performance metrics endpoint - to be implemented' });
});
exports.default = router;
//# sourceMappingURL=metrics.js.map