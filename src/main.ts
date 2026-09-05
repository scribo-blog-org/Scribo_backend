import { createScriboApp } from './create-app';

async function bootstrap() {
    const app = await createScriboApp();
    const port = process.env.PORT ?? '3001';
    await app.listen(port);
}

bootstrap();
