/**
 * Socket.IO 핸들러
 * IoT 기기와의 실시간 통신 처리
 */

const logger = require('../../config/logger');
const mysqlPool = require('../../config/database');
const deviceService = require('../services/device_service');
const feedingService = require('../services/feeding_service');

module.exports = (io) => {
  logger.writeLog('info', '🚀 Socket.IO server initialized');

  // 연결된 클라이언트 관리
  const connectedDevices = new Map(); // device_uuid → socket.id
  const connectedClients = new Map(); // user_id → socket.id (웹 클라이언트)

  io.on('connection', (socket) => {
    logger.writeLog('info', `✅ New connection: ${socket.id}`);

    /**
     * 1. IoT 기기 연결
     * Arduino/ESP32가 서버에 연결할 때
     */
    socket.on('device:connect', async (data) => {
      try {
        const { device_uuid } = data;

        if (!device_uuid) {
          socket.emit('error', { message: 'device_uuid is required' });
          return;
        }

        // 기기 온라인 상태 업데이트
        await deviceService.updateDeviceStatus(device_uuid, socket.id, true);

        // 연결된 기기 맵에 추가
        connectedDevices.set(device_uuid, socket.id);

        logger.writeLog('info', `📱 Device connected: ${device_uuid} (socket: ${socket.id})`);

        socket.emit('device:connected', {
          success: true,
          message: 'Device connected successfully',
          device_uuid
        });

        // 해당 기기의 사용자에게 알림
        const device = await deviceService.getDeviceByUUID(device_uuid);
        if (device && device.user_id) {
          const userSocketId = connectedClients.get(device.user_id);
          if (userSocketId) {
            io.to(userSocketId).emit('device:online', { device_uuid, device_name: device.device_name });
          }
        }
      } catch (error) {
        logger.writeLog('error', `Device connection error: ${error.message}`);
        socket.emit('error', { message: error.message });
      }
    });

    /**
     * 2. 웹 클라이언트 연결
     * 부모가 웹사이트에 접속할 때
     */
    socket.on('client:connect', async (data) => {
      try {
        const { user_id } = data;

        if (!user_id) {
          socket.emit('error', { message: 'user_id is required' });
          return;
        }

        connectedClients.set(user_id, socket.id);

        logger.writeLog('info', `👤 Client connected: user_id=${user_id} (socket: ${socket.id})`);

        socket.emit('client:connected', {
          success: true,
          message: 'Client connected successfully'
        });

        // 사용자의 기기 상태 전송
        const devices = await deviceService.getDevicesByUserId(user_id);
        socket.emit('devices:status', { devices });
      } catch (error) {
        logger.writeLog('error', `Client connection error: ${error.message}`);
        socket.emit('error', { message: error.message });
      }
    });

    /**
     * 3. 수유 시작 버튼 (버튼1)
     * Arduino에서 버튼1을 누를 때
     */
    socket.on('feeding:start', async (data) => {
      try {
        const { device_uuid, baby_id } = data;

        logger.writeLog('info', `🍼 Feeding start button pressed: device=${device_uuid}, baby=${baby_id}`);

        // 새 수유 세션 생성
        const session = await feedingService.createFeedingSession(device_uuid, baby_id);

        // IoT 기기에 응답
        socket.emit('feeding:ready', {
          session_id: session.session_id,
          message: '분유통을 올려주세요'
        });

        // 웹 클라이언트에 알림 (해당 기기의 사용자)
        const device = await deviceService.getDeviceByUUID(device_uuid);
        if (device && device.user_id) {
          const userSocketId = connectedClients.get(device.user_id);
          if (userSocketId) {
            io.to(userSocketId).emit('feeding:started', {
              session_id: session.session_id,
              device_uuid,
              baby_id,
              status: 'ready'
            });
          }
        }

        // 모든 클라이언트에게 브로드캐스트
        io.emit('feeding:started', {
          session_id: session.session_id,
          device_uuid,
          baby_id,
          status: 'ready'
        });
      } catch (error) {
        logger.writeLog('error', `Feeding start error: ${error.message}`);
        socket.emit('error', { message: error.message });
      }
    });

    /**
     * 4. 분유통 올림
     * 무게 센서가 감지하면
     */
    socket.on('bottle:placed', async (data) => {
      try {
        const { session_id, weight, temperature } = data;

        logger.writeLog('info', `🧴 Bottle placed: session=${session_id}, weight=${weight}g, temp=${temperature}°C`);

        // 세션 정보 조회하여 기기 ID 가져오기
        const session = await feedingService.getSessionById(session_id);
        if (!session) {
          throw new Error('Session not found');
        }

        // 기기 정보 조회하여 분유통 무게 가져오기
        const device = await deviceService.getDeviceById(session.device_id);
        if (!device) {
          throw new Error('Device not found');
        }

        const bottleWeight = device.bottle_weight || 0;
        const actualWeight = weight - bottleWeight; // 분유통 무게 차감

        logger.writeLog('info', `   분유통 무게: ${bottleWeight}g, 실제 분유 무게: ${actualWeight}g`);

        // 온도 안전 범위 체크 (35~43°C)
        const temperature_safe = temperature >= 35 && temperature <= 43;
        const temperature_status = temperature < 35 ? 'low' : (temperature > 43 ? 'high' : 'safe');

        // 세션 업데이트 (실제 분유 무게로 저장)
        await feedingService.updateSessionBottlePlaced(session_id, actualWeight, temperature, temperature_safe);

        // IoT 기기에 LED 제어 명령 (3색 LED)
        socket.emit('led:control', {
          status: temperature_status,  // 'safe', 'low', 'high'
          message: temperature_safe ? '적정 온도입니다. 먹어도 됩니다.' :
                   (temperature < 35 ? `온도가 낮습니다. (${temperature}°C)` : `온도가 높습니다. (${temperature}°C)`),
          safe_range: '35~43°C'
        });

        // 웹 클라이언트에 실시간 업데이트
        if (device && device.user_id) {
          const userSocketId = connectedClients.get(device.user_id);
          if (userSocketId) {
            io.to(userSocketId).emit('bottle:status', {
              session_id,
              weight: weight,  // 전체 무게 전송 (클라이언트에서 차감)
              weight_actual: actualWeight,  // 실제 분유 무게
              temperature,
              temperature_safe,
              temperature_status,
              status: 'bottle_placed'
            });
          }
        }

        // 모든 클라이언트에게 브로드캐스트
        io.emit('bottle:status', {
          session_id,
          weight: weight,
          weight_actual: actualWeight,
          temperature,
          temperature_safe,
          temperature_status,
          status: 'bottle_placed'
        });
      } catch (error) {
        logger.writeLog('error', `Bottle placed error: ${error.message}`);
        socket.emit('error', { message: error.message });
      }
    });

    /**
     * 4-1. 온도 업데이트 (지속 측정)
     * 수유 시작 전까지 온도를 계속 업데이트
     */
    socket.on('temperature:update', async (data) => {
      try {
        const { session_id, temperature } = data;

        logger.writeLog('info', `🌡️ Temperature update: session=${session_id}, temp=${temperature}°C`);

        // 온도 안전 범위 체크 (35~43°C)
        const temperature_safe = temperature >= 35 && temperature <= 43;
        const temperature_status = temperature < 35 ? 'low' : (temperature > 43 ? 'high' : 'safe');

        // 세션 온도 업데이트
        await mysqlPool.query(
          `UPDATE feeding_sessions
           SET temperature = ?,
               temperature_safe = ?
           WHERE session_id = ?`,
          [temperature, temperature_safe, session_id]
        );

        // 웹 클라이언트에 실시간 업데이트
        io.emit('temperature:status', {
          session_id,
          temperature,
          temperature_safe,
          temperature_status
        });

        // LED 제어 (3색 LED - 최신 온도 기준)
        socket.emit('led:control', {
          status: temperature_status,  // 'safe', 'low', 'high'
          message: temperature_safe ? '적정 온도입니다.' :
                   (temperature < 35 ? `온도가 낮습니다. (${temperature}°C)` : `온도가 높습니다. (${temperature}°C)`),
          safe_range: '35~43°C'
        });
      } catch (error) {
        logger.writeLog('error', `Temperature update error: ${error.message}`);
        socket.emit('error', { message: error.message });
      }
    });

    /**
     * 5. 분유통 들어올림 (수유 시작)
     * 무게 센서에서 분유통 제거 감지
     */
    socket.on('feeding:pickup', async (data) => {
      try {
        const { session_id } = data;

        logger.writeLog('info', `👶 Feeding pickup: session=${session_id}`);

        // 세션 상태 업데이트
        await feedingService.updateSessionInProgress(session_id);

        // 웹 클라이언트에 실시간 업데이트
        const session = await feedingService.getSessionById(session_id);
        const device = await deviceService.getDeviceById(session.device_id);
        if (device && device.user_id) {
          const userSocketId = connectedClients.get(device.user_id);
          if (userSocketId) {
            io.to(userSocketId).emit('feeding:in_progress', {
              session_id,
              started_at: new Date(),
              status: 'in_progress'
            });
          }
        }

        // 모든 클라이언트에게 브로드캐스트
        io.emit('feeding:in_progress', {
          session_id,
          started_at: new Date(),
          status: 'in_progress'
        });
      } catch (error) {
        logger.writeLog('error', `Feeding pickup error: ${error.message}`);
        socket.emit('error', { message: error.message });
      }
    });

    /**
     * 6. 분유통 다시 내림 (수유 종료)
     * 무게 센서에서 분유통 다시 올려짐 감지
     */
    socket.on('feeding:end', async (data) => {
      try {
        const { session_id, final_weight } = data;

        logger.writeLog('info', `✅ Feeding end: session=${session_id}, final_weight=${final_weight}g`);

        // 세션 정보 조회
        const session = await feedingService.getSessionById(session_id);
        if (!session) {
          throw new Error('Session not found');
        }

        // 기기 정보 조회하여 분유통 무게 가져오기
        const device = await deviceService.getDeviceById(session.device_id);
        if (!device) {
          throw new Error('Device not found');
        }

        const bottleWeight = device.bottle_weight || 0;
        const actualFinalWeight = final_weight - bottleWeight; // 분유통 무게 차감

        logger.writeLog('info', `   분유통 무게: ${bottleWeight}g, 실제 남은 분유 무게: ${actualFinalWeight}g`);

        // 수유 종료 처리 및 기록 저장 (실제 분유 무게로)
        const result = await feedingService.completeFeedingSession(session_id, actualFinalWeight);

        logger.writeLog('info', `   마신 양: ${result.amount_consumed}g, 소요 시간: ${result.duration}초`);

        // IoT 기기에 완료 알림
        socket.emit('feeding:completed', {
          session_id,
          amount_consumed: result.amount_consumed,
          duration: result.duration,
          message: '수유가 완료되었습니다.'
        });

        // 웹 클라이언트에 실시간 업데이트
        if (device && device.user_id) {
          const userSocketId = connectedClients.get(device.user_id);
          if (userSocketId) {
            io.to(userSocketId).emit('feeding:completed', {
              session_id,
              baby_id: session.baby_id,
              weight_before: session.weight_before,
              weight_after: actualFinalWeight,
              amount_consumed: result.amount_consumed,
              duration: result.duration,
              temperature: session.temperature,
              timestamp: new Date()
            });
          }
        }

        // 모든 클라이언트에게 브로드캐스트
        io.emit('feeding:completed', {
          session_id,
          baby_id: session.baby_id,
          weight_before: session.weight_before,
          weight_after: actualFinalWeight,
          amount_consumed: result.amount_consumed,
          duration: result.duration,
          temperature: session.temperature,
          timestamp: new Date()
        });
      } catch (error) {
        logger.writeLog('error', `Feeding end error: ${error.message}`);
        socket.emit('error', { message: error.message });
      }
    });

    /**
     * 7. 무게 측정 - 영점 조정 응답
     * Arduino에서 영점 조정 완료 응답
     */
    socket.on('weight:tare:response', (data) => {
      logger.writeLog('info', `⚖️ Weight tare response received: success=${data.success}`);
      // 응답 데이터를 클라이언트로 전달할 수 있음
    });

    /**
     * 8. 무게 측정 - 무게 조회 응답
     * Arduino에서 현재 무게 응답
     */
    socket.on('weight:get:response', (data) => {
      const { weight } = data;
      logger.writeLog('info', `⚖️ Weight get response: ${weight}g`);
      // 응답 데이터를 저장하거나 클라이언트로 전달
    });

    /**
     * 9. 연결 해제
     */
    socket.on('disconnect', async () => {
      logger.writeLog('info', `❌ Connection closed: ${socket.id}`);

      // 기기 연결 해제 처리
      for (const [device_uuid, socketId] of connectedDevices.entries()) {
        if (socketId === socket.id) {
          await deviceService.updateDeviceStatus(device_uuid, null, false);
          connectedDevices.delete(device_uuid);
          logger.writeLog('info', `📱 Device disconnected: ${device_uuid}`);

          // 사용자에게 알림
          const device = await deviceService.getDeviceByUUID(device_uuid);
          if (device && device.user_id) {
            const userSocketId = connectedClients.get(device.user_id);
            if (userSocketId) {
              io.to(userSocketId).emit('device:offline', { device_uuid });
            }
          }
          break;
        }
      }

      // 클라이언트 연결 해제 처리
      for (const [user_id, socketId] of connectedClients.entries()) {
        if (socketId === socket.id) {
          connectedClients.delete(user_id);
          logger.writeLog('info', `👤 Client disconnected: user_id=${user_id}`);
          break;
        }
      }
    });

    /**
     * 8. 에러 핸들링
     */
    socket.on('error', (error) => {
      logger.writeLog('error', `Socket error: ${error.message}`);
    });
  });

  return io;
};
