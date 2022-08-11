import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import UserRefreshToken from '../models/user-refresh-token.model.js';

const ACCESS_TOKEN_LIFETIME = '20s';
const REFRESH_TOKEN_LIFETIME = '60s';

const generateAccessToken = (userId) => {
  const accessTokenPayload = {
    userId: userId,
    type: 'access'
  };

  const accessToken = jwt.sign(
    accessTokenPayload,
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_LIFETIME }
  );

  return accessToken;
};

const generateRefreshToken = (userId) => {
  const refreshTokenPayload = {
    userId: userId,
    type: 'refresh',
  };

  const refreshToken = jwt.sign(
    refreshTokenPayload,
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: REFRESH_TOKEN_LIFETIME }
  );

  return refreshToken;
};

const saveRefreshTokenInDB = async (refreshToken, userId) => {
  const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

  const userRefreshToken = new UserRefreshToken({
    userId: userId,
    refreshToken: hashedRefreshToken, // bcrypt
  });

  try {
    await userRefreshToken.save();
  } catch (e) {
    throw new Error('Ошибка сохранения токена в базу');
  }
};

const deleteRefreshTokenInDB = async (userId) => {
  // используем deleteMany(), а не deleteOne()-  удаляем все, если вдруг есть другие записи с таким userId
  await UserRefreshToken.deleteMany({ userId });
};

export { generateAccessToken, generateRefreshToken, saveRefreshTokenInDB, deleteRefreshTokenInDB };
