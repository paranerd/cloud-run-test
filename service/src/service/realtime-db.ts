import { Firestore } from '@google-cloud/firestore';
import { Config, Coupon, Visitor } from '../model';

class FirestoreService {
  readonly COUPON_COLLECTION_NAME = 'coupons';
  readonly VISITOR_COLLECTION_NAME = 'visitors';

  private readonly firestore = new Firestore();

  constructor() {
    this.firestore.settings({ ignoreUndefinedProperties: true });
  }

  private getCouponDocPath(clientId: string) {
    return `${this.COUPON_COLLECTION_NAME}/${clientId}`;
  }
  private getVisitorDocPath(clientId: string) {
    return `${this.VISITOR_COLLECTION_NAME}/${clientId}`;
  }

  private async getDocumentData<T extends object>(docPath: string) {
    const doc = await this.firestore.doc(docPath).get();
    console.log('db: get document', docPath, doc.exists, doc.data());
    return doc.exists ? (doc.data() as T) : undefined;
  }

  private saveDocumentData<T extends object>(docPath: string, data: T) {
    const ref = this.firestore.doc(docPath);
    return ref.set(data);
  }

  getCoupon(clientId: string) {
    return this.getDocumentData<Coupon>(this.getCouponDocPath(clientId));
  }

  getVisitor(clientId: string) {
    return this.getDocumentData<Visitor>(this.getVisitorDocPath(clientId));
  }

  getConfig() {
    return this.getDocumentData<Config>('config/config');
  }

  saveVisitor(clientId: string, visitor: Visitor) {
    return this.saveDocumentData(this.getVisitorDocPath(clientId), visitor);
  }

  saveCoupon(clientId: string, coupon: Coupon) {
    return this.saveDocumentData(this.getCouponDocPath(clientId), coupon);
  }

  saveConfig(config: Config) {
    return this.saveDocumentData('config/config', config);
  }

  async getVisitorsOlderThan(ageMs: number) {
    const maxLastModified = Date.now() - ageMs;
    const query = this.firestore
      .collection(this.VISITOR_COLLECTION_NAME)
      .where('lastModified', '<', maxLastModified);
    const docs = (await query.get()).docs;
    return docs.map((doc) => doc.data()) as Visitor[];
  }

  async deleteVisitors(visitors: Visitor[]) {
    const batch = this.firestore.batch();
    visitors.forEach((visitor) => {
      batch.delete(
        this.firestore.doc(this.getVisitorDocPath(visitor.clientId))
      );
    });
    return batch.commit();
  }
}

export const realtimeDatabase = new FirestoreService();
