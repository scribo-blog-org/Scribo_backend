const { Router } = require('express')
const router = Router()

const {
    getPostByIdSchema,
    createPostSchema,
    editPostSchema,
    deletePostSchema,
    savePostSchema,
    getPostsSchema,
    commentsSchema
} = require('../middlewares/validation/schemes')

const uploadMiddleware = require('../middlewares/upload.middleware')

const validateMiddleware = require('../middlewares/validation/validate.middleware')

const authMiddleware = require('../middlewares/auth.middleware')
const checkAdminAccessMiddleware = require('../middlewares/checkAccess.middleware')

const getPostsController = require('../controllers/posts/getPosts.controller')
const getPostByIdController = require('../controllers/posts/getPostById.controller')
const createPostController = require('../controllers/posts/createPost.controller')
const editPostController = require('../controllers/posts/editPost.controller')
const deletePostController = require('../controllers/posts/deletePost.controller')
const savePostController = require('../controllers/posts/savePost.controller')
const unsavePostController = require('../controllers/posts/unsavePost.controller')
const commentsController = require('../controllers/posts/comments.controller')

router.get(
    '/',
    validateMiddleware(getPostsSchema),
    getPostsController
)

router.get(
    '/:id',
    validateMiddleware(getPostByIdSchema),
    getPostByIdController
)

router.post(
    '/', 
    authMiddleware,
    checkAdminAccessMiddleware,
    uploadMiddleware(['featured_image']),
    validateMiddleware(createPostSchema),
    createPostController
)

router.patch(
    '/:id',
    authMiddleware,
    checkAdminAccessMiddleware,
    uploadMiddleware(['featured_image']),
    validateMiddleware(editPostSchema),
    editPostController
)

router.post(
    '/:id/comments',
    authMiddleware,
    validateMiddleware(commentsSchema),
    commentsController
)

router.delete(
    '/:id',
    authMiddleware,
    checkAdminAccessMiddleware,
    validateMiddleware(deletePostSchema),
    deletePostController
)

router.post(
    '/:id/save',
    authMiddleware,
    validateMiddleware(savePostSchema),
    savePostController
)

router.delete(
    '/:id/save',
    authMiddleware,
    validateMiddleware(savePostSchema),
    unsavePostController
)

module.exports = router