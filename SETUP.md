# 🍼 Smart Bottle 시스템 설정 가이드

## ✅ 완료된 작업 (2025-11-13)

### 1. 데이터베이스 재설계
- ✅ 시나리오 기반 스키마 설계
- ✅ 7개 테이블 생성 (users, babies, devices, feeding_sessions, feeding_records, formula_inventory, feeding_stats_daily)
- ✅ 테스트 데이터 삽입
- ✅ 초기화 스크립트 (`npm run db:init`)

### 2. Socket.IO 서버 구축
- ✅ Socket.IO 설치 및 통합
- ✅ 실시간 양방향 통신 구현
- ✅ 8개 소켓 이벤트 핸들러
- ✅ 기기/클라이언트 연결 관리
- ✅ 수유 프로세스 자동화

### 3. Arduino 코드 수정
- ✅ Socket.IO 클라이언트 통합
- ✅ 상태 머신 구현 (IDLE → READY → BOTTLE_PLACED → FEEDING → COMPLETED)
- ✅ 자동 무게 감지 및 온도 측정
- ✅ LED 피드백 시스템
- ✅ 수유 시나리오 자동화

### 4. 기기 관리 페이지
- ✅ 기기 목록 조회 (/devices)
- ✅ 기기 등록 (/devices/register)
- ✅ 기기 정보 수정 (/devices/:id/edit)
- ✅ 분유통 무게 설정 기능
- ✅ RESTful API (CRUD)

---

## 🚀 시스템 시작 방법

### 1단계: 데이터베이스 초기화
```bash
cd /Users/kkj/Desktop/Develop/kkj/smart_bottle
npm run db:init
```

### 2단계: 서버 실행
```bash
# 개발 모드
npm run dev

# 운영 모드
npm run prod
```

서버 실행 후 확인:  
- 메인: http://localhost:3000
- 대시보드: http://localhost:3000/dashboard
- 기기 관리: http://localhost:3000/devices

### 3단계: Arduino 업로드
1. Arduino IDE 열기
2. `/Users/kkj/Documents/Arduino/smart_bottle/smart_bottle.ino` 파일 열기
3. **서버 IP 주소 수정** (16번 라인):
   ```cpp
   const char* socketServer = "YOUR_SERVER_IP";  // 실제 IP로 변경
   ```
4. 보드: ESP32 Dev Module 선택
5. 업로드

### 4단계: 기기 등록
1. ESP32 시리얼 모니터에서 `Device UUID` 확인
2. 웹사이트 → 기기 관리 → 새 기기 등록
3. UUID, 기기 이름, 분유통 무게 입력
4. 등록 완료

---

## 📊 수유 프로세스 테스트

### 준비물
- ESP32 + 센서 (DS18B20, HX711)
- 빈 분유통
- 분유

### 테스트 순서
1. **기기 연결**
   - ESP32 전원 켜기
   - 시리얼 모니터에서 "✅ Socket.IO Connected" 확인
   - 웹사이트에서 기기 온라인 상태 확인

2. **수유 시작**
   - 버튼1 누르기
   - 시리얼 모니터: "🍼 Feeding session ready"
   - 웹사이트: 수유 세션 생성 확인

3. **분유통 올리기**
   - 분유통(분유 포함)을 무게 센서에 올리기
   - 시리얼 모니터: 무게/온도 측정, LED 상태 확인
   - 웹사이트: 실시간 무게/온도 표시

4. **수유 시작 (들어올리기)**
   - 분유통 들어올리기
   - 시리얼 모니터: "👶 Feeding pickup"
   - 웹사이트: 수유 진행 중 표시

5. **수유 종료 (다시 내리기)**
   - 분유통 다시 내려놓기
   - 시리얼 모니터: "✅ Feeding completed: 먹은 양=XXg"
   - 웹사이트: 수유 기록 저장 확인

---

## 🗄️ 데이터베이스 구조

### devices 테이블 (핵심)
```sql
device_id         -- 기기 ID (PK)
user_id           -- 사용자 ID (FK)
device_uuid       -- ESP32 MAC 주소 (UNIQUE)
device_name       -- 기기 이름
bottle_weight     -- 분유통 무게 (g) ⭐ 중요!
is_online         -- 온라인 상태
socket_id         -- 소켓 ID
last_connected    -- 마지막 연결 시간
```

**bottle_weight가 중요한 이유**:
- 측정 무게 = 분유 + 분유통
- 먹은 양 = (초기 무게 - 최종 무게) - bottle_weight
- **정확한 설정 필수!**

### feeding_sessions 테이블
```sql
session_id            -- 세션 ID (PK)
device_id, baby_id    -- FK
status                -- ready/bottle_placed/in_progress/completed
button_pressed_at     -- 버튼 누른 시간
bottle_placed_at      -- 분유통 올린 시간
feeding_started_at    -- 수유 시작 시간
feeding_ended_at      -- 수유 종료 시간
initial_weight        -- 초기 무게
final_weight          -- 최종 무게
amount_consumed       -- 먹은 양
temperature           -- 온도
duration              -- 소요 시간
```

