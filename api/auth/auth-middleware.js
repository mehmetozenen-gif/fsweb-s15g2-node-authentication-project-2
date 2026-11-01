
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../secrets');
const Users = require('../users/users-model');

// 1. JWT token kontrolü
const sinirli = (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return res.status(401).json({
      message: 'Token gereklidir',
    });
  }

  const token = authorization.startsWith('Bearer ')
    ? authorization.slice(7)
    : authorization;

  if (!token) {
    return res.status(401).json({
      message: 'Token gereklidir',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    req.decodedToken = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      message: 'Token gecersizdir',
    });
  }
};

// 2. Rol bazlı yetkilendirme
const sadece = (role_name) => (req, res, next) => {
  if (
    !req.decodedToken ||
    req.decodedToken.role_name !== role_name
  ) {
    return res.status(403).json({
      message: 'Bu, senin için değil',
    });
  }

  next();
};

// 3. Username veritabanında var mı?
const usernameVarmi = async (req, res, next) => {
  try {
    const { username } = req.body || {};

    if (!username) {
      return res.status(401).json({
        message: 'Geçersiz kriter',
      });
    }

    const users = await Users.goreBul({ 'u.username': username });

    if (users.length === 0) {
      return res.status(401).json({
        message: 'Geçersiz kriter',
      });
    }

    req.user = users[0];

    next();
  } catch (error) {
    next(error);
  }
};

// 4. Role name doğrulama
const rolAdiGecerlimi = (req, res, next) => {
  const { role_name } = req.body || {};

  const trimmedRole =
    typeof role_name === 'string'
      ? role_name.trim()
      : '';

  if (!trimmedRole) {
    req.role_name = 'student';
    return next();
  }

  if (trimmedRole === 'admin') {
    return res.status(422).json({
      message: 'Rol adı admin olamaz',
    });
  }

  if (trimmedRole.length > 32) {
    return res.status(422).json({
      message: 'rol adı 32 karakterden fazla olamaz',
    });
  }

  req.role_name = trimmedRole;

  next();
};

module.exports = {
  sinirli,
  sadece,
  usernameVarmi,
  rolAdiGecerlimi,
};
