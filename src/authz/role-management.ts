import { ROLES, type Role } from './roles';

export const ROLE_MANAGEMENT: Record<Role, Role[]> = {
    [ROLES.USER]: [],
    [ROLES.AUTHOR]: [],
    [ROLES.MODERATOR]: [],
    [ROLES.ADMIN]: [ROLES.USER, ROLES.AUTHOR, ROLES.MODERATOR],
    [ROLES.TECH_ADMIN]: [
        ROLES.USER,
        ROLES.AUTHOR,
        ROLES.MODERATOR,
        ROLES.ADMIN,
        ROLES.TECH_ADMIN,
    ],
};
