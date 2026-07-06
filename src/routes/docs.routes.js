const { Router } = require('express')
const router = Router();

const getDocsController = require('../controllers/docs/getDocs.controller')

router.get(
    '/',
    getDocsController
)

module.exports = router