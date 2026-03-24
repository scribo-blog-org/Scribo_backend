const { follow } = require("../../services/users.services")

const followController = async (req, res, next) => {
    try {
        const result = await follow(req.params["id"], req.profile)
        res.status(200).json(result)
    }
    catch(error) {
        next(error)
    }
}

module.exports = followController