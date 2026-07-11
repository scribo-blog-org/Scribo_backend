const { Router } = require('express');
const router = Router()

const getLogsController = require('../controllers/logs/getLogs.controller');
const authMiddleware = require('../middlewares/auth.middleware')

const LogPolicy = require('../authorization/policies/log.policy')


router.get(
    '/',
    authMiddleware,
    LogPolicy.canView,
    getLogsController
)

module.exports = router
