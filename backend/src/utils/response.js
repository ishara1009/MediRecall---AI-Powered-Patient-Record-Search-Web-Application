const sendSuccess = (res, data, message = 'Success', status = 200) => {
  return res.status(status).json({
    success: true,
    message,
    data
  });
};

const sendError = (res, message = 'An error occurred', status = 500, errorDetails = null) => {
  const errorObj = {
    success: false,
    message,
  };
  if (errorDetails) {
    errorObj.error = errorDetails;
  }
  return res.status(status).json(errorObj);
};

module.exports = {
  sendSuccess,
  sendError
};
