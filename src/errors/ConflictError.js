const AppError = require('./AppError');

class ConflictError extends AppError {
    constructor(message, errors = null) {
        super(message, errors, 409, true);
    }
}

module.exports = ConflictError;