const { registerByGoogle } = require('../../services/auth/register.service')

const registerByGoogleController = async (req, res, next) => {
    try{
        const googleResult = await registerByGoogle(
            req.body.nick_name,
            req.body.description,
            req.body.password,
            req.file,
            req.body.google_token
        )
        
        res.status(200).json(googleResult)
    }
    catch(err) {
        next(err)
    }
}

module.exports = registerByGoogleController