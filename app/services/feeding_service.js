/**
 * Feeding Service
 * 수유 세션 및 기록 관리 서비스
 */

const mysqlPool = require('../../config/database');
const logger = require('../../config/logger');
const deviceService = require('./device_service');

/**
 * 새 수유 세션 생성 (버튼1 누름)
 */
const createFeedingSession = async (device_uuid, baby_id) => {
  try {
    // 기기 정보 조회
    const device = await deviceService.getDeviceByUUID(device_uuid);
    if (!device) {
      throw new Error('Device not found');
    }

    // 새 세션 생성
    const [result] = await mysqlPool.query(
      `INSERT INTO feeding_sessions
       (device_id, baby_id, status, button_pressed_at)
       VALUES (?, ?, 'ready', NOW())`,
      [device.device_id, baby_id]
    );

    logger.writeLog('info', `Feeding session created: session_id=${result.insertId}`);

    return {
      session_id: result.insertId,
      device_id: device.device_id,
      baby_id,
      status: 'ready'
    };
  } catch (error) {
    logger.writeLog('error', `createFeedingSession error: ${error.message}`);
    throw error;
  }
};

/**
 * 분유통 올림 상태 업데이트
 */
const updateSessionBottlePlaced = async (session_id, weight, temperature, temperature_safe) => {
  try {
    const [result] = await mysqlPool.query(
      `UPDATE feeding_sessions
       SET status = 'bottle_placed',
           bottle_placed_at = NOW(),
           initial_weight = ?,
           temperature = ?,
           temperature_safe = ?
       WHERE session_id = ?`,
      [weight, temperature, temperature_safe, session_id]
    );

    logger.writeLog('info', `Bottle placed: session_id=${session_id}, weight=${weight}g, temp=${temperature}°C`);
    return result;
  } catch (error) {
    logger.writeLog('error', `updateSessionBottlePlaced error: ${error.message}`);
    throw error;
  }
};

/**
 * 수유 진행 중 상태 업데이트 (분유통 들어올림)
 */
const updateSessionInProgress = async (session_id) => {
  try {
    const [result] = await mysqlPool.query(
      `UPDATE feeding_sessions
       SET status = 'in_progress',
           feeding_started_at = NOW()
       WHERE session_id = ?`,
      [session_id]
    );

    logger.writeLog('info', `Feeding in progress: session_id=${session_id}`);
    return result;
  } catch (error) {
    logger.writeLog('error', `updateSessionInProgress error: ${error.message}`);
    throw error;
  }
};

/**
 * 수유 완료 처리 (분유통 다시 내림)
 */
