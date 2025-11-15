/**
 * Device Controller
 * 기기 관리 컨트롤러
 */

const deviceService = require('../services/device_service');
const logger = require('../../config/logger');

/**
 * 기기 목록 페이지
 */
const getDevicesPage = async (req, res) => {
  try {
    // TODO: 실제로는 세션에서 user_id를 가져와야 함
    const user_id = 1; // 테스트용

    const devices = await deviceService.getDevicesByUserId(user_id);

    res.render('devices/index', {
      layout: false,
      title: '기기 관리',
      devices
    });
  } catch (error) {
    logger.writeLog('error', `getDevicesPage error: ${error.message}`);
    res.status(500).render('error', {
      layout: 'layouts/full',
      err: error.message
    });
  }
};

/**
 * 기기 등록 페이지
 */
const getRegisterPage = (req, res) => {
  res.render('devices/register', {
    layout: false,
    title: '기기 등록'
  });
};

/**
 * 기기 대시보드 페이지 (실시간 수유 모니터링)
 */
const getDeviceDashboard = async (req, res) => {
  try {
    const { device_id } = req.params;

    const device = await deviceService.getDeviceById(device_id);

    if (!device) {
      return res.status(404).render('error', {
        layout: 'layouts/full',
        err: 'Device not found'
      });
    }

    res.render('devices/dashboard', {
      layout: false,
      title: `${device.device_name} 대시보드`,
      device
    });
  } catch (error) {
    logger.writeLog('error', `getDeviceDashboard error: ${error.message}`);
    res.status(500).render('error', {
      layout: 'layouts/full',
      err: error.message
    });
  }
};

/**
 * 기기 수정 페이지
 */
const getEditPage = async (req, res) => {
  try {
    const { device_id } = req.params;

    const device = await deviceService.getDeviceById(device_id);

    if (!device) {
      return res.status(404).render('error', {
        layout: 'layouts/full',
        err: 'Device not found'
      });
    }

    res.render('devices/edit', {
      layout: false,
      title: '기기 정보 수정',
      device
    });
  } catch (error) {
    logger.writeLog('error', `getEditPage error: ${error.message}`);
    res.status(500).render('error', {
      layout: 'layouts/full',
      err: error.message
    });
  }
};

/**
 * API: 기기 목록 조회
 */
