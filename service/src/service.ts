import express from 'express';
import { router } from './router';

export const service = express();
service.disable('x-powered-by');

service.use(express.json());
service.use(express.urlencoded({ extended: true }));

// Routes
service.use(router);
