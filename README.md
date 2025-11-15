# 🍼 Smart Bottle IoT - 스마트 젖병 모니터링 시스템

> 데이터로 부모의 불안을 덜어주는 스마트 육아 보조 시스템

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.16+-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/License-Private-red)](LICENSE)

---

## 📋 프로젝트 개요

아기의 수유 데이터를 자동으로 기록하고, 웹 대시보드를 통해 부모가 쉽게 수유 패턴과 통계를 확인할 수 있도록 지원하는 IoT 시스템입니다.

### 주요 기능

- ✅ **자동 수유 기록**: 센서를 통한 자동 측정 및 기록
- ✅ **실시간 모니터링**: 현재 수유 진행 상황 실시간 추적
- ✅ **데이터 분석**: 수유 패턴 분석 및 통계 제공
- ✅ **온도 관리**: 적정 온도 모니터링 및 알림
- ✅ **분유 재고 관리**: 소비량 추적 및 소진 예측
- ✅ **또래 비교**: 생후 주수별 평균 데이터 비교

### 핵심 가치

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

**상세 아키텍처 문서**: [docs/architecture.md](docs/architecture.md)

### 기술 스택

#### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.16+
- **Database**: MySQL 8.0
- **Logger**: Winston 3.8+
- **Process Manager**: PM2 Cluster Mode

#### Frontend
- **Template Engine**: EJS 3.1+
- **CSS**: Custom CSS (Yonsei Blue Design System)
- **JavaScript**: Vanilla ES6+
- **Design**: 반응형 디자인, 8px spacing system

#### Hardware (예정)
- **MCU**: ESP32 / Arduino + ESP8266
- **Sensors**: DS18B20 (온도), HX711 + Load Cell (무게)
- **Output**: RGB LED (상태 표시)
- **Communication**: WiFi (HTTP)

---

## 📁 프로젝트 구조

```
smart_bottle/
├── app.js                      # Express 애플리케이션 진입점
├── package.json                # 의존성 관리
├── service.config.js           # PM2 클러스터 설정
├── CLAUDE.md                   # AI 개발 가이드
├── README.md                   # 프로젝트 개요 (본 문서)
│
├── bin/
│   └── www                     # 서버 시작 스크립트
│
├── config/
│   ├── env.js                  # 환경변수 로더
│   ├── database.js             # MySQL 연결 풀
│   ├── logger.js               # Winston 로거
│   └── .env.*                  # 환경변수 파일
│
├── routes/
│   ├── index_route.js          # 메인 라우트
│   ├── api_route.js            # API 라우트
│   ├── admin_route.js          # 관리자 라우트
│   └── dashboard_route.js      # 대시보드 라우트
│
├── app/
│   ├── controllers/            # 비즈니스 로직
│   ├── models/                 # 데이터 모델
│   ├── services/               # 서비스 레이어
│   └── views/                  # EJS 템플릿
│
├── assets/
│   ├── css/                    # 스타일시트
│   └── js/                     # JavaScript
│
├── docs/
│   └── architecture.md         # 시스템 아키텍처 문서
│
├── middleware/                 # 커스텀 미들웨어
├── logs/                       # 로그 파일
└── public/                     # 공개 파일
```

---

## 🚀 시작하기

### 사전 요구사항

- Node.js 18+ LTS
- MySQL 8.0+
- npm 또는 yarn

### 설치

```bash
# 1. 저장소 클론
git clone <repository-url>
cd smart_bottle

# 2. 의존성 설치
npm install

# 3. 환경변수 설정
cp config/.env.development.example config/.env.development
# config/.env.development 파일 편집

# 4. 데이터베이스 설정
mysql -h <host> -u <user> -p <database> < database/schema.sql
```

### 실행

```bash
# 개발 모드
npm run dev

# 운영 모드
npm run prod

# PM2 클러스터 모드
npm run pm2:prod
```

### 접속

- **메인 페이지**: http://localhost:3000/
- **부모 대시보드**: http://localhost:3000/dashboard
- **관리자 페이지**: http://localhost:3000/admin
- **API 테스트**: http://localhost:3000/api/test

---

## 📊 주요 화면

### 부모용 대시보드

- **아기 정보 카드**: 이름, 생후 일수, 성별, 체중
- **실시간 수유 상태**: 진행 중인 수유 모니터링
- **오늘의 통계**: 수유량, 횟수, 온도 준수율
- **AI 분석 리포트**: 수유 패턴 분석 및 또래 비교
- **수유 기록 테이블**: 시간별 상세 기록

---

## 🎨 디자인 시스템

**Yonsei Blue 기반 디자인 시스템**

### 컬러 팔레트
- **Primary**: #003876 (Yonsei Blue)
- **Primary Light**: #0052A3
- **Primary Lighter**: #E8F1F8 (배경)
- **Primary Dark**: #002855

