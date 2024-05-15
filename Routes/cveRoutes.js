import express from 'express';
import { getListCve, getcveById } from '../Controllers/CveController.js';
const router = express.Router();
router.get('/cve/lists' , getListCve);
router.get('/' , getListCve);

router.get('/cves/:id' ,getcveById );

export default router;

