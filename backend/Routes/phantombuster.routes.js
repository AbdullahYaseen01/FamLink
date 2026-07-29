import express from 'express';
import { processPhantombusterWebhook } from '../Controllers/phantombuster.js';

const router = express.Router();

// The endpoint will be POST /phantombuster/webhook
router.post('/webhook', processPhantombusterWebhook);

export default router;
