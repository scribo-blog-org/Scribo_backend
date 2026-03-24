const { verifyGoogleToken } = require("../../services/auth/verification.service")

const verificationGoogleController = async (req, res, next) => {
    try {
        const result = await verifyGoogleToken(req.body.google_token)

        res.status(200).json(result)
    }
    catch(error) {
        next(error)
    }
}

module.exports = verificationGoogleController