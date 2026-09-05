import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import { hasPermission, type Actor } from '../policy';
import type { Permission } from '../permissions';

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}

    canActivate(context: ExecutionContext) {
        const permissions = this.reflector.getAllAndOverride<Permission[]>(
            PERMISSIONS_KEY,
            [context.getHandler(), context.getClass()],
        );

        if (!permissions?.length) {
            return true;
        }

        const actor = context
            .switchToHttp()
            .getRequest<{ auth?: Actor }>().auth;

        for (const permission of permissions) {
            if (!hasPermission(actor, permission)) {
                throw new ForbiddenException(
                    "You don't have permission to perform this action!",
                );
            }
        }

        return true;
    }
}
