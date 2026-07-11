const { Router } = require('express')
const router = Router()

const validateMiddleware = require('../middlewares/validation/validate.middleware')
const authMiddleware = require('../middlewares/auth.middleware')

const {
    deleteCommentSchema
} = require('../middlewares/validation/schemes')

const CommentPolicy = require('../authorization/policies/comment.policy')

const deleteCommentController = require('../controllers/comments/deleteComment.controller')

router.delete(
    '/:id',
    authMiddleware,
    validateMiddleware(deleteCommentSchema),
    CommentPolicy.canDelete,
    deleteCommentController
)

module.exports = router