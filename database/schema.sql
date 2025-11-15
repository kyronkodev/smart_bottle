-- ============================
-- Smart Bottle Database Schema
-- Version: 2.0
-- Date: 2025-11-13
-- ============================

-- 기존 테이블 삭제 (재생성을 위해)
DROP TABLE IF EXISTS feeding_stats_daily;
DROP TABLE IF EXISTS feeding_records;
DROP TABLE IF EXISTS feeding_sessions;
DROP TABLE IF EXISTS formula_inventory;
DROP TABLE IF EXISTS devices;
DROP TABLE IF EXISTS babies;
DROP TABLE IF EXISTS users;

-- ============================
-- 1. users (사용자 테이블)
-- ============================
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(100) UNIQUE NOT NULL COMMENT '이메일 (로그인용)',
    password VARCHAR(255) NOT NULL COMMENT '암호화된 비밀번호',
    name VARCHAR(50) NOT NULL COMMENT '사용자 이름',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='사용자 정보';

-- ============================
-- 2. babies (아기 정보 테이블)
-- ============================
CREATE TABLE babies (
    baby_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL COMMENT '부모 사용자 ID',
    name VARCHAR(50) NOT NULL COMMENT '아기 이름',
    birth_date DATE NOT NULL COMMENT '생년월일',
    gender ENUM('M', 'F', 'U') DEFAULT 'U' COMMENT '성별 (M:남, F:여, U:미정)',
    weight_at_birth DECIMAL(5,2) COMMENT '출생 시 체중 (kg)',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='아기 정보';

-- ============================
-- 3. devices (IoT 기기 정보 테이블)
-- ============================
CREATE TABLE devices (
    device_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL COMMENT '소유자 사용자 ID',
    device_uuid VARCHAR(100) UNIQUE NOT NULL COMMENT '기기 고유 식별자 (ESP32 MAC 주소 등)',
    device_name VARCHAR(100) NOT NULL DEFAULT 'Smart Bottle' COMMENT '기기 이름',
    bottle_weight DECIMAL(6,2) DEFAULT 0 COMMENT '분유통 자체 무게 (g) - 빈 분유통',
    is_online BOOLEAN DEFAULT FALSE COMMENT '온라인 상태',
    socket_id VARCHAR(100) COMMENT '현재 소켓 연결 ID',
    last_connected DATETIME COMMENT '마지막 연결 시간',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_device_uuid (device_uuid),
    INDEX idx_socket_id (socket_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='IoT 기기 정보';

-- ============================
-- 4. feeding_sessions (수유 세션 테이블)
-- ============================
CREATE TABLE feeding_sessions (
    session_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    device_id INT NOT NULL COMMENT '기기 ID',
    baby_id INT NOT NULL COMMENT '아기 ID',
    status ENUM('ready', 'bottle_placed', 'in_progress', 'completed', 'cancelled') DEFAULT 'ready'
        COMMENT '세션 상태: ready(시작대기), bottle_placed(분유통올림), in_progress(수유중), completed(완료), cancelled(취소)',

    -- 시간 정보
    button_pressed_at DATETIME COMMENT '버튼1 누른 시간 (수유 시작 알림)',
    bottle_placed_at DATETIME COMMENT '분유통 올린 시간',
    feeding_started_at DATETIME COMMENT '수유 시작 시간 (분유통 들어올린 시간)',
    feeding_ended_at DATETIME COMMENT '수유 종료 시간 (분유통 다시 내려놓은 시간)',

    -- 무게 정보
    initial_weight DECIMAL(7,2) COMMENT '초기 측정 무게 (g) - 분유통 포함',
    final_weight DECIMAL(7,2) COMMENT '종료 시 무게 (g) - 분유통 포함',
    amount_consumed DECIMAL(7,2) COMMENT '실제 먹은 양 (g) = (initial - final) - bottle_weight',

    -- 온도 정보
    temperature DECIMAL(4,1) COMMENT '분유 온도 (°C)',
    temperature_safe BOOLEAN DEFAULT FALSE COMMENT '적정 온도 여부',

    -- 소요 시간
    duration INT COMMENT '수유 소요 시간 (초)',

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE,
    FOREIGN KEY (baby_id) REFERENCES babies(baby_id) ON DELETE CASCADE,
    INDEX idx_device_id (device_id),
    INDEX idx_baby_id (baby_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='실시간 수유 세션 (진행 상태 관리)';

-- ============================
-- 5. feeding_records (수유 기록 테이블)
-- ============================
CREATE TABLE feeding_records (
    feeding_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    session_id BIGINT NOT NULL COMMENT '완료된 세션 ID',
    baby_id INT NOT NULL COMMENT '아기 ID',
    device_id INT NOT NULL COMMENT '기기 ID',

    -- 수유 정보
    amount_consumed DECIMAL(7,2) NOT NULL COMMENT '먹은 양 (g)',
    temperature DECIMAL(4,1) COMMENT '분유 온도 (°C)',
    duration INT COMMENT '수유 시간 (초)',

    -- 시간 정보
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '수유 완료 시간',

    -- 추가 정보
    notes TEXT COMMENT '메모',

    FOREIGN KEY (session_id) REFERENCES feeding_sessions(session_id) ON DELETE CASCADE,
    FOREIGN KEY (baby_id) REFERENCES babies(baby_id) ON DELETE CASCADE,
    FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE,
    INDEX idx_baby_timestamp (baby_id, timestamp),
    INDEX idx_device_id (device_id),
    INDEX idx_session_id (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='완료된 수유 기록';

-- ============================
-- 6. formula_inventory (분유 재고 테이블)
-- ============================
CREATE TABLE formula_inventory (
    inventory_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL COMMENT '사용자 ID',
    current_stock DECIMAL(8,2) DEFAULT 0 COMMENT '현재 재고 (g)',
    daily_average DECIMAL(7,2) COMMENT '일 평균 소비량 (g)',
    days_remaining INT COMMENT '남은 일수 (예측)',
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='분유 재고 관리';

-- ============================
-- 7. feeding_stats_daily (일별 통계 테이블)
-- ============================
CREATE TABLE feeding_stats_daily (
    stat_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    baby_id INT NOT NULL COMMENT '아기 ID',
    date DATE NOT NULL COMMENT '날짜',

    -- 수유 통계
    total_feedings INT DEFAULT 0 COMMENT '총 수유 횟수',
    total_amount DECIMAL(8,2) DEFAULT 0 COMMENT '총 수유량 (g)',
    avg_amount DECIMAL(7,2) COMMENT '평균 수유량 (g)',
    avg_temperature DECIMAL(4,1) COMMENT '평균 온도 (°C)',
    avg_duration INT COMMENT '평균 수유 시간 (초)',

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (baby_id) REFERENCES babies(baby_id) ON DELETE CASCADE,
    UNIQUE KEY unique_baby_date (baby_id, date),
    INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='일별 수유 통계';

-- ============================
-- 테스트 데이터 삽입
-- ============================

-- 테스트 사용자
INSERT INTO users (email, password, name) VALUES
('test@example.com', '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890', '홍길동'),
('rudwo@yonsei.ac.kr', '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890', '경재');

-- 테스트 아기
INSERT INTO babies (user_id, name, birth_date, gender, weight_at_birth) VALUES
(1, '민준', '2024-08-15', 'M', 3.45),
(2, '서연', '2024-09-20', 'F', 3.20);

-- 테스트 기기
INSERT INTO devices (user_id, device_uuid, device_name, bottle_weight) VALUES
(1, 'ESP32-AA:BB:CC:DD:EE:FF', '거실 스마트 젖병', 85.5),
(2, 'ESP32-11:22:33:44:55:66', '안방 스마트 젖병', 90.0);

-- 테스트 분유 재고
INSERT INTO formula_inventory (user_id, current_stock, daily_average) VALUES
(1, 3500, 420),
(2, 4200, 380);

-- ============================
-- 완료
-- ============================
SELECT '✅ Database schema created successfully!' AS status;