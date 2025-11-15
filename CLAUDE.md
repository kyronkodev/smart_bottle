# 🍼 Smart Bottle IoT - Claude AI Development Guide

> **프로젝트**: 스마트 젖병 모니터링 시스템
> **버전**: v1.1
> **최종 업데이트**: 2025-11-07
> **담당자**: 경재

---

## 📋 프로젝트 개요

### 핵심 미션
"데이터로 부모의 불안을 덜어주는 스마트 육아 보조 시스템"

### 목적
아기의 수유 데이터를 자동으로 기록하고, 웹 대시보드를 통해 부모가 쉽게 수유 패턴과 통계를 확인할 수 있도록 지원하는 IoT 시스템 구축

### 주요 가치 제안
- **자동화**: 수동 기록의 번거로움 제거
- **인사이트**: 데이터 기반 수유 패턴 분석
- **안심**: 적정 온도 및 수유량 모니터링
- **예측**: 분유 재고 관리 및 소진 예측

---

## 🏗️ 시스템 아키텍처

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│  Hardware Layer │         │  Backend Layer   │         │ Frontend Layer  │
├─────────────────┤         ├──────────────────┤         ├─────────────────┤
│ ESP32/Arduino   │─WiFi──→ │ Node.js + Express│─HTTP──→ │ EJS Dashboard   │
│ + Sensors       │         │ + MySQL Database │         │ + Custom CSS    │
│ (Temp, Weight)  │         │ + REST API       │         │ + JavaScript    │
└─────────────────┘         └──────────────────┘         └─────────────────┘
```

---

## 🔧 기술 스택

### Backend (현재 프로젝트)
```yaml
Runtime: Node.js 18+
Framework: Express.js
Database: MySQL 8.0
Host: 211.192.7.222:3306
Database Name: smart_bottle
User: rudwo
Password: rudwo1!

Dependencies:
  - express: ~4.16.1
  - mysql2: ^3.6.0
  - cors: ^2.8.5
  - dotenv: ^16.0.3
  - winston: ^3.8.2
  - body-parser: ^1.20.1
  - ejs: ^3.1.8
  - express-ejs-layouts: ^2.5.1
```

### Frontend (현재 구현됨)
```yaml
Template Engine: EJS
Styling: Custom CSS with Design System
JavaScript: Vanilla JS
Design System: Yonsei Blue based
```

### Hardware (예정)
```yaml
MCU: ESP32 or Arduino + ESP8266
Sensors:
  - DS18B20: Temperature sensor
  - HX711 + Load Cell: Weight measurement
  - RGB LED: Status indicator
  - Buttons: Control interface
```

---

## 📁 프로젝트 구조

```
smart_bottle/
├── app.js                      # Express 애플리케이션 진입점
├── package.json                # 의존성 관리
├── service.config.js           # PM2 클러스터 설정
├── CLAUDE.md                   # 프로젝트 가이드 (본 문서)
│
├── bin/
│   └── www                     # 서버 시작 스크립트
│
├── config/
│   ├── env.js                  # 환경변수 로더
│   ├── database.js             # MySQL 연결 풀 설정
│   ├── logger.js               # Winston 로거 설정
│   ├── .env.development        # 개발 환경변수
│   └── .env.production         # 운영 환경변수
│
├── routes/
│   ├── index_route.js          # 메인 페이지 라우트
│   ├── api_route.js            # API 라우트
│   ├── admin_route.js          # 관리자 라우트
│   └── dashboard_route.js      # 대시보드 라우트 (부모용)
│
├── app/
│   ├── controllers/            # 비즈니스 로직 컨트롤러
│   ├── models/                 # 데이터 모델
│   ├── services/               # 서비스 레이어
│   └── views/                  # EJS 템플릿
│       ├── index.ejs
│       ├── error.ejs
│       ├── dashboard/
│       │   └── index.ejs       # 부모용 대시보드
│       ├── layouts/
│       │   ├── full.ejs
│       │   └── admin.ejs
│       └── admin/
│           └── index.ejs
│
├── assets/
│   ├── css/
│   │   └── dashboard.css       # 대시보드 스타일 (Design System)
│   └── js/
│       └── dashboard.js        # 대시보드 JavaScript
│
├── middleware/                 # 커스텀 미들웨어
├── logs/                       # 애플리케이션 로그
└── public/                     # 공개 파일
```

---

## 🎨 디자인 시스템 (Yonsei Blue)

### 컬러 팔레트
```css
/* Primary Colors - Yonsei Blue System */
--color-primary: #003876;           /* Yonsei Blue (메인) */
--color-primary-light: #0052A3;     /* Lighter Blue */
--color-primary-lighter: #E8F1F8;   /* Very Light Blue (배경) */
--color-primary-dark: #002855;      /* Darker Blue */

