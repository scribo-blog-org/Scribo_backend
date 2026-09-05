import { PERMISSIONS, type Permission } from './permissions';
import { ROLE_MANAGEMENT } from './role-management';
import { ROLE_PERMISSIONS } from './role-permissions';
import type { Role } from './roles';

export type Actor = {
    id: string;
    email: string | null;
    nick_name: string | null;
    role: Role;
    sessionId: string | null;
};

export function hasPermission(
    actor: Actor | undefined,
    permission: Permission,
) {
    if (!actor?.role) {
        return false;
    }

    return ROLE_PERMISSIONS[actor.role]?.includes(permission) ?? false;
}

export function isResourceOwner(
    resourceAuthorId: unknown,
    actorId: string | undefined,
) {
    if (!resourceAuthorId || !actorId) {
        return false;
    }

    const authorId =
        typeof resourceAuthorId === 'object' &&
        resourceAuthorId &&
        '_id' in resourceAuthorId
            ? String((resourceAuthorId as { _id: unknown })._id)
            : String(resourceAuthorId);

    return authorId === String(actorId);
}

export function canManageRole(
    actorRole: Role,
    newRole: Role,
    currentRole: Role,
) {
    if (!ROLE_PERMISSIONS[actorRole]?.includes(PERMISSIONS.MANAGE_ROLES)) {
        return false;
    }

    const allowed = ROLE_MANAGEMENT[actorRole] ?? [];
    return allowed.includes(newRole) && allowed.includes(currentRole);
}
