const { unfollow } = require('../../services/users.services')

const unfollowController = async (req, res, next) => {
    try {
        const result = await unfollow(req.params["id"], req.profile)
        
        res.status(200).json(result)
    }
    catch(error) {
        next(error)
    }
}

module.exports = unfollowController