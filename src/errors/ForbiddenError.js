const AppError = require("./AppError")

class ForbiddenError extends AppError {
    constructor({ message = "You don't have permission to perform this action!", errors = null } = {}) {
        super({ message, errors, status: 403, isOperational: true });
    }
}

module.exports = ForbiddenError;