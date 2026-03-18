const { Router } = require('express')
const router = Router();

const uploadMiddleware = require('../middlewares/upload.middleware');
const {
    loginUsernameSchema,
    loginGoogleSchema,
    registerEmailSchema,
    registerGoogleSchema,
    verificationGoogleSchema,
    verificationEmailSchema,
    verificationEmailConfirmSchema
} = require('../middlewares/validation/schemes')

const validateMiddleware = require('../middlewares/validation/validate.middleware')

const loginByGoogleController = require('../controllers/auth/loginByGoogle.controller');
const loginByUsernameController = require('../controllers/auth/loginByUsername.controller');
const registerByEmailController = require('../controllers/auth/registerByEmail.controller');
const registerByGoogleController = require('../controllers/auth/registerByGoogle.controller');

const verifitcationGoogleController = require('../controllers/auth/verifitcationGoogle.controller');
const verificationEmailController = require('../controllers/auth/verificationEmail.controller');
const verificationEmailConfirmController = require('../controllers/auth/verificationEmailConfirm.controller');

router.post(
    '/login/username',
    validateMiddleware(loginUsernameSchema),
    loginByUsernameController
);

router.post(
    '/login/google',
    validateMiddleware(loginGoogleSchema),
    loginByGoogleController
);

router.post(
    '/register/email',
    uploadMiddleware(['avatar']),
    validateMiddleware(registerEmailSchema),
    registerByEmailController
);

router.post(
    '/register/google',
    uploadMiddleware(['avatar']),
    validateMiddleware(registerGoogleSchema),
    registerByGoogleController
);

router.post(
    '/verification/google', 
    validateMiddleware(verificationGoogleSchema),
    verifitcationGoogleController
)

router.post(
    '/verification/email',
    validateMiddleware(verificationEmailSchema),
    verificationEmailController
)

router.post(
    '/verification/email/confirm',
    validateMiddleware(verificationEmailConfirmSchema),
    verificationEmailConfirmController
)

module.exports = router