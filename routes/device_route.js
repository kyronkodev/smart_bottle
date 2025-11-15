/**
 * Device Route
 * 기기 관리 라우트
 */

const express = require('express');
const router = express.Router();
const deviceController = require('../app/controllers/device_controller');

// 기기 목록 페이지
router.get('/', deviceController.getDevicesPage);

// 기기 등록 페이지
router.get('/register', deviceController.getRegisterPage);

// 기기 대시보드 페이지 (실시간 수유 모니터링)
router.get('/:device_id/dashboard', deviceController.getDeviceDashboard);

// 기기 수정 페이지
router.get('/:device_id/edit', deviceController.getEditPage);

// API: 기기 목록 조회
router.get('/api/list', deviceController.getDevicesList);

// API: 기기 상세 조회
router.get('/api/:device_id', deviceController.getDeviceDetail);

// API: 기기 등록
router.post('/api/register', deviceController.registerDevice);

// API: 기기 정보 수정
router.put('/api/:device_id', deviceController.updateDevice);

// API: 기기 삭제
router.delete('/api/:device_id', deviceController.deleteDevice);

// API: 무게 센서 영점 조정
router.post('/api/:device_id/tare', deviceController.tareWeightSensor);

// API: 현재 무게 조회
router.get('/api/:device_id/weight', deviceController.getCurrentWeight);

// API: 무게 측정 종료
router.post('/api/:device_id/measure-stop', deviceController.stopMeasurement);

// API: 수유 기록 조회
router.get('/api/:device_id/feedings', deviceController.getFeedingRecords);

module.exports = router;
