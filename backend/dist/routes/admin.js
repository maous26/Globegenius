"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
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
exports.default = router;
//# sourceMappingURL=admin.js.map