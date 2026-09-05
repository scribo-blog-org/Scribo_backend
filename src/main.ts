import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureScriboApp } from './create-app';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    await configureScriboApp(app);
    const port = process.env.PORT ?? '3001';
    await app.listen(port);
}

bootstrap();
