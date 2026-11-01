
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const Users = require('../users/users-model');
const {
  usernameVarmi,
  rolAdiGecerlimi,
} = require('./auth-middleware');

const { JWT_SECRET } = require('../secrets');

// POST /api/auth/register
router.post('/register', rolAdiGecerlimi, async (req, res, next) => {
  try {
    const { username, password } = req.body || {};

    if (
      typeof username !== 'string' ||
      !username.trim() ||
      typeof password !== 'string' ||
      password.length < 4
    ) {
      return res.status(422).json({
        message: 'Geçersiz kayıt bilgileri',
      });
    }

    const existingUsers = await Users.goreBul({
      'u.username': username.trim(),
    });

    if (existingUsers.length > 0) {
      return res.status(422).json({
        message: 'Username kullaniliyor',
      });
    }

    const passwordHash = bcrypt.hashSync(password, 10);

    const newUser = await Users.ekle({
      username: username.trim(),
      password: passwordHash,
      role_name: req.role_name,
    });

    res.status(201).json(newUser);
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login
router.post('/login', usernameVarmi, async (req, res, next) => {
  try {
    const { password } = req.body || {};
    const user = req.user;

    const passwordCorrect =
      typeof password === 'string' &&
      bcrypt.compareSync(password, user.password);

    if (!passwordCorrect) {
      return res.status(401).json({
        message: 'Geçersiz kriter',
      });
    }

    const payload = {
      subject: user.user_id,
      username: user.username,
      role_name: user.role_name,
    };

    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: '1d',
    });

    res.status(200).json({
      message: `${user.username} geri geldi!`,
      token,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
