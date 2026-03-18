const { loginByUserName } = require('../../services/auth/login.service')

const loginByUsernameController = async (req, res, next) => {
    try {
        const userNameResult = await loginByUserName(req.body.user_name, req.body.password)
        res.status(200).json(userNameResult)
    }
    catch(err) {
        next(err)
    }
}

module.exports = loginByUsernameController