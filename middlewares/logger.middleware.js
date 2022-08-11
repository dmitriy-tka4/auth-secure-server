import fs from 'fs';

const logger = (req, res, next) => {
  const now = new Date();

  const data = `${now.getDate()}.${now.getMonth() + 1}.${now.getFullYear()} ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()} - ${req.method} ${req.url} \n`;

  // папка logs должна быть создана, а файл log.txt создается автоматически при его отсутствии
  fs.appendFile('./logs/log.txt', data, () => {
    console.log(data);
  });

  next();
};

export default logger;
