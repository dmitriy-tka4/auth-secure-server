import User from '../models/user.model.js';

const getAllUsers = async (req, res, next) => {
  try {
    // исключаем поле password, его на client передавать нельзя
    const users = await User.find().select('-password');

    res.json(users);
  } catch (e) {
    next(e);
  }
};

export { getAllUsers };
