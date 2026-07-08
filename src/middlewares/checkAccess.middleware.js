const ForbiddenError = require("../errors/ForbiddenError")

const checkAdminAccessMiddleware = async (req, res, next) => {
    try {
        if(!req.profile || !req.profile.is_admin) {
            throw new ForbiddenError({ message: "This user doesn't have permission to do this action!" })
        }
        next()
    }
    catch(error) {
        next(error)
    }
}

module.exports = checkAdminAccessMiddleware