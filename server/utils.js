function socketResponse(socket, function_name, data) {
  if (!data.success) { 
    if (data.error) {
      // console.error(`[${function_name}] ${data.msg}`, data.error)
    } else {
      // console.error(`[${function_name}] ${data.msg}`)
    }
  } else { 
    // console.log(`[${function_name}] ${data.msg}`)
  }
  socket.emit(function_name, {
    success: data.success,
    detail: data.detail
  })
}

function httpResponse(res, function_name, code, data) {
  if (!data.success) { 
    if (data.error) {
      // console.error(`[${function_name}] ${data.msg}`, data.error);
    } else {
      // console.error(`[${function_name}] ${data.msg}`);
    }
  } else { 
    // console.log(`[${function_name}] ${data.msg}`);
  }
  const response = Object.keys(data).reduce((acc, key) => {
    if (key !== 'msg') {
      acc[key] = data[key];
    }
    return acc;
  }, {});
  // // console.log("response", response);
  res.status(code).json(response);
}

module.exports = { 
  socketResponse,
  httpResponse,
};