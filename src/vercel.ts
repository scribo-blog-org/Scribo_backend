import type { Request, Response } from 'express';
import { createScriboApp } from './create-app';

type ExpressApp = (req: Request, res: Response) => void;

let cached: ExpressApp | undefined;

async function getExpressApp() {
    if (!cached) {
        const app = await createScriboApp();
        await app.init();
        cached = app.getHttpAdapter().getInstance() as ExpressApp;
    }
    return cached;
}

export default async function handler(req: Request, res: Response) {
    const expressApp = await getExpressApp();
    expressApp(req, res);
}
