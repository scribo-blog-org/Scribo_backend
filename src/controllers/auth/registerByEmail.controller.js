const { registerByEmail } = require('../../services/auth/register.service')

const registerByEmailController = async (req, res, next) => {
    try {
        const emailResult = await registerByEmail({
            nickName: req.body.nick_name,
            description: req.body.description,
            password: req.body.password,
            avatar: req.file,
            email: req.body.email,
            emailCode: req.body.email_code
        })
                    
        res.status(200).json(emailResult)
    }
    catch(err) {
        next(err)
    }
}

module.exports = registerByEmailController