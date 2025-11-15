const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// 로그 포맷 정의
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.printf(info => {
        return `${info.timestamp} [${info.level.toUpperCase()}]: ${info.message}`;
    })
);

// 로그 파일 설정
const transport = new DailyRotateFile({
    filename: path.join(__dirname, '../logs', 'application-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    level: 'info'
});

// Winston 로거 생성
const logger = winston.createLogger({
    format: logFormat,
    transports: [
        transport,
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ]
});

// 로그 작성 함수
const writeLog = (level, message) => {
    logger.log({
        level: level,
        message: message
    });
};

module.exports = {
    logger,
    writeLog
};