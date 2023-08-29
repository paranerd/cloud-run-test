import { Coupon, Visitor } from '../model';
import { inference } from './inference';
import { realtimeDatabase } from './realtime-db';
import { visitors } from './visitors';

export interface CouponInfo {
  decision?: boolean;
  coupon?: Coupon;
  isNew?: boolean;
}

class CouponService {
  isEligibleForInference(visitor: Visitor) {
    console.log('coupons: check eligibility');
    return (
      visitors.getEventCount('page_view', visitor) > 3 &&
      visitor.coupon === undefined
    );
  }

  async scoreVisitor(visitor: Visitor): Promise<number> {
    console.log('coupons: score', visitor);
    const purchasePropensity = await inference.predictPurchasePropensity(
      visitor
    );
    console.log('coupons: propensity', purchasePropensity);
    return purchasePropensity;
  }
  inferInterestCategory(visitor: Visitor): Promise<string> {
    console.log('coupons: infer category', visitor);
    return Promise.resolve('default');
  }

  async lookupReduction(score: number, category: string) {
    console.log('coupons: look up reduction', score, category);
    // const matrix = await config.getReductionMatrix();
    return Math.round(score * 100);
  }

  async inferCouponValue(visitor: Visitor) {
    console.log('coupons: infer coupon value', visitor);
    const score = await this.scoreVisitor(visitor);
    const category = await this.inferInterestCategory(visitor);
    const reduction = await this.lookupReduction(score, category);
    return reduction;
  }
  registerCoupon(visitor: Visitor, value: number) {
    console.log('coupons: register coupon', visitor.clientId, value);
    return Promise.resolve('get-in!-' + visitor.clientId);
  }

  async getCoupon(visitor: Visitor): Promise<CouponInfo> {
    console.log('coupons: get coupon');
    const coupon = await realtimeDatabase.getCoupon(visitor.clientId);
    if (coupon) {
      console.log('coupons: coupon already exists', coupon);
      return { decision: true, coupon };
    }

    if (this.isEligibleForInference(visitor)) {
      console.log('coupons: visitor eligible', visitor);
      const value = await this.inferCouponValue(visitor);
      if (value > 0) {
        const code = await this.registerCoupon(visitor, value);
        const coupon = { value, code };
        await realtimeDatabase.saveCoupon(visitor.clientId, coupon);
        console.log('coupons: saved coupon');
        return { decision: true, coupon, isNew: true };
      }
      return { decision: false, isNew: true };
    }
    return { isNew: false };
  }
}

export const coupons = new CouponService();
