import User from '../models/user.model.js';

const getUserInfo = async (req, res, next) => {
  if (!req.userData) {
    return res.status(400).send('Запрос не имеет userData');
  }

  const id = req.userData.userId;

  try {
    // exclude password
    const user = await User.findById(id, ['-password']);

    res.json(user);
  } catch (e) {
    next(e);
  }
};

export { getUserInfo };
