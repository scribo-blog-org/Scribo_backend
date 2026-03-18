const AppError = require("./AppError")

class ForbiddenError extends AppError {
    constructor(message = "Permission denied") {
        super(message, null, 403, true);
        this.name = this.constructor.name;
    }
}

module.exports = ForbiddenError;