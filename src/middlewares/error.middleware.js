function errorMiddleware(err, req, res, next) {
    if (!err.isOperational) {
        console.error(err);
        
        return res.status(500).json({
            status: false,
            message: 'Internal server error',
            data: null
        });
    }


    const response = {
        status: false,
        message: err.message,
        data: null
    };

    if (err.errors) {
        response.errors = err.errors;
    }

    res.status(err.status).json(response);
}

module.exports = { errorMiddleware };
