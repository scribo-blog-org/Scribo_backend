const { registerByEmail } = require('../../services/auth/register.service')

const registerByEmailController = async (req, res, next) => {
    try {
        const emailResult = await registerByEmail(
            req.body.nick_name,
            req.body.description,
            req.body.password,
            req.file,
            req.body.email,
            req.body.email_code
        )
                    
        res.status(200).json(emailResult)
    }
    catch(err) {
        next(err)
    }
}

module.exports = registerByEmailController