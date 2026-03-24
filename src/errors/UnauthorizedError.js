const AppError = require("./AppError")

class UnAuthorizedError extends AppError {
    constructor({ message = "Unauthorized", errors = null } = {}) {
        super({ message, errors, status: 401, isOperational: true });
        this.name = this.constructor.name;
    }
}

module.exports = UnAuthorizedError;