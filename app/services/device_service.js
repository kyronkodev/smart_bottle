/**
 * Device Service
 * IoT 기기 관리 서비스
 */

const mysqlPool = require('../../config/database');
const logger = require('../../config/logger');

/**
 * 기기 UUID로 기기 정보 조회
 */
const getDeviceByUUID = async (device_uuid) => {
  try {
    const [rows] = await mysqlPool.query(
      'SELECT * FROM devices WHERE device_uuid = ?',
      [device_uuid]
    );
    return rows[0] || null;
  } catch (error) {
    logger.writeLog('error', `getDeviceByUUID error: ${error.message}`);
    throw error;
  }
};

/**
 * 기기 ID로 기기 정보 조회
 */
const getDeviceById = async (device_id) => {
  try {
    const [rows] = await mysqlPool.query(
      'SELECT * FROM devices WHERE device_id = ?',
      [device_id]
    );
    return rows[0] || null;
  } catch (error) {
    logger.writeLog('error', `getDeviceById error: ${error.message}`);
    throw error;
  }
};

/**
 * 사용자 ID로 기기 목록 조회
 */
const getDevicesByUserId = async (user_id) => {
  try {
    const [rows] = await mysqlPool.query(
      'SELECT * FROM devices WHERE user_id = ? ORDER BY created_at DESC',
      [user_id]
    );
    return rows;
  } catch (error) {
    logger.writeLog('error', `getDevicesByUserId error: ${error.message}`);
    throw error;
  }
};

/**
 * 기기 온라인 상태 업데이트
 */
const updateDeviceStatus = async (device_uuid, socket_id, is_online) => {
  try {
    const [result] = await mysqlPool.query(
      `UPDATE devices
       SET is_online = ?,
           socket_id = ?,
           last_connected = NOW()
       WHERE device_uuid = ?`,
      [is_online, socket_id, device_uuid]
    );

    logger.writeLog('info', `Device status updated: ${device_uuid} → ${is_online ? 'online' : 'offline'}`);
    return result;
  } catch (error) {
    logger.writeLog('error', `updateDeviceStatus error: ${error.message}`);
    throw error;
  }
};

/**
 * 기기 등록
 */
const registerDevice = async (user_id, device_uuid, device_name, bottle_weight) => {
  try {
    const [result] = await mysqlPool.query(
      `INSERT INTO devices (user_id, device_uuid, device_name, bottle_weight)
       VALUES (?, ?, ?, ?)`,
      [user_id, device_uuid, device_name, bottle_weight || 0]
    );

    logger.writeLog('info', `Device registered: ${device_uuid} for user ${user_id}`);
    return {
      device_id: result.insertId,
      device_uuid,
      device_name,
      bottle_weight: bottle_weight || 0
    };
  } catch (error) {
    logger.writeLog('error', `registerDevice error: ${error.message}`);
    throw error;
  }
};

/**
 * 기기 정보 수정 (특히 bottle_weight)
 */
const updateDevice = async (device_id, updates) => {
  try {
    const allowedFields = ['device_name', 'bottle_weight'];
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(device_id);

    const [result] = await mysqlPool.query(
      `UPDATE devices SET ${fields.join(', ')} WHERE device_id = ?`,
      values
    );

    logger.writeLog('info', `Device updated: device_id=${device_id}`);
    return result;
  } catch (error) {
    logger.writeLog('error', `updateDevice error: ${error.message}`);
    throw error;
  }
};

/**
 * 기기 삭제
 */
const deleteDevice = async (device_id) => {
  try {
    const [result] = await mysqlPool.query(
      'DELETE FROM devices WHERE device_id = ?',
      [device_id]
    );

    logger.writeLog('info', `Device deleted: device_id=${device_id}`);
    return result;
  } catch (error) {
    logger.writeLog('error', `deleteDevice error: ${error.message}`);
    throw error;
  }
};

module.exports = {
  getDeviceByUUID,
  getDeviceById,
  getDevicesByUserId,
  updateDeviceStatus,
  registerDevice,
  updateDevice,
  deleteDevice
};
