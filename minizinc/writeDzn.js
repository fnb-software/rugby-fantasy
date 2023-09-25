import fs from 'fs/promises';
import getDzn from './getDzn';
const file = './minizinc/fantasy.dzn';

const writeDzn = async () => {
  await fs.rm(file);
  await fs.appendFile(file, getDzn());
};

writeDzn();
