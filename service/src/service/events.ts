import { Request } from 'express';
import { Event } from '../model';
import { config } from './config';

class EventService {
  async isSupportedEvent(eventName: string) {
    return (await config.getSupportedEvents()).includes(eventName);
  }
  getEventFromRequest(req: Request) {
    const clientId = req.body['client_id'];
    const eventName = req.body['event_name'];

    if (clientId && eventName) {
      return { clientId, eventName } as Event;
    }
  }
}

export const events = new EventService();
