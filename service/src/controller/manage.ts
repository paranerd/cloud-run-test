import { Request, Response } from 'express';
import { manager } from '../service/manager';

export function archiveVisitors(req: Request, res: Response) {
  manager.moveToLongTermStorage();
  res.sendStatus(200);
}

export function refreshToken(req: Request, res: Response) {
  manager.refreshToken();
  res.sendStatus(200);
}
