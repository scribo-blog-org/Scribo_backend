const { Router } = require('express');

const getLogsController = require('../controllers/logs/getLogs.controller');
const checkAdminAccessMiddleware = require('../middlewares/checkAccess.middleware')
const authMiddleware = require('../middlewares/auth.middleware')

const router = Router()

router.get(
    '/',
    authMiddleware,
    checkAdminAccessMiddleware,
    getLogsController
)

module.exports = router
