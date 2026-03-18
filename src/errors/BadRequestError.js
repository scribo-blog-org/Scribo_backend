const AppError = require('./AppError');

class BadRequestError extends AppError {
    constructor(message, errors = null) {
        super(message, errors, 400, true);
    }
}

module.exports = BadRequestError;