const getDevicesList = async (req, res) => {
  try {
    // TODO: 실제로는 세션에서 user_id를 가져와야 함
    const user_id = req.query.user_id || 1;

    const devices = await deviceService.getDevicesByUserId(user_id);

    res.json({
      success: true,
      data: devices
    });
  } catch (error) {
    logger.writeLog('error', `getDevicesList error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * API: 기기 상세 조회
 */
const getDeviceDetail = async (req, res) => {
  try {
    const { device_id } = req.params;

    const device = await deviceService.getDeviceById(device_id);

    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    res.json({
      success: true,
      data: device
    });
  } catch (error) {
    logger.writeLog('error', `getDeviceDetail error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * API: 기기 등록
 */
const registerDevice = async (req, res) => {
  try {
    const { user_id, device_uuid, device_name, bottle_weight } = req.body;

    // TODO: 실제로는 세션에서 user_id를 가져와야 함
    const userId = user_id || 1;

    // 입력값 검증
    if (!device_uuid || !device_name) {
      return res.status(400).json({
        success: false,
        error: 'device_uuid and device_name are required'
      });
    }

    // 기기 등록
    const device = await deviceService.registerDevice(
      userId,
      device_uuid,
      device_name,
      bottle_weight || 0
    );

    logger.writeLog('info', `Device registered: ${device_uuid}`);

    res.json({
      success: true,
      message: 'Device registered successfully',
      data: device
    });
  } catch (error) {
    logger.writeLog('error', `registerDevice error: ${error.message}`);

    // 중복 UUID 에러 처리
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        error: 'Device UUID already exists'
      });
    }

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * API: 기기 정보 수정
 */
const updateDevice = async (req, res) => {
  try {
    const { device_id } = req.params;
    const { device_name, bottle_weight } = req.body;

    const updates = {};
    if (device_name !== undefined) updates.device_name = device_name;
    if (bottle_weight !== undefined) updates.bottle_weight = bottle_weight;

    await deviceService.updateDevice(device_id, updates);

    logger.writeLog('info', `Device updated: device_id=${device_id}`);

    res.json({
      success: true,
      message: 'Device updated successfully'
    });
  } catch (error) {
    logger.writeLog('error', `updateDevice error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * API: 기기 삭제
 */
const deleteDevice = async (req, res) => {
  try {
    const { device_id } = req.params;

    await deviceService.deleteDevice(device_id);

    logger.writeLog('info', `Device deleted: device_id=${device_id}`);

    res.json({
      success: true,
      message: 'Device deleted successfully'
    });
  } catch (error) {
    logger.writeLog('error', `deleteDevice error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * API: 무게 센서 영점 조정 (Tare)
 */
const tareWeightSensor = async (req, res) => {
  try {
    const { device_id } = req.params;
    const io = req.app.get('io');

    logger.writeLog('info', `Weight sensor tare requested: device_id=${device_id}`);

    // 기기 정보 조회
    const device = await deviceService.getDeviceById(device_id);
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    // 기기가 온라인 상태인지 확인
    if (!device.is_online) {
      return res.status(400).json({
        success: false,
        error: 'Device is offline. Please check hardware connection.'
      });
    }

    // Socket.IO를 통해 하드웨어에 영점 조정 명령 전송
    const deviceSocket = io.sockets.sockets.get(device.socket_id);
    if (!deviceSocket) {
      return res.status(400).json({
        success: false,
        error: 'Device socket not found. Please reconnect the device.'
      });
    }

    // 영점 조정 이벤트 전송
    deviceSocket.emit('weight:tare');
    logger.writeLog('info', `Sent weight:tare to device: ${device.device_uuid}`);

    res.json({
      success: true,
      message: 'Weight sensor tare command sent successfully'
    });
  } catch (error) {
    logger.writeLog('error', `tareWeightSensor error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * API: 현재 무게 조회
 */
const getCurrentWeight = async (req, res) => {
  try {
    const { device_id } = req.params;
    const io = req.app.get('io');

    // 기기 정보 조회
    const device = await deviceService.getDeviceById(device_id);
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    // 기기가 온라인 상태인지 확인
    if (!device.is_online) {
      return res.status(400).json({
        success: false,
        error: 'Device is offline'
      });
    }

    // Socket.IO를 통해 하드웨어에 무게 조회 명령 전송
    const deviceSocket = io.sockets.sockets.get(device.socket_id);
    if (!deviceSocket) {
      return res.status(400).json({
        success: false,
        error: 'Device socket not found'
      });
    }

    // 응답을 기다리기 위한 Promise
    const weightPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Weight response timeout'));
      }, 5000); // 5초 타임아웃

      // 응답 이벤트 리스너 등록
      const responseHandler = (data) => {
        clearTimeout(timeout);
        deviceSocket.off('weight:get:response', responseHandler);
        resolve(data.weight);
      };

      deviceSocket.once('weight:get:response', responseHandler);
    });

    // 무게 조회 이벤트 전송
    deviceSocket.emit('weight:get');

    // 응답 대기
    const weight = await weightPromise;

    logger.writeLog('info', `Current weight received: device_id=${device_id}, weight=${weight}g`);

    res.json({
      success: true,
      data: {
        weight: parseFloat(weight.toFixed(1)),
        timestamp: new Date()
      }
    });
  } catch (error) {
    logger.writeLog('error', `getCurrentWeight error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * API: 무게 측정 종료
 */
const stopMeasurement = async (req, res) => {
  try {
    const { device_id } = req.params;
    const io = req.app.get('io');

    logger.writeLog('info', `Weight measurement stop requested: device_id=${device_id}`);

    // 기기 정보 조회
    const device = await deviceService.getDeviceById(device_id);
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    // 기기가 온라인 상태인지 확인
    if (!device.is_online) {
      return res.status(400).json({
        success: false,
        error: 'Device is offline'
      });
    }

    // Socket.IO를 통해 하드웨어에 측정 종료 명령 전송
    const deviceSocket = io.sockets.sockets.get(device.socket_id);
    if (!deviceSocket) {
      return res.status(400).json({
        success: false,
        error: 'Device socket not found'
      });
    }

    // 측정 종료 이벤트 전송
    deviceSocket.emit('weight:measure:stop');
    logger.writeLog('info', `Sent weight:measure:stop to device: ${device.device_uuid}`);

    res.json({
      success: true,
      message: 'Weight measurement stop command sent successfully'
    });
  } catch (error) {
    logger.writeLog('error', `stopMeasurement error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * API: 수유 기록 조회
 */
const getFeedingRecords = async (req, res) => {
  try {
    const { device_id } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    // 기기 정보 조회
    const device = await deviceService.getDeviceById(device_id);
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    // 수유 기록 조회 (최근 N개)
    const feedingService = require('../services/feeding_service');
    const records = await feedingService.getFeedingRecordsByDeviceId(device_id, limit);

    res.json({
      success: true,
      data: records
    });
  } catch (error) {
    logger.writeLog('error', `getFeedingRecords error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  getDevicesPage,
  getRegisterPage,
  getDeviceDashboard,
  getEditPage,
  getDevicesList,
  getDeviceDetail,
  registerDevice,
  updateDevice,
  deleteDevice,
  tareWeightSensor,
  getCurrentWeight,
  stopMeasurement,
  getFeedingRecords
};
