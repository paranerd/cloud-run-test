import { Visitor, VisitorEventCounts } from '../model';
import { config } from './config';
import { events } from './events';
import { longtermDatabase } from './longterm-db';
import { realtimeDatabase } from './realtime-db';

class VisitorService {
  async determineVisitorGroup() {
    const visitorSplit = await config.getVisitorSplit();
    const rand = Math.random();
    if (rand < visitorSplit[0]) {
      return 'never';
    } else if (rand > 1 - visitorSplit[2]) {
      return 'always';
    }
    return 'dynamic';
  }

  async newVisitor(clientId: string) {
    return {
      clientId,
      group: await this.determineVisitorGroup(),
      lastModified: 0,
      eventCounts: {},
    } as Visitor;
  }

  getEventCount(eventName: string, visitor: Visitor) {
    return visitor.eventCounts[eventName] || 0;
  }

  async incrementEventCount(eventName: string, visitor: Visitor) {
    if (await events.isSupportedEvent(eventName)) {
      const count = this.getEventCount(eventName, visitor) + 1;
      visitor.eventCounts[eventName] = count;
      return count;
    }
    return 0;
  }

  async restoreVisitor(clientId: string) {
    const longTermVisitor = await longtermDatabase.retrieveVisitor(clientId);
    const shortTermVisitor = await realtimeDatabase.getVisitor(clientId);
    if (longTermVisitor && shortTermVisitor) {
      const merged = this.mergeVisitor(shortTermVisitor, longTermVisitor);
      merged.restored = true;
      await realtimeDatabase.saveVisitor(clientId, merged);
    } else if (shortTermVisitor) {
      shortTermVisitor.restored = false;
      await realtimeDatabase.saveVisitor(clientId, shortTermVisitor);
    }
  }

  async getVisitor(clientId: string) {
    const visitor = await realtimeDatabase.getVisitor(clientId);
    /*if (visitor?.restored === null) {
      this.restoreVisitor(clientId);
    }*/

    return visitor ?? this.newVisitor(clientId);
  }

  mergeVisitor(visitorA: Visitor, visitorB: Visitor) {
    const eventCountKeys = new Set(
      ...Object.keys(visitorA),
      ...Object.keys(visitorB)
    );
    const mergedEventCounts = {} as VisitorEventCounts;
    eventCountKeys.forEach((key) => {
      const countA = this.getEventCount(key, visitorA);
      const countB = this.getEventCount(key, visitorB);
      mergedEventCounts[key] = countA + countB;
    });
    const mergedVisitor: Visitor = {
      clientId: visitorA.clientId,
      lastModified: Math.max(visitorA.lastModified, visitorB.lastModified),
      group: visitorA.group,
      eventCounts: mergedEventCounts,
    };
    return mergedVisitor;
  }

  storeVisitor(clientId: string, visitor: Visitor) {
    visitor.lastModified = Date.now();
    return realtimeDatabase.saveVisitor(clientId, visitor);
  }
}

export const visitors = new VisitorService();
