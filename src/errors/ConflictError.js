const AppError = require('./AppError');

class ConflictError extends AppError {
    constructor({ message = "Conflict error!", errors = null } = {}) {
        super({ message, errors, status: 409, isOperational: true });
    }
}

module.exports = ConflictError;