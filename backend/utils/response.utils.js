const sendSuccess = (res, data, message='Success', statusCode=200) =>
  res.status(statusCode).json({ success:true, message, data });

const sendError = (res, message='Error', statusCode=500, errors=null) => {
  const body = { success:false, message, statusCode };
  if (errors) body.errors = errors;
  res.status(statusCode).json(body);
};

const paginatedResponse = (data, total, page, limit) => ({
  data, total, page, limit, totalPages: Math.ceil(total/limit),
});

module.exports = { sendSuccess, sendError, paginatedResponse };