const completeFeedingSession = async (session_id, final_weight) => {
  const connection = await mysqlPool.getConnection();

  try {
    await connection.beginTransaction();

    // 세션 정보 조회
    const [sessions] = await connection.query(
      'SELECT * FROM feeding_sessions WHERE session_id = ?',
      [session_id]
    );

    if (sessions.length === 0) {
      throw new Error('Session not found');
    }

    const session = sessions[0];

    // 기기 정보 조회 (bottle_weight 필요)
    const device = await deviceService.getDeviceById(session.device_id);
    if (!device) {
      throw new Error('Device not found');
    }

    // 먹은 양 계산: 초기 무게 - 최종 무게
    // (분유통 무게는 양쪽에 모두 포함되어 있으므로 자동으로 상쇄됨)
    const amount_consumed = session.initial_weight - final_weight;

    // 소요 시간 계산 (초)
    const feeding_started_at = new Date(session.feeding_started_at);
    const feeding_ended_at = new Date();
    const duration = Math.floor((feeding_ended_at - feeding_started_at) / 1000);

    // 세션 완료 상태 업데이트
    await connection.query(
      `UPDATE feeding_sessions
       SET status = 'completed',
           feeding_ended_at = NOW(),
           final_weight = ?,
           amount_consumed = ?,
           duration = ?
       WHERE session_id = ?`,
      [final_weight, amount_consumed, duration, session_id]
    );

    // feeding_records에 기록 저장
    await connection.query(
      `INSERT INTO feeding_records
       (session_id, baby_id, device_id, amount_consumed, temperature, duration, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [session_id, session.baby_id, session.device_id, amount_consumed, session.temperature, duration]
    );

    // 일별 통계 업데이트
    await updateDailyStats(connection, session.baby_id);

    await connection.commit();

    logger.writeLog('info', `Feeding completed: session_id=${session_id}, amount=${amount_consumed}g, duration=${duration}s`);

    return {
      session_id,
      amount_consumed,
      duration,
      temperature: session.temperature
    };
  } catch (error) {
    await connection.rollback();
    logger.writeLog('error', `completeFeedingSession error: ${error.message}`);
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * 일별 통계 업데이트
 */
const updateDailyStats = async (connection, baby_id) => {
  try {
    // 오늘 날짜
    const today = new Date().toISOString().split('T')[0];

    // 오늘의 수유 기록 통계 계산
    const [stats] = await connection.query(
      `SELECT
         COUNT(*) as total_feedings,
         SUM(amount_consumed) as total_amount,
         AVG(amount_consumed) as avg_amount,
         AVG(temperature) as avg_temperature,
         AVG(duration) as avg_duration
       FROM feeding_records
       WHERE baby_id = ?
       AND DATE(timestamp) = ?`,
      [baby_id, today]
    );

    if (stats[0].total_feedings > 0) {
      // UPSERT (INSERT ... ON DUPLICATE KEY UPDATE)
      await connection.query(
        `INSERT INTO feeding_stats_daily
         (baby_id, date, total_feedings, total_amount, avg_amount, avg_temperature, avg_duration)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         total_feedings = VALUES(total_feedings),
         total_amount = VALUES(total_amount),
         avg_amount = VALUES(avg_amount),
         avg_temperature = VALUES(avg_temperature),
         avg_duration = VALUES(avg_duration),
         updated_at = NOW()`,
        [
          baby_id,
          today,
          stats[0].total_feedings,
          stats[0].total_amount,
          stats[0].avg_amount,
          stats[0].avg_temperature,
          stats[0].avg_duration
        ]
      );

      logger.writeLog('info', `Daily stats updated for baby_id=${baby_id}, date=${today}`);
    }
  } catch (error) {
    logger.writeLog('error', `updateDailyStats error: ${error.message}`);
    throw error;
  }
};

/**
 * 세션 ID로 세션 정보 조회
 */
const getSessionById = async (session_id) => {
  try {
    const [rows] = await mysqlPool.query(
      'SELECT * FROM feeding_sessions WHERE session_id = ?',
      [session_id]
    );
    return rows[0] || null;
  } catch (error) {
    logger.writeLog('error', `getSessionById error: ${error.message}`);
    throw error;
  }
};

/**
 * 진행 중인 세션 조회 (기기별)
 */
const getActiveSessionByDevice = async (device_id) => {
  try {
    const [rows] = await mysqlPool.query(
      `SELECT * FROM feeding_sessions
       WHERE device_id = ?
       AND status IN ('ready', 'bottle_placed', 'in_progress')
       ORDER BY created_at DESC
       LIMIT 1`,
      [device_id]
    );
    return rows[0] || null;
  } catch (error) {
    logger.writeLog('error', `getActiveSessionByDevice error: ${error.message}`);
    throw error;
  }
};

/**
 * 최근 수유 기록 조회
 */
const getRecentFeedings = async (baby_id, limit = 10) => {
  try {
    const [rows] = await mysqlPool.query(
      `SELECT * FROM feeding_records
       WHERE baby_id = ?
       ORDER BY timestamp DESC
       LIMIT ?`,
      [baby_id, limit]
    );
    return rows;
  } catch (error) {
    logger.writeLog('error', `getRecentFeedings error: ${error.message}`);
    throw error;
  }
};

/**
 * 오늘의 통계 조회
 */
const getTodayStats = async (baby_id) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const [rows] = await mysqlPool.query(
      'SELECT * FROM feeding_stats_daily WHERE baby_id = ? AND date = ?',
      [baby_id, today]
    );
    return rows[0] || null;
  } catch (error) {
    logger.writeLog('error', `getTodayStats error: ${error.message}`);
    throw error;
  }
};

/**
 * 기기별 수유 기록 조회
 */
const getFeedingRecordsByDeviceId = async (device_id, limit = 10) => {
  try {
    const [rows] = await mysqlPool.query(
      `SELECT
        fr.*,
        fs.button_pressed_at,
        fs.bottle_placed_at,
        fs.feeding_started_at,
        fs.feeding_ended_at,
        fs.temperature_safe,
        fs.initial_weight as weight_before,
        fs.final_weight as weight_after
       FROM feeding_records fr
       LEFT JOIN feeding_sessions fs ON fr.session_id = fs.session_id
       WHERE fr.device_id = ?
       ORDER BY fr.timestamp DESC
       LIMIT ?`,
      [device_id, limit]
    );
    return rows;
  } catch (error) {
    logger.writeLog('error', `getFeedingRecordsByDeviceId error: ${error.message}`);
    throw error;
  }
};

module.exports = {
  createFeedingSession,
  updateSessionBottlePlaced,
  updateSessionInProgress,
  completeFeedingSession,
  getSessionById,
  getActiveSessionByDevice,
  getRecentFeedings,
  getTodayStats,
  getFeedingRecordsByDeviceId
};
