class AppError extends Error {
    constructor({ message = "Internal server error", errors = null, status = 500, isOperational = false } = {}) {
        super(message);
        this.status = status;
        this.errors = errors;
        this.name = this.constructor.name;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;