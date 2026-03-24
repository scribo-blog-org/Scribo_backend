const { Router } = require('express')
const router = Router()

const {
    getUserByNickNameSchema,
    getUsersSchema,
    followSchema
} = require("../middlewares/validation/schemes")

const validateMiddleware = require('../middlewares/validation/validate.middleware')
const authMiddleware = require('../middlewares/auth.middleware')

const getUserByNickNameController = require("../controllers/users/getUserByNickName.controller")
const getUsersController = require("../controllers/users/getUsers.controller")
const followController = require("../controllers/users/follow.controller")
const unfollowController = require("../controllers/users/unfollow.controller")

router.get(
    '/:nick_name',
    validateMiddleware(getUserByNickNameSchema),
    getUserByNickNameController
)

router.get(
    '/',
    validateMiddleware(getUsersSchema),
    getUsersController
)

router.post(
    '/:id/follow',
    authMiddleware,
    validateMiddleware(followSchema),
    followController
)

router.delete(
    '/:id/follow',
    authMiddleware,
    validateMiddleware(followSchema),
    unfollowController
)

module.exports = router