---

## 🔌 Socket.IO 이벤트

### 기기 → 서버
| 이벤트 | 데이터 | 설명 |
|--------|--------|------|
| `device:connect` | `{ device_uuid }` | 기기 연결 |
| `feeding:start` | `{ device_uuid, baby_id }` | 수유 시작 버튼 |
| `bottle:placed` | `{ session_id, weight, temperature }` | 분유통 올림 |
| `feeding:pickup` | `{ session_id }` | 분유통 들어올림 |
| `feeding:end` | `{ session_id, final_weight }` | 수유 종료 |

### 서버 → 기기
| 이벤트 | 데이터 | 설명 |
|--------|--------|------|
| `device:connected` | `{ success, message }` | 연결 확인 |
| `feeding:ready` | `{ session_id }` | 세션 생성 |
| `led:green` | `{ message }` | 초록 LED (적정 온도) |
| `led:red` | `{ message }` | 빨간 LED (부적절) |
| `feeding:completed` | `{ amount_consumed, duration }` | 수유 완료 |

---

## 📂 프로젝트 구조

```
smart_bottle/
├── database/
│   ├── schema.sql           # DB 스키마
│   ├── init.js              # 초기화 스크립트
│   └── README.md            # DB 문서
│
├── app/
│   ├── controllers/
│   │   └── device_controller.js
│   ├── services/
│   │   ├── device_service.js
│   │   └── feeding_service.js
│   ├── socket/
│   │   └── socket_handler.js
│   └── views/
│       └── devices/
│           ├── index.ejs    # 기기 목록
│           ├── register.ejs # 기기 등록
│           └── edit.ejs     # 기기 수정
│
├── routes/
│   └── device_route.js      # 기기 라우트
│
├── bin/
│   └── www                  # Socket.IO 통합
│
└── config/
    ├── database.js
    ├── logger.js
    └── env.js
```

---

## 🔧 필요한 Arduino 라이브러리

Arduino IDE 라이브러리 관리자에서 설치:
- ✅ SocketIOclient (by Links2004)
- ✅ ArduinoJson (by Benoit Blanchon)
- ✅ DHT sensor library (by Adafruit)
- ✅ Adafruit Unified Sensor
- ✅ OneWire (by Paul Stoffregen)
- ✅ DallasTemperature (by Miles Burton)
- ✅ Adafruit MLX90614 Library
- ✅ DFRobot_HX711_I2C

---

## 🐛 트러블슈팅

### 1. Socket.IO 연결 실패
**증상**: Arduino 시리얼 모니터에 "❌ Socket.IO Disconnected"
**해결**:
- 서버 IP 주소 확인 (Arduino 16번 라인)
- 서버 실행 중인지 확인 (`npm run dev`)
- 같은 네트워크인지 확인
- 방화벽 3000번 포트 허용

### 2. 무게 감지 안 됨
**증상**: 분유통을 올려도 반응 없음
**해결**:
- HX711 연결 확인 (I2C SDA=21, SCL=22)
- `scale.peel()` 재실행 (영점 조정)
- `WEIGHT_THRESHOLD` 값 조정 (Arduino 69번 라인)

### 3. 온도 측정 오류
**증상**: 온도가 -127°C 또는 85°C
**해결**:
- DS18B20 연결 확인 (GPIO 5)
- 4.7kΩ 풀업 저항 확인
- 전원 공급 확인

### 4. 먹은 양 계산 오류
**증상**: 음수 또는 비정상적으로 큰 값
**해결**:
- **분유통 무게 재설정** (가장 중요!)
- 웹사이트 → 기기 관리 → 기기 수정
- 빈 분유통 무게 정확히 측정하여 입력

---

## 📝 다음 단계 (남은 작업)

### 5단계: 실시간 대시보드 연동 (진행 예정)
- [ ] 대시보드에 Socket.IO 클라이언트 추가
- [ ] 실시간 수유 진행 상태 표시
- [ ] 실시간 차트 업데이트
- [ ] 알림 시스템 추가

### 추가 기능 (선택사항)
- [ ] 사용자 인증 (로그인/회원가입)
- [ ] 다중 아기 관리
- [ ] 수유 알림 (시간 기반)
- [ ] 데이터 내보내기 (CSV, PDF)
- [ ] 모바일 앱 연동

---

## 📞 문의 및 지원

**담당자**: 경재
**최종 업데이트**: 2025-11-13
**버전**: v2.0

---

## 🎉 축하합니다!

Smart Bottle IoT 시스템의 핵심 기능이 완성되었습니다!
이제 실제 하드웨어로 테스트하고 수유 데이터를 자동으로 기록해보세요.
