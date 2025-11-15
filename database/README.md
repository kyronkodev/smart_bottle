# 📊 Smart Bottle Database Schema v2.0

## 🎯 설계 목적
IoT 기기와 실시간 소켓 통신으로 수유 과정을 자동으로 기록하는 시스템

---

## 📋 시나리오 기반 설계

### 수유 프로세스
```
1. IoT 기기 전원 ON → WiFi 연결 → 서버 소켓 연결
2. 버튼1 누름 → 수유 시작 알림 (status: 'ready')
3. 분유통 올림 → 무게/온도 측정 → 초록불 (적정 온도면 먹어도 됨)
   → (status: 'bottle_placed')
4. 분유통 들어올림 → 수유 시작 (status: 'in_progress')
5. 분유통 다시 내림 → 수유 종료 (status: 'completed')
   → 소요시간, 먹은양 계산 → feeding_records 저장
```

---

## 🗄️ 테이블 구조

### 1. users (사용자)
```sql
user_id         INT PRIMARY KEY
email           VARCHAR(100) UNIQUE
password        VARCHAR(255)
name            VARCHAR(50)
created_at      DATETIME
```

### 2. babies (아기 정보)
```sql
baby_id         INT PRIMARY KEY
user_id         INT FK → users
name            VARCHAR(50)
birth_date      DATE
gender          ENUM('M', 'F', 'U')
weight_at_birth DECIMAL(5,2)
created_at      DATETIME
```

### 3. devices (IoT 기기 정보) ⭐ 핵심 테이블
```sql
device_id       INT PRIMARY KEY
user_id         INT FK → users
device_uuid     VARCHAR(100) UNIQUE    -- ESP32 MAC 주소
device_name     VARCHAR(100)
bottle_weight   DECIMAL(6,2)           -- 빈 분유통 무게 (중요!)
is_online       BOOLEAN
socket_id       VARCHAR(100)           -- 실시간 소켓 ID
last_connected  DATETIME
created_at      DATETIME
```

**bottle_weight의 중요성**:
- 분유통을 올리면 측정 무게 = 분유 + 분유통
- 실제 먹은 양 = (처음 무게 - 마지막 무게) - bottle_weight
- 웹사이트에서 기기 정보 수정을 통해 설정

### 4. feeding_sessions (수유 세션) ⭐ 실시간 진행 상태
```sql
session_id            BIGINT PRIMARY KEY
device_id             INT FK → devices
baby_id               INT FK → babies
status                ENUM('ready', 'bottle_placed', 'in_progress', 'completed', 'cancelled')

-- 시간 정보
button_pressed_at     DATETIME    -- 버튼1 누른 시간
bottle_placed_at      DATETIME    -- 분유통 올린 시간
feeding_started_at    DATETIME    -- 분유통 들어올린 시간
feeding_ended_at      DATETIME    -- 분유통 다시 내린 시간

-- 무게 정보
initial_weight        DECIMAL(7,2)  -- 처음 측정 무게 (분유통 포함)
final_weight          DECIMAL(7,2)  -- 종료 시 무게 (분유통 포함)
amount_consumed       DECIMAL(7,2)  -- 실제 먹은 양

-- 온도 정보
temperature           DECIMAL(4,1)
temperature_safe      BOOLEAN

duration              INT           -- 소요 시간 (초)
created_at            DATETIME
updated_at            DATETIME
```

**status 상태 전이**:
```
ready → bottle_placed → in_progress → completed
                                    → cancelled
```

### 5. feeding_records (완료된 수유 기록)
```sql
feeding_id       BIGINT PRIMARY KEY
session_id       BIGINT FK → feeding_sessions
baby_id          INT FK → babies
device_id        INT FK → devices
amount_consumed  DECIMAL(7,2)
temperature      DECIMAL(4,1)
duration         INT
timestamp        DATETIME
notes            TEXT
```

### 6. formula_inventory (분유 재고)
```sql
inventory_id     INT PRIMARY KEY
user_id          INT FK → users
current_stock    DECIMAL(8,2)
daily_average    DECIMAL(7,2)
days_remaining   INT
last_updated     DATETIME
```