### Spacing System
- 8px 기반 시스템 (4, 8, 12, 16, 20, 24, 32, 40, 48, 64)

### Typography
- Font Size: 12px ~ 40px (체계적인 스케일)
- Font Weight: 400, 500, 600, 700

### Components
- Border Radius: 6px ~ 24px
- Shadows: 4단계 (sm, md, lg, xl)
- Transitions: 150ms ~ 300ms

---

## 🔌 API 엔드포인트

### 수유 기록
```
POST   /api/feedings              # 새 수유 기록 등록
GET    /api/feedings              # 전체 기록 조회
GET    /api/feedings/latest       # 최근 10개 기록
GET    /api/feedings/current      # 현재 진행 중인 수유
GET    /api/feedings/:id          # 특정 기록 조회
PUT    /api/feedings/:id          # 수유 기록 수정
DELETE /api/feedings/:id          # 수유 기록 삭제
```

### 통계
```
GET    /api/stats/today           # 오늘 통계
GET    /api/stats/daily           # 일별 통계
GET    /api/stats/weekly          # 주별 통계
GET    /api/stats/monthly         # 월별 통계
GET    /api/stats/compare         # 또래 비교 통계
```

### 아기 관리
```
POST   /api/babies                # 아기 등록
GET    /api/babies                # 아기 목록 조회
GET    /api/babies/:id            # 아기 정보 조회
PUT    /api/babies/:id            # 아기 정보 수정
DELETE /api/babies/:id            # 아기 정보 삭제
```

**전체 API 문서**: [docs/architecture.md#3-api-구조](docs/architecture.md#3-api-구조)

---

## 🗄️ 데이터베이스

### 주요 테이블

- **users**: 사용자 정보
- **babies**: 아기 정보
- **feeding_records**: 수유 기록 (시계열 데이터)
- **formula_inventory**: 분유 재고 관리
- **feeding_stats_daily**: 일별 통계 (집계 데이터)

**ERD 다이어그램**: [docs/architecture.md#4-데이터베이스-erd](docs/architecture.md#4-데이터베이스-erd)

---

## 🛠️ 개발 가이드

### 코딩 컨벤션

```javascript
// 1. async/await 사용
const getData = async (req, res) => {
    try {
        const [rows] = await mysqlPool.query('SELECT * FROM table');
        res.json({ success: true, data: rows });
    } catch (error) {
        logger.writeLog('error', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};

// 2. 응답 형식 통일
{
    "success": true/false,
    "data": {},
    "message": "",
    "error": ""
}
```

### 보안 고려사항

- **인증/인가**: JWT 토큰 기반 (예정)
- **비밀번호**: bcrypt 암호화
- **SQL Injection**: Prepared Statement 사용
- **XSS 방지**: 입력값 sanitization
- **CORS**: 허용 도메인 설정

**상세 개발 가이드**: [CLAUDE.md](CLAUDE.md)

---

## 📈 개발 로드맵

### Phase 1: 백엔드 개발 (2주)
- [x] 프로젝트 구조 설정
- [x] MySQL 데이터베이스 연결
- [x] 부모용 대시보드 UI 구현
- [x] 디자인 시스템 구축
- [ ] API 엔드포인트 구현
- [ ] 단위 테스트 작성

### Phase 2: 하드웨어 연동 (1주)
- [ ] ESP32 펌웨어 개발
- [ ] 센서 데이터 수집
- [ ] Wi-Fi 통신 구현
- [ ] API 전송 로직

### Phase 3: 프론트엔드 고도화 (2주)
- [ ] 실시간 데이터 연동
- [ ] 차트 시각화
- [ ] 수유 기록 히스토리 페이지
- [ ] 반응형 디자인 최적화

### Phase 4: 통합 및 테스트 (1주)
- [ ] 전체 시스템 통합 테스트
- [ ] 성능 최적화
- [ ] 버그 수정
- [ ] 배포 준비

---

## 📚 문서

- [CLAUDE.md](CLAUDE.md) - AI 개발 가이드
- [docs/architecture.md](docs/architecture.md) - 시스템 아키텍처
  - 시스템 아키텍처 다이어그램
  - 데이터 흐름도
  - API 구조
  - 데이터베이스 ERD
  - 배포 아키텍처

---

## 🤝 기여

이 프로젝트는 Private 프로젝트입니다.

---

## 📞 연락처

**프로젝트 담당자**: 경재

---

## 📄 라이선스

Private License

---

## 📝 변경 이력

### v1.1 (2025-11-15)
- 시스템 아키텍처 문서 추가
- README.md 작성
- 5가지 Mermaid 다이어그램 생성

### v1.0 (2025-11-07)
- 부모용 대시보드 UI 구현
- Yonsei Blue 디자인 시스템 구축
- MySQL 데이터베이스 연결
- 프로젝트 초기 설정

---

**Made with ❤️ for Smart Parenting**
