const { Router } = require('express');

const defaultRouteController = require('../controllers/defaultRoute.controller');

const router = Router()

router.get(
    '/',
    defaultRouteController
)

module.exports = router
