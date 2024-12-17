const jwt = require('jsonwebtoken');
const { StatusCodes } = require('http-status-codes');

function authenticateToken(req, res, next) {
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
  if (!token) {
    return res.status(StatusCodes.OK).json({ message: 'Unauthorized' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      // console.log("[AUTHENTICATE_TOKEN] Forbidden")
      return res.status(StatusCodes.OK).json({ message: 'Forbidden' });
    }
    req.user = user;
    next();
  });
}

function checkAuth(req, res) {
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
  if (!token) {
    return res.status(StatusCodes.OK).json({ authenticated: false });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(StatusCodes.OK).json({ authenticated: false });
    }
    return res.status(StatusCodes.OK).json({ authenticated: true, user });
  });
}

module.exports = {
  authenticateToken,
  checkAuth
};
