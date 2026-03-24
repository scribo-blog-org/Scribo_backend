const { confirmEmailCode } = require('../../services/auth/verification.service')

const verificationEmailConfirmController = async (req, res, next) => {
    try {
        const result = await confirmEmailCode(req.body.email, req.body.email_code)

        res.status(200).json(result)
    }
    catch(error) {
        next(error)
    }
}

module.exports = verificationEmailConfirmController