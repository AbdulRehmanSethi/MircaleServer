const globalErrorHandler = (err, req, res, next) => {
    const status = err.status ? err.status : "failed";
    const message = err.message;
    const stack = err.stack;
    const stausCode = err.stausCode ? err.stausCode : 500;

    res.status(stausCode).json(
        {
            status,
            message,
            stack
        }
    )
}

const urlNotFoundHandler = (req, res, next) => {
    const err = new Error(`Cannot find ${req.originalUrl} on the server`);
    next(err);
}


module.exports = { globalErrorHandler, urlNotFoundHandler };