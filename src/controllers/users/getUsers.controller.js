const { getUsers } = require("../../services/users.services")

const getUsersController = async (req, res, next) => {
    try {
        const params = req.query

        const users = await getUsers(params)

        res.status(200).json(users)
    }
    catch(error) {
        next(error)
    } 
}

module.exports = getUsersController