import { GoogleAuth } from 'google-auth-library';
import { config } from './config';
import { longtermDatabase } from './longterm-db';
import { realtimeDatabase } from './realtime-db';

class ManagementService {
  async moveToLongTermStorage() {
    const archiveAge = await config.getArchiveAge();
    const visitors = await realtimeDatabase.getVisitorsOlderThan(archiveAge);
    if (visitors.length) {
      await longtermDatabase.persistVisitors(visitors);
      // await realtimeDatabase.deleteVisitors(visitors);
    }
  }
  async restoreFormLongTermStorage(clientId: string) {}

  async refreshToken() {
    const googleAuth = new GoogleAuth();
    const serviceUrl = await config.getServiceUrl();
    const client = (await googleAuth.getClient()) as any;
    const token = await client.fetchIdToken(serviceUrl);
    await config.setToken(token);
  }
}

export const manager = new ManagementService();
