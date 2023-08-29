import { Request, Response } from 'express';

import { coupons } from '../service/coupons';
import { events } from '../service/events';
import { visitors } from '../service/visitors';

export async function collectEvent(req: Request, res: Response) {
  console.log('/collect called');
  const event = events.getEventFromRequest(req);
  if (!event) {
    return res.sendStatus(400);
  }
  if (!events.isSupportedEvent(event.eventName)) {
    return res.sendStatus(200);
  }

  console.log('event', event);
  const visitor = await visitors.getVisitor(event.clientId);
  console.log('visitor before', visitor);
  await visitors.incrementEventCount(event.eventName, visitor);
  //await visitors.storeVisitor(event.clientId, visitor);
  const { decision, coupon, isNew } = await coupons.getCoupon(visitor);
  visitor.coupon = decision;
  console.log('visitor after', visitor);
  await visitors.storeVisitor(event.clientId, visitor);
  console.log('coupon', coupon, isNew);

  console.log('coupon after', coupon);

  return res.send(coupon ? { ...coupon, is_new: isNew } : {});
}