### 7. feeding_stats_daily (일별 통계)
```sql
stat_id          BIGINT PRIMARY KEY
baby_id          INT FK → babies
date             DATE
total_feedings   INT
total_amount     DECIMAL(8,2)
avg_amount       DECIMAL(7,2)
avg_temperature  DECIMAL(4,1)
avg_duration     INT
created_at       DATETIME
updated_at       DATETIME

UNIQUE KEY (baby_id, date)
```

---

## 🔄 데이터 흐름

### 1. 기기 연결
```javascript
// IoT → Server
socket.connect()
→ devices 테이블 업데이트 (is_online = true, socket_id, last_connected)
```

### 2. 수유 시작 (버튼1)
```javascript
socket.emit('feeding:start', { device_uuid, baby_id })
→ feeding_sessions INSERT (status: 'ready')
```

### 3. 분유통 올림
```javascript
socket.emit('bottle:placed', {
  session_id,
  weight: 320.5,  // 분유 + 분유통 무게
  temperature: 38.5
})
→ feeding_sessions UPDATE (
    status: 'bottle_placed',
    initial_weight: 320.5,
    temperature: 38.5,
    temperature_safe: (38.5 >= 37 && 38.5 <= 40)
  )
→ 서버 → IoT: { action: 'led:green' }  // 적정 온도면 초록불
```

### 4. 분유통 들어올림 (수유 시작)
```javascript
socket.emit('feeding:pickup')
→ feeding_sessions UPDATE (
    status: 'in_progress',
    feeding_started_at: NOW()
  )
```

### 5. 분유통 다시 내림 (수유 종료)
```javascript
socket.emit('feeding:end', {
  session_id,
  final_weight: 250.3
})

→ 계산:
  amount_consumed = (initial_weight - final_weight) - bottle_weight
                  = (320.5 - 250.3) - 85.5
                  = 70.2 - 85.5
                  = ... (음수면 에러)

  올바른 계산:
  amount_consumed = initial_weight - final_weight
                  = 320.5 - 250.3 = 70.2g

→ feeding_sessions UPDATE (
    status: 'completed',
    feeding_ended_at: NOW(),
    final_weight: 250.3,
    amount_consumed: 70.2,
    duration: feeding_ended_at - feeding_started_at
  )

→ feeding_records INSERT (완료된 기록 저장)

→ feeding_stats_daily UPDATE (일별 통계 업데이트)
```

---

## 🔧 스키마 실행 방법

### 방법 1: MySQL CLI
```bash
mysql -h 211.192.7.222 -u rudwo -p smart_bottle < database/schema.sql
```

### 방법 2: Node.js 스크립트
```bash
node database/init.js
```

---

## ⚠️ 주의사항

1. **bottle_weight 설정 필수**
   - 처음 기기 등록 후 반드시 빈 분유통 무게 측정 필요
   - 웹사이트 "기기 정보 수정"에서 설정

2. **무게 계산 로직**
   - 분유통 무게는 빼지 않음 (초기 무게, 최종 무게 모두 분유통 포함)
   - 먹은 양 = 초기 무게 - 최종 무게

3. **세션 정리**
   - 오래된 'ready' 상태 세션은 주기적으로 'cancelled'로 변경
   - 'in_progress' 상태가 30분 이상 지속되면 알림

4. **온도 안전 범위**
   - 적정 온도: 37°C ~ 40°C
   - 이 범위에서만 초록불 표시

---

## 📊 인덱스 최적화

성능을 위해 다음 컬럼에 인덱스 생성:
- `devices.device_uuid` (UNIQUE)
- `devices.socket_id`
- `feeding_sessions.status`
- `feeding_sessions.device_id`
- `feeding_records.baby_id, timestamp` (복합 인덱스)
- `feeding_stats_daily.baby_id, date` (UNIQUE 복합 인덱스)

---

## 🚀 다음 단계

1. ✅ 데이터베이스 스키마 생성
2. ⏳ Socket.IO 서버 구축
3. ⏳ Arduino 소켓 통신 코드 수정
4. ⏳ 웹사이트 기기 정보 수정 페이지 추가
5. ⏳ 실시간 대시보드 연동