const { Router } = require('express')
const router = Router();

const authMiddleware = require('../middlewares/auth.middleware')
const uploadMiddleware = require('../middlewares/upload.middleware')
const validationMiddleware = require('../middlewares/validation/validate.middleware')

const { updateProfileSchema } = require('../middlewares/validation/schemes')

const getProfileController = require('../controllers/profile/getProfile.controller')
const updateProfileController = require('../controllers/profile/updateProfile.controller')
const readNotificationsController = require('../controllers/profile/readNotification.controller')

router.get(
    '/',
    authMiddleware,
    getProfileController
)

router.patch(
    '/',
    authMiddleware,
    uploadMiddleware(["avatar"]),
    validationMiddleware(updateProfileSchema),
    updateProfileController
)

router.patch(
    '/notifications',
    authMiddleware,
    readNotificationsController
)

module.exports = router;