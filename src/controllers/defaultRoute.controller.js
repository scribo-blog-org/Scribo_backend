const defaultRoute = require('../services/default.services')

const defaultRouteController = (req, res, next) => {
    try {
        const result = defaultRoute()

        res.status(200).json(result)
    }
    catch(error) {
        next(error)
    }
}

module.exports = defaultRouteController