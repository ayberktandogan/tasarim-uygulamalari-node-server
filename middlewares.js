function notFound(req, res, next) {
    res.status(404);
    const error = new Error(`🔍 - Not Found - ${req.originalUrl}`);
    next(error);
}

/* eslint-disable no-unused-vars */
function errorHandler(err, req, res, next) {
    let message, statusCode
    [message, statusCode] = err.message.split(',')

    /* eslint-enable no-unused-vars */
    if (!statusCode || statusCode > 503) statusCode = 500
    res.status(statusCode);
    res.json({
        message: message || "Bilinmeyen bir sorunla karşılaştık.",
        stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack
    });
}

module.exports = {
    notFound,
    errorHandler
};