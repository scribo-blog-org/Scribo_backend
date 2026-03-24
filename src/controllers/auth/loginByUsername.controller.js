const { loginByUserName } = require('../../services/auth/login.service')

const loginByUsernameController = async (req, res, next) => {
    try {
        const userNameResult = await loginByUserName({ userName: req.body.user_name, password: req.body.password })
        res.status(200).json(userNameResult)
    }
    catch(err) {
        next(err)
    }
}

module.exports = loginByUsernameController