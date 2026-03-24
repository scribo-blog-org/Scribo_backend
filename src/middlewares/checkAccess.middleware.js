const ForbiddenError = require("../errors/ForbiddenError")

const checkAccessMiddleware = async (req, res, next) => {
    try {
        if(!req.profile || !req.profile.is_admin) {
            throw new ForbiddenError({ message: "This user doesn't have permission to create a post!" })
        }

        next()
    }
    catch(error) {
        next(error)
    }
}

module.exports = checkAccessMiddleware