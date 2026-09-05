import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Actor } from '../policy';

export const CurrentUser = createParamDecorator(
    (_data: unknown, context: ExecutionContext): Actor | undefined => {
        const request = context.switchToHttp().getRequest<{ auth?: Actor }>();
        return request.auth;
    },
);
