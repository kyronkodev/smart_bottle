/**
 * 데이터베이스 초기화 스크립트
 * schema.sql 실행
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// 환경변수 로드
require('../config/env')();

async function initDatabase() {
  let connection;

  try {
    console.log('🔧 Connecting to MySQL...');

    // MySQL 연결
    connection = await mysql.createConnection({
      host: process.env.DATABASE_HOST,
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_DATABASE,
      port: process.env.DATABASE_PORT,
      multipleStatements: true // 여러 SQL 문 실행 허용
    });

    console.log('✅ Connected to MySQL');

    // schema.sql 파일 읽기
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('📋 Executing schema.sql...');

    // 스키마 실행
    await connection.query(schema);

    console.log('✅ Database schema created successfully!');
    console.log('');
    console.log('📊 Tables created:');
    console.log('  - users (사용자)');
    console.log('  - babies (아기 정보)');
    console.log('  - devices (IoT 기기)');
    console.log('  - feeding_sessions (수유 세션)');
    console.log('  - feeding_records (수유 기록)');
    console.log('  - formula_inventory (분유 재고)');
    console.log('  - feeding_stats_daily (일별 통계)');
    console.log('');
    console.log('🎉 Database initialization completed!');
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 MySQL connection closed');
    }
  }
}

// 실행
initDatabase();
