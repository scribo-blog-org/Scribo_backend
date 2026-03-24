const { getProfile } = require('../../services/profile.services')

const getProfileController = async (req, res, next) => {
    try {
        const result = await getProfile(req.profile._id)
        res.status(200).json(result)
    }
    catch(error) {
        next(error)
    }
}

module.exports = getProfileController