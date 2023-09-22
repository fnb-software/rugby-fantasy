import fs from 'fs/promises';
import getDzn from './getDzn';
const file = './minizinc/fantasy-data.mzn';

const MAX_PER_TEAM = 3;

const writeDzn = async () => {
  await fs.rm(file);
  await fs.appendFile(file, getDzn());
};

export default writeDzn;
