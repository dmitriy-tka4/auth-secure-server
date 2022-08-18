import jwt from 'jsonwebtoken';

const isAuth = async (req, res, next) => {
  // check availability access token
  const authHeader = req.get('Authorization');

  if (!authHeader) {
    return res.status(400).send('Отсутствует authorization header');
  }

  const accessToken = authHeader && authHeader.split(' ')[0] === 'Bearer' && authHeader.split(' ')[1];

  if (!accessToken) {
    return res.status(400).send('Нет access token');
  }

   // verify
  try {
    const decodedAccessTokenPayload = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);

    if (decodedAccessTokenPayload.type !== 'access') {
      return res.status(400).send('У переданного токена тип не access');
    }

    // add userData to request
    req.userData = decodedAccessTokenPayload;

    next();
  } catch (e) {
    if (e instanceof jwt.TokenExpiredError) {
      return res.status(401).send('Access token expired, необходимо обновить access token, используя refresh token');
    } else if (e instanceof jwt.JsonWebTokenError) {
      return res.status(400).send('Access token недействительный');
    } else {
      return res.status(400).send('Access token unknown error');
    }
  }
}

export default isAuth;
