const AppError = require("./AppError")

class UnAuthorizedError extends AppError {
    constructor(message = "Unauthorized") {
        super(message, null, 401, true);
        this.name = this.constructor.name;
    }
}

module.exports = UnAuthorizedError;