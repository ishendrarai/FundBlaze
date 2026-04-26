class AppError extends Error {
  constructor(message, statusCode = 500, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors     = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, _next) => {
  let { statusCode = 500, message = 'Internal server error', errors = null } = err;

  if (err.name === 'ValidationError') {
    statusCode = 400; message = 'Validation failed';
    errors = Object.keys(err.errors).reduce((a,k) => { a[k]=[err.errors[k].message]; return a; }, {});
  }
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `${field.charAt(0).toUpperCase()+field.slice(1)} already exists`;
    errors  = { [field]: [`${field} is already taken`] };
  }
  if (err.name === 'CastError')        { statusCode=400; message=`Invalid ${err.path}: ${err.value}`; }
  if (err.name === 'JsonWebTokenError'){ statusCode=401; message='Invalid token'; }
  if (err.name === 'TokenExpiredError'){ statusCode=401; message='Token expired'; }

  const body = { success:false, statusCode, message };
  if (errors)                              body.errors = errors;
  if (process.env.NODE_ENV==='development') body.stack  = err.stack;

  console.error(`[${statusCode}] ${req.method} ${req.path} →`, message);
  res.status(statusCode).json(body);
};

module.exports = { errorHandler, AppError };
