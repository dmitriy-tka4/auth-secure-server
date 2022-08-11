import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import logger from './middlewares/logger.middleware.js';
import authRoute from './routes/auth.route.js';
import isAuth from './middlewares/is-auth.middleware.js';

const app = express();
const port = 3000;

dotenv.config();

app.use(cookieParser());
app.use(express.json());
app.use(logger);

// test isAuth
app.get('/', isAuth, (req, res) => {
  res.send('it works');
});

// routes
app.use('/auth', authRoute);

// 404
app.use((req, res, next) => {
  res.sendStatus(404);
});

// error handler
app.use((err, req, res, next) => {
  res.status(err.status || 500).send(err.message);
});

const main = async () => {
  await mongoose.connect('mongodb://localhost:27017/users3');

  app.listen(port, () => console.log(`Server listening at http://localhost:${port}`));
};

main();
