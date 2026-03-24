const AppError = require('./AppError');

class BadRequestError extends AppError {
    constructor({ message = "Some errors in your fields!", errors = null } = {}) {
        super({ message, errors, status: 400, isOperational: true });
    }
}

module.exports = BadRequestError;