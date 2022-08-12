import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import UserRefreshToken from '../models/user-refresh-token.model.js';
import * as authUtil from '../utils/auth.util.js';

// signup

const signup = async (req, res, next) => {
  if (!req.body) {
    return res.status(400).send('Запрос не имеет тела запроса');
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send('Остутствует email или password');
  }

  // check email
  const isEmailExisted = await User.exists({ email });

  if (isEmailExisted) {
    return res.status(400).send('Пользователь с таким email уже существует');
  }

  // check password
  if (password.length < 6) {
    return res.status(400).send('Пароль должен быть не менее 6 символов');
  }

  // все ок
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = new User({
    email,
    password: hashedPassword // bcrypt
  });

  try {
    await user.save();
  } catch (e) {
    return res.status(400).send('Ошибка сохранения пользователя в базу');
  }

  // создаем tokens
  const accessToken = authUtil.generateAccessToken(user._id);
  const refreshToken = authUtil.generateRefreshToken(user._id);

  // сохраняем токен в БД
  try {
    await authUtil.saveRefreshTokenInDB(refreshToken, user._id);
  } catch (e) {
    return res.status(400).send(e.message);
  }

  // add refresh token to cookie
  res.cookie('refresh_token', refreshToken); // , { httpOnly: true, secure: true }

  res.status(201).json({
    accessToken,
    refreshToken
  });
};

// login

const login = async (req, res, next) => {
  if (!req.body) {
    return res.status(400).send('Запрос не имеет body');
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send('Остутствует email или password');
  }

  // find user by email
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).send('Пользователь с таким email не существует');
  }

  // compare password
  const isPasswordCorrect = await bcrypt.compare(password, user.password);

  if (!isPasswordCorrect) {
    return res.status(400).send('Пароль неверный');
  }

  // нужно удалить старый Refresh token, если он есть в базе
  try {
    await authUtil.deleteRefreshTokenInDB(user._id);
  } catch (e) {
    return next(e);
  }

  // создаем tokens
  const accessToken = authUtil.generateAccessToken(user._id);
  const refreshToken = authUtil.generateRefreshToken(user._id);

  // сохраняем refresh токен в БД
  try {
    await authUtil.saveRefreshTokenInDB(refreshToken, user._id);
  } catch (e) {
    return res.status(400).send(e.message);
  }

  // add refresh token to cookie
  res.cookie('refresh_token', refreshToken); // , { httpOnly: true, secure: true }

  res.status(201).json({
    accessToken,
    refreshToken
  });
};

// logout

const logout = async (req, res, next) => {
  if (!req.userData) {
    return res.status(400).send('Отсутствуют данные для logout');
  }

  const userId = req.userData.userId;

  if (!userId) {
    return res.status(400).send('В данных нет userId');
  }

  // нужно удалить старый Refresh token, если он есть в базе
  try {
    await authUtil.deleteRefreshTokenInDB(userId);
  } catch (e) {
    return next(e);
  }

  // удалить cookie
  res.clearCookie('refresh_token'); // , { httpOnly: true, secure: true }

  res.sendStatus(204);
};

const refresh = async (req, res, next) => {
  // check availability refresh token

  // in cookies
  const inRefreshToken = req.cookies['refresh_token']

  // in headers
  // const authHeader = req.get('Authorization');

  // if (!authHeader) {
  //   return res.status(400).send('Отсутствует authorization header');
  // }

  // const refrehToken = authHeader && authHeader.split(' ')[0] === 'Bearer' && authHeader.split(' ')[1];

  // in body
  // if (!req.body) {
  //   return res.status(400).send('Нет тела запроса');
  // }

  // const inRefreshToken = req.body.refreshToken;

  if (!inRefreshToken) {
    return res.status(400).send('Нет refresh токена');
  }

  try {
    const decodedInRefreshTokenPayload = jwt.verify(inRefreshToken, process.env.REFRESH_TOKEN_SECRET);

    if (decodedInRefreshTokenPayload.type !== 'refresh') {
      return res.status(400).send('У переданного токена тип не refresh');
    }

    const userId = decodedInRefreshTokenPayload.userId;

    if (!userId) {
      return res.status(400).send('В токене нет userId');
    }

    const currentUserRefreshToken = await UserRefreshToken.findOne({ userId });

    if (!currentUserRefreshToken) {
      return res.status(400).send('Refresh токен недействительный');
    }

    const currentRefreshToken = currentUserRefreshToken.refreshToken;

    // сравниваем входящий и текущий, хранящийся в БД, токены, используя bcrypt
    const isTokenCorrect = await bcrypt.compare(inRefreshToken, currentRefreshToken);

    if (!isTokenCorrect) {
      return res.status(400).send('Refresh токен недействительный');
    }

    // далее как в логине

    // удаляем старый Refresh token, если он есть в базе
    try {
      await authUtil.deleteRefreshTokenInDB(userId);
    } catch (e) {
      return next(e);
    }

    // создаем новую пару токенов
    const newAccessToken = authUtil.generateAccessToken(userId);
    const newRefreshToken = authUtil.generateRefreshToken(userId);

    // сохраняем refresh токен в БД
    try {
      await authUtil.saveRefreshTokenInDB(newRefreshToken, userId);
    } catch (e) {
      return res.status(400).send(e.message);
    }

    // add refresh token to cookie
    res.cookie('refresh_token', newRefreshToken); // , { httpOnly: true, secure: true }

    res.status(201).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (e) {
    return res.status(400).send('Refresh токен недействительный');
  }
};

export { signup, login, logout, refresh };
