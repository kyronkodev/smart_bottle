/**
 * ML API Service
 * Python FastAPI 서버와 통신하여 AI 분석 결과를 가져옵니다
 */

const axios = require('axios');

// ML API 서버 URL (환경변수 또는 기본값)
const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000';

/**
 * 분유 추천 받기
 * @param {Object} babyProfile - 아기 프로필 정보
 * @returns {Promise<Object>} 추천 결과
 */
async function getFormulaRecommendation(babyProfile) {
    try {
        const response = await axios.post(
            `${ML_API_URL}/api/v1/recommend`,
            babyProfile,
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000 // 10초 타임아웃
            }
        );

        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        console.error('ML API 호출 실패:', error.message);
        return {
            success: false,
            error: error.message,
            data: null
        };
    }
}

/**
 * 특정 분유에 대한 내성 예측
 * @param {Object} babyProfile - 아기 프로필
 * @param {number} formulaId - 분유 ID
 * @returns {Promise<Object>} 예측 결과
 */
async function predictTolerance(babyProfile, formulaId) {
    try {
        const response = await axios.post(
            `${ML_API_URL}/api/v1/predict`,
            babyProfile,
            {
                params: { formula_id: formulaId },
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000
            }
        );

        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        console.error('ML API 예측 실패:', error.message);
        return {
            success: false,
            error: error.message,
            data: null
        };
    }
}

/**
 * 사용 가능한 분유 목록 가져오기
 * @returns {Promise<Object>} 분유 목록
 */
async function getFormulaList() {
    try {
        const response = await axios.get(
            `${ML_API_URL}/api/v1/formulas`,
            { timeout: 5000 }
        );

        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        console.error('분유 목록 조회 실패:', error.message);
        return {
            success: false,
            error: error.message,
            data: null
        };
    }
}

/**
 * ML API 서버 상태 확인
 * @returns {Promise<boolean>} 서버 상태
 */
async function checkMLServerHealth() {
    try {
        const response = await axios.get(
            `${ML_API_URL}/health`,
            { timeout: 3000 }
        );

        return response.data.status === 'healthy';
    } catch (error) {
        console.error('ML 서버 상태 확인 실패:', error.message);
        return false;
    }
}

module.exports = {
    getFormulaRecommendation,
    predictTolerance,
    getFormulaList,
    checkMLServerHealth
};
