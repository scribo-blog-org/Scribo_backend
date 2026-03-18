const { loginByGoogle } = require('../../services/auth/login.service')

const loginByGoogleController = async (req, res, next) => {
    try {
        const googleResult = await loginByGoogle(req.body.google_id)
        res.status(200).json(googleResult)
    }
    catch(err) {
        next(err)
    }
}

module.exports = loginByGoogleController