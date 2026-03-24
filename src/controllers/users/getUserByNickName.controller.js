const { getUserByNickName } = require('../../services/users.services')

const getUserByNickNameController = async (req, res, next) => {
    try {
        const user = await getUserByNickName(req.params["nick_name"])

        res.status(200).json(user)
    }
    catch(error) {
        next(error)
    }
}

module.exports = getUserByNickNameController