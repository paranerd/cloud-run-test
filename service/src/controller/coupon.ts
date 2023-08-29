import { Request, Response } from 'express';
import { coupons } from '../service/coupons';
import { visitors } from '../service/visitors';

export async function getCouponInfo(req: Request, res: Response) {
  try {
    console.log('body', JSON.stringify(req.body, null, 2));
    const clientId = req.body['client_id'];
    console.log(clientId);
    if (!clientId) {
      return res.sendStatus(400);
    }

    const visitor = await visitors.getVisitor(clientId);
    if (!visitor) {
      return res.sendStatus(400);
    }
    console.log('visitor', JSON.stringify(visitor));
    const { decision, coupon, isNew } = await coupons.getCoupon(visitor);
    visitor.coupon = decision;
    await visitors.storeVisitor(clientId, visitor);
    console.log('coupon', coupon, isNew);
    return res.send(coupon ? { ...coupon, is_new: isNew } : {});
  } catch (e) {
    console.log('error', e);
    return res.sendStatus(400);
  }
}
