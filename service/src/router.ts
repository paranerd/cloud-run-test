import express from 'express';
import { collectEvent } from './controller/collect';
import { getCouponInfo } from './controller/coupon';
import { archiveVisitors, refreshToken } from './controller/manage';

export const router = express.Router();

router.post('/collect', collectEvent);
router.post('/coupon', getCouponInfo);
router.get('/archive', archiveVisitors);
router.get('/token', refreshToken);
