const { Router } = require('express')
const router = Router()

const validateMiddleware = require('../middlewares/validation/validate.middleware')
const authMiddleware = require('../middlewares/auth.middleware')

const {
    deleteCommentSchema,
    editCommentSchema,
    likeCommentSchema
} = require('../middlewares/validation/schemes')

const CommentPolicy = require('../authorization/policies/comment.policy')

const deleteCommentController = require('../controllers/comments/deleteComment.controller')
const editCommentController = require('../controllers/comments/editComment.controller')
const likeCommentController = require('../controllers/comments/likeComment.controller')
const unlikeCommentController = require('../controllers/comments/unlikeComment.controller')


router.delete(
    '/:id',
    authMiddleware,
    validateMiddleware(deleteCommentSchema),
    CommentPolicy.canDelete,
    deleteCommentController
)

router.patch(
    '/:id',
    authMiddleware,
    validateMiddleware(editCommentSchema),
    CommentPolicy.canEdit,
    editCommentController
)

router.post(
    '/:id/like',
    authMiddleware,
    validateMiddleware(likeCommentSchema),
    likeCommentController
)

router.delete(
    '/:id/like',
    authMiddleware,
    validateMiddleware(likeCommentSchema),
    unlikeCommentController
)

module.exports = router