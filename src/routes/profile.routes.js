const { Router } = require('express')
const { get_profile, update_profile, save_post, unsave_post, read_notifications } = require('../services/profile.services')
const multer = require('multer');
const router = Router();

const upload = multer({
    limits: { fieldSize: 5 * 1024 * 1024 }
})

router.get('/', async (req, res) => {
    try {
        const user = await get_profile(req)

        res.status(user.code)

        delete user.code

        res.json(user)
    }
    catch(e) {
        console.log(e)

        res.status(500).json({
            status: false,
            message: "Internal server error",
            data: null
        })
    }
})

router.patch('/', (req, res) => {
    upload.single('avatar')(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
            req.file = null
        }
        try {
            const result = await update_profile(req)

            res.status(result.code)

            delete result.code

            res.json(result)
        }
        catch(e) {
            console.log(e)

            res.status(500).json({
                status: false,
                message: "Internal server error",
                data: null
            })
        }
    })
})

router.post('/save-post/:id', async (req, res) => {
    try {
        const result = await save_post(req)
        
        res.status(result.code)

        delete result.code

        res.json(result)
    }
    catch(e) {
        console.log(e)

        res.status(500).json({
            status: false,
            message: "Internal server error",
            data: null
        })
    }
})

router.delete('/save-post/:id', async (req, res) => {
    try {
        const result = await unsave_post(req)
        
        res.status(result.code)

        delete result.code

        res.json(result)
    }
    catch(e) {
        console.log(e)

        res.status(500).json({
            status: false,
            message: "Internal server error",
            data: null
        })
    }
})

router.patch('/read-notifications', async(req, res) => {
    try {
        const result = await read_notifications(req)

        res.status(result.code)

        delete result.code

        res.json(result)
    }
    catch(e) {
        console.log(e)

        const result_data = {
            status: false,
            message: "Internal server error!",
            data: null
        }

        res.status(500).json(result_data)
    }
})

module.exports = router;