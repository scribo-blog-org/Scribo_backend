const readNotificationsService = require('../../services/profile.services').readNotifications

const readNotificationsController = async (req, res, next) => {
    try {
        const result = await readNotificationsService(req.profile)
        res.status(200).json(result)
    }
    catch(error) {
        next(error)
    }
}

module.exports = readNotificationsController;