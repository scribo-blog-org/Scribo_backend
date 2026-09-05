import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { RequestMethod } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { readFileSync } from 'fs';
import { join } from 'path';
import { AppModule } from './app.module';
import { ApiExceptionFilter } from './common/api-exception.filter';
import { openApiDocument } from './common/openapi-document';
import { ScriboValidationPipe } from './common/scribo-validation.pipe';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const http = app.getHttpAdapter().getInstance() as {
        set: (key: string, value: unknown) => void;
    };
    http.set('trust proxy', 1);

    const origin = [
        process.env.FRONTEND_ORIGIN,
        process.env.FRONTEND_ORIGIN_DEV,
        'http://localhost:3002',
        'http://127.0.0.1:3002',
    ].filter(Boolean) as string[];

    app.setGlobalPrefix('api', {
        exclude: [{ path: 'health', method: RequestMethod.GET }],
    });
    app.use(cookieParser());
    app.useGlobalPipes(new ScriboValidationPipe());
    app.useGlobalFilters(new ApiExceptionFilter());
    app.enableCors({
        origin: (
            requestOrigin: string | undefined,
            callback: (err: Error | null, allow?: boolean) => void,
        ) => {
            if (!requestOrigin) return callback(null, true);
            if (
                origin.includes(requestOrigin) ||
                requestOrigin.endsWith('.vercel.app')
            ) {
                return callback(null, true);
            }
            return callback(
                new Error(`CORS blocked for origin: ${requestOrigin}`),
                false,
            );
        },
        credentials: true,
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        exposedHeaders: ['Set-Cookie'],
        optionsSuccessStatus: 200,
    });

    const pkg = JSON.parse(
        readFileSync(join(process.cwd(), 'package.json'), 'utf8'),
    ) as { version: string };
    const port = process.env.PORT ?? '3001';
    const apiOrigin =
        process.env.API_ORIGIN || `http://localhost:${port}`;

    const swagger = new DocumentBuilder()
        .setTitle('Scribo API')
        .setDescription(
            'Scribo HTTP API. Responses use { status, message, data }.',
        )
        .setVersion(pkg.version)
        .addServer(apiOrigin)
        .addBearerAuth()
        .addCookieAuth('refresh_token')
        .build();

    const document = SwaggerModule.createDocument(app, swagger);
    Object.assign(document.info, { 'x-backend-version': pkg.version });
    openApiDocument.current = document as unknown as Record<string, unknown>;

    SwaggerModule.setup('swagger', app, document, {
        useGlobalPrefix: true,
        jsonDocumentUrl: 'docs-json',
    });

    await app.listen(port);
}

bootstrap();
