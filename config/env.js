const dotenv = require('dotenv');
const path = require('path');

const loadEnv = () => {
  const environment = process.env.NODE_ENV || 'development';
  const envPath = path.resolve(
    process.cwd(),
    `config/.env.${environment}`
  );

  const result = dotenv.config({ path: envPath });

  if (result.error) {
    throw new Error(`환경변수 로드 실패: ${result.error}`);
  }

  console.log(`${environment} 환경으로 실행됩니다.`);
};

module.exports = loadEnv;