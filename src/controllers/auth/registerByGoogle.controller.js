const { registerByGoogle } = require('../../services/auth/register.service')

const registerByGoogleController = async (req, res, next) => {
    try{
        const googleResult = await registerByGoogle({
            nickName: req.body.nick_name,
            description: req.body.description,
            password: req.body.password,
            avatar: req.file,
            googleToken: req.body.google_token
        })
        
        res.status(200).json(googleResult)
    }
    catch(err) {
        next(err)
    }
}

module.exports = registerByGoogleController