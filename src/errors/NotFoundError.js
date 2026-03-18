const AppError = require('./AppError');

class NotFoundError extends AppError {
    constructor(message, errors = null) {
        super(message, errors, 404, true);
    }
}

module.exports = NotFoundError;