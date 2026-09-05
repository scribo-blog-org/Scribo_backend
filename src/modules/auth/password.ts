import { createHash } from 'crypto';
import * as bcrypt from 'bcryptjs';

export function hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
}

function passwordRounds() {
    const rounds = Number.parseInt(process.env.PASSWORD_SALT || '', 10);
    if (!Number.isFinite(rounds) || rounds < 4 || rounds > 31) {
        return 10;
    }
    return rounds;
}

export function setPasswordHash(password: string) {
    return bcrypt.hashSync(password, passwordRounds());
}

export function comparePassword(password: string, fromDb: string) {
    return bcrypt.compare(password, fromDb);
}
