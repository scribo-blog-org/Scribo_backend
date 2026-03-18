const fs = require('fs');
const Log = require('../models/Log')

class Logger {
    async log({ type = null, message = null, data=null }) {
        
        if(typeof type !== 'string' || typeof message !== 'string') {
            console.log(type, message)
            throw new Error("Parameters type and message is required!")
        }

        try {
            const logger = new Log({
                type: type,
                message: message,
                data: data
            })

            await logger.save();
        }
        catch(e) {
            console.log(e)
        }
    }
}

module.exports = Logger;