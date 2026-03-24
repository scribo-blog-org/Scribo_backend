const AppError = require('./AppError');

class NotFoundError extends AppError {
    constructor({ message = "Resource not found", errors = null } = {}) {
        super({ message, errors, status: 404, isOperational: true });
    }
}

module.exports = NotFoundError;