/* Text Colors */
--color-text-primary: #1A1F24;      /* 메인 텍스트 */
--color-text-secondary: #5A6872;    /* 서브 텍스트 */
--color-text-tertiary: #778997;     /* 보조 텍스트 */
--color-text-inverse: #FFFFFF;      /* 반전 텍스트 */

/* Neutral Colors */
--color-gray-50: #F8FAFB;           /* 배경 */
--color-gray-100 ~ 900: ...         /* 체계적인 그레이 스케일 */

/* Status Colors */
--color-success: #10B981;           /* 성공/진행 */
--color-warning: #F59E0B;           /* 경고 */
--color-error: #EF4444;             /* 에러 */
--color-info: #3B82F6;              /* 정보 */
```

### Spacing System (8px 기반)
```css
--spacing-1: 4px
--spacing-2: 8px
--spacing-3: 12px
--spacing-4: 16px
--spacing-5: 20px
--spacing-6: 24px
--spacing-8: 32px
--spacing-10: 40px
--spacing-12: 48px
--spacing-16: 64px
```

### Typography Scale
```css
--font-size-xs: 12px
--font-size-sm: 14px
--font-size-base: 16px
--font-size-lg: 18px
--font-size-xl: 20px
--font-size-2xl: 24px
--font-size-3xl: 32px
--font-size-4xl: 40px

--font-weight-normal: 400
--font-weight-medium: 500
--font-weight-semibold: 600
--font-weight-bold: 700
```

### Border Radius
```css
--radius-sm: 6px
--radius-md: 8px
--radius-lg: 12px
--radius-xl: 16px
--radius-2xl: 24px (카드)
--radius-full: 9999px (원형)
```

### Shadows
```css
--shadow-sm: 미세한 그림자
--shadow-md: 기본 그림자
--shadow-lg: 강조 그림자
--shadow-xl: 최대 그림자
```

---

## 🗄️ 데이터베이스 스키마

### 1. users (사용자)
```sql
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(50) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email)
);
```

### 2. babies (아기 정보)
```sql
CREATE TABLE babies (
    baby_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    name VARCHAR(50) NOT NULL,
    birth_date DATE NOT NULL,
    gender ENUM('M', 'F', 'U') DEFAULT 'U',
    weight_at_birth DECIMAL(5,2),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
);
```

### 3. feeding_records (수유 기록)
```sql
CREATE TABLE feeding_records (
    feeding_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    baby_id INT NOT NULL,
    weight_before DECIMAL(6,2),
    weight_after DECIMAL(6,2),
    amount_consumed DECIMAL(6,2),
    temperature DECIMAL(4,1),
    duration INT COMMENT '수유 시간(분)',
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes VARCHAR(255),
    FOREIGN KEY (baby_id) REFERENCES babies(baby_id) ON DELETE CASCADE,
    INDEX idx_baby_timestamp (baby_id, timestamp)
);
```

### 4. formula_inventory (분유 재고)
```sql
CREATE TABLE formula_inventory (
    inventory_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    current_stock DECIMAL(7,2) DEFAULT 0,
    daily_average DECIMAL(6,2),
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
);
```

### 5. feeding_stats_daily (일별 통계)
```sql
CREATE TABLE feeding_stats_daily (
    stat_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    baby_id INT NOT NULL,
    date DATE NOT NULL,
    total_feedings INT DEFAULT 0,
    total_amount DECIMAL(8,2) DEFAULT 0,
    avg_amount DECIMAL(6,2),
    avg_temperature DECIMAL(4,1),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (baby_id) REFERENCES babies(baby_id) ON DELETE CASCADE,
    UNIQUE KEY unique_baby_date (baby_id, date),
    INDEX idx_date (date)
);
```

---

## 🔌 API 엔드포인트 설계

### 수유 기록 (Feeding Records)
```
POST   /api/feedings              # 새 수유 기록 등록
GET    /api/feedings              # 전체 기록 조회 (페이징)
GET    /api/feedings/latest       # 최근 10개 수유 기록
GET    /api/feedings/current      # 현재 진행 중인 수유
GET    /api/feedings/:id          # 특정 수유 기록 조회
PUT    /api/feedings/:id          # 수유 기록 수정
DELETE /api/feedings/:id          # 수유 기록 삭제
```

### 통계 (Statistics)
```
GET    /api/stats/today           # 오늘 통계
GET    /api/stats/daily           # 일별 통계
GET    /api/stats/weekly          # 주별 통계
GET    /api/stats/monthly         # 월별 통계
GET    /api/stats/compare         # 또래 비교 통계
```

### 아기 관리 (Babies)
```
POST   /api/babies                # 아기 등록
GET    /api/babies                # 아기 목록 조회
GET    /api/babies/:id            # 아기 정보 조회
PUT    /api/babies/:id            # 아기 정보 수정
DELETE /api/babies/:id            # 아기 정보 삭제
```

### 분유 재고 (Formula Inventory)
```
POST   /api/formula/stock         # 분유 재고 업데이트
GET    /api/formula/stock         # 현재 재고 조회
GET    /api/formula/prediction    # 분유 소진 예측
```

### 사용자 (Users)
```
POST   /api/auth/register         # 회원가입
POST   /api/auth/login            # 로그인
POST   /api/auth/logout           # 로그아웃
GET    /api/users/profile         # 프로필 조회
PUT    /api/users/profile         # 프로필 수정
```

### 대시보드 (Dashboard)
```
GET    /dashboard                 # 부모용 대시보드 페이지
GET    /admin                     # 관리자 대시보드
```

---

## 🎯 주요 기능 명세

### 1. 부모용 대시보드
현재 구현된 기능:

#### 아기 정보 카드
- 아기 이름, 생후 일수, 성별, 출생 체중
- 마지막 수유 시간 표시

#### 실시간 수유 진행 상태
- 수유 진행 중 표시 (애니메이션)
- 현재 수유량 / 목표량
- 실시간 온도 모니터링
- 프로그레스 바

#### 오늘의 통계 (4개 카드)
1. 총 수유량 (목표 대비)
2. 수유 횟수 (평균 간격)
3. 온도 준수율
4. 평균 수유량 (1회당)

#### AI 분석 리포트
- 건강한 수유 패턴 분석
- 또래 평균 대비 비교
- 온도 관리 상태

#### 수유 기록 테이블
- 시간별 수유 기록
- 필터 기능 (오늘/어제/이번 주)
- 수유량, 소요 시간, 온도, 상태

#### 또래 비교
- 생후 주수별 평균 비교
- 일일 수유량, 수유 간격, 1회 평균량
- 우리 아기 vs 또래 평균

### 2. 하드웨어 센서 데이터 수신
```javascript
// POST /api/feedings
{
  "baby_id": 1,
  "weight_before": 250.5,
  "weight_after": 180.3,
  "temperature": 38.5,
  "duration": 15
}
```

### 3. 수유 패턴 분석
- 일별/주별/월별 수유량 추이
- 시간대별 수유 빈도 분석
- 평균 수유 간격 계산
- 또래 아기 평균 대비 비교

### 4. 분유 재고 예측
```javascript
// 예측 알고리즘
days_remaining = current_stock / daily_average_consumption
predicted_run_out_date = today + days_remaining
```

---

## 🚀 개발 가이드라인

### 코딩 컨벤션
```javascript
// 1. async/await 사용
const getFeedings = async (req, res) => {
    try {
        const [rows] = await mysqlPool.query('SELECT * FROM feeding_records');
        res.json({ success: true, data: rows });
    } catch (error) {
        logger.writeLog('error', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};

// 2. 에러 핸들링
// - try-catch 블록 필수
// - 로그 기록 (winston 사용)
// - 적절한 HTTP 상태 코드 반환

// 3. 응답 형식 통일
{
    "success": true/false,
    "data": {},
    "message": "",
    "error": ""
}
```

### 데이터베이스 쿼리 가이드
```javascript
// 1. Prepared Statement 사용 (SQL Injection 방지)
const [rows] = await mysqlPool.query(
    'SELECT * FROM feeding_records WHERE baby_id = ? AND timestamp >= ?',
    [babyId, startDate]
);

// 2. 트랜잭션 사용 (여러 테이블 업데이트 시)
const connection = await mysqlPool.getConnection();
try {
    await connection.beginTransaction();
    await connection.query('INSERT INTO feeding_records ...');
    await connection.query('UPDATE feeding_stats_daily ...');
    await connection.commit();
} catch (error) {
    await connection.rollback();
    throw error;
} finally {
    connection.release();
}
```

### CSS 작성 가이드
```css
/* 1. CSS 변수 사용 */
.card {
    background: var(--color-white);
    padding: var(--spacing-6);
    border-radius: var(--radius-2xl);
    box-shadow: var(--shadow-sm);
}

/* 2. 일관된 Spacing */
/* 8px 기반 시스템 사용 */

/* 3. 색상 사용 */
/* Primary: Yonsei Blue (#003876) 계열만 사용 */
/* Text: 3단계 (Primary, Secondary, Tertiary) */

/* 4. Transition */
transition: all var(--transition-base);
```

### 보안 고려사항
```yaml
인증/인가:
  - JWT 토큰 기반 인증 구현 예정
  - bcrypt를 통한 비밀번호 암호화
  - CORS 설정으로 허용된 도메인만 접근

데이터 검증:
  - 입력값 sanitization
  - 데이터 타입 및 범위 검증
  - SQL Injection 방지 (Prepared Statement)

환경변수:
  - .env 파일로 민감 정보 관리
  - 절대 Git에 커밋하지 않음
```

---

## 📊 개발 로드맵

### Phase 1: 백엔드 개발 (2주)
- [x] 프로젝트 구조 설정
- [x] MySQL 데이터베이스 연결
- [x] 부모용 대시보드 UI 구현
- [x] 디자인 시스템 구축 (Yonsei Blue)
- [ ] 데이터베이스 스키마 생성
- [ ] API 엔드포인트 구현
  - [ ] 수유 기록 CRUD
  - [ ] 통계 API
  - [ ] 사용자 인증
- [ ] 단위 테스트 작성

### Phase 2: 하드웨어 연동 (1주)
- [ ] ESP32 펌웨어 개발
- [ ] 센서 데이터 수집
- [ ] Wi-Fi 통신 구현
- [ ] API 전송 로직 구현

### Phase 3: 프론트엔드 고도화 (2주)
- [x] 대시보드 UI 기본 구현
- [ ] 실시간 데이터 연동
- [ ] 차트 시각화 (Recharts 또는 Chart.js)
- [ ] 수유 기록 히스토리 페이지
- [ ] 반응형 디자인 최적화

### Phase 4: 통합 및 테스트 (1주)
- [ ] 전체 시스템 통합 테스트
- [ ] 성능 최적화
- [ ] 버그 수정
- [ ] 배포 준비

---

## 🛠️ 개발 환경 설정

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경변수 설정
```bash
# config/.env.development 파일 확인
DATABASE_HOST=211.192.7.222
DATABASE_USER=rudwo
DATABASE_PASSWORD=rudwo1!
DATABASE_PORT=3306
DATABASE_DATABASE=smart_bottle
PORT=3000
```

### 3. 서버 실행
```bash
# 개발 모드
npm run dev

# 운영 모드
npm run prod

# PM2로 실행
npm run pm2:prod
```

### 4. 접속 URL
```
메인 페이지: http://localhost:3000/
대시보드: http://localhost:3000/dashboard
관리자: http://localhost:3000/admin
API 테스트: http://localhost:3000/api/test
```

### 5. 데이터베이스 초기화
```bash
# MySQL 접속
mysql -h 211.192.7.222 -u rudwo -p smart_bottle

# 스키마 생성 스크립트 실행
source database/schema.sql
```

---

## 📝 Claude AI 작업 시 참고사항

### 개발 우선순위
1. **안정성**: 에러 핸들링 및 로깅 철저히
2. **보안**: SQL Injection, XSS 등 취약점 방지
3. **성능**: 쿼리 최적화, 인덱스 활용
4. **확장성**: 모듈화 및 재사용 가능한 코드 작성
5. **일관성**: 디자인 시스템 준수

### 코드 작성 시 체크리스트
- [ ] async/await 사용
- [ ] try-catch 에러 핸들링
- [ ] winston 로거로 로그 기록
- [ ] Prepared Statement로 SQL 쿼리
- [ ] 응답 형식 통일 (success, data, message)
- [ ] 적절한 HTTP 상태 코드 반환
- [ ] CSS 변수 사용 (디자인 시스템 준수)
- [ ] 8px 기반 spacing 사용
- [ ] Yonsei Blue 컬러 시스템 준수
- [ ] 주석 작성 (함수 목적, 파라미터 설명)

### 파일 생성 규칙
```
routes/          : *_route.js
controllers/     : *_controller.js
models/          : *_model.js
services/        : *_service.js
middleware/      : *_middleware.js
views/           : *.ejs
assets/css/      : *.css (kebab-case)
assets/js/       : *.js (kebab-case)
```

### 디자인 시스템 준수
- **컬러**: Yonsei Blue 계열만 사용
- **Spacing**: 8px 기반 시스템 (4, 8, 12, 16, 20, 24, 32...)
- **Typography**: 정의된 font-size, weight 사용
- **Border Radius**: 정의된 radius 값 사용
- **Shadow**: 정의된 shadow 값 사용
- **Transition**: 정의된 transition 속도 사용

---

## 🔍 참고 자료

### 프로젝트 참조
- 참조 프로젝트: `/Users/kkj/Desktop/Develop/Breeze/thebreeze_group_ware`
- 패턴 및 구조 참고용

### 기술 문서
- [Node.js 공식 문서](https://nodejs.org/docs/)
- [Express.js 가이드](https://expressjs.com/)
- [MySQL2 npm](https://www.npmjs.com/package/mysql2)
- [Winston Logger](https://github.com/winstonjs/winston)
- [EJS 템플릿 엔진](https://ejs.co/)

---

## 📞 연락처

**프로젝트 담당자**: 경재
**최종 업데이트**: 2025-11-07
**버전**: v1.1

---

## 📝 변경 이력

### v1.1 (2025-11-07)
- 부모용 대시보드 UI 구현 완료
- Yonsei Blue 기반 디자인 시스템 구축
- CSS 변수를 활용한 체계적인 스타일링
- 8px 기반 spacing 시스템 도입
- 반응형 디자인 적용
- EJS 템플릿 엔진 사용

### v1.0 (2025-11-07)
- 프로젝트 초기 설정
- MySQL 데이터베이스 연결
- 기본 라우트 구조 생성
- 환경 설정 완료

---

> 이 문서는 Claude AI가 프로젝트를 이해하고 효율적으로 개발을 지원하기 위한 가이드입니다.
