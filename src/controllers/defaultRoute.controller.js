const { defaultRoute } = require('../services/default.services')

const defaultRouteController = async (req, res, next) => {
    try {
        const result = await defaultRoute()

        res.setHeader("Content-Type", "text/html").status(200).send(result)
    }
    catch(error) {
        next(error)
    }
}

module.exports = defaultRouteController