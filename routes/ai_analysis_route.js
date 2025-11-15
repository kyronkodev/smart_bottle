/**
 * AI 분석 리포트 라우트
 */

const express = require("express");
const router = express.Router();
const mlService = require("../app/services/ml_service");
const db = require("../config/database");

/**
 * AI 분석 페이지
 * GET /ai-analysis
 */
router.get("/", async function (req, res, next) {
    try {
        const baby_id = req.query.baby_id || 1;

        // 1. 아기 정보 가져오기
        const babyQuery = `
            SELECT
                baby_id,
                name,
                birth_date,
                gender,
                weight_at_birth,
                current_height_cm,
                current_weight_kg,
                allergy_risk,
                lactose_sensitivity,
                TIMESTAMPDIFF(MONTH, birth_date, NOW()) as age_month,
                TIMESTAMPDIFF(DAY, birth_date, NOW()) as age_days
            FROM babies
            WHERE baby_id = ?
        `;

        const [babyRows] = await db.execute(babyQuery, [baby_id]);

        if (babyRows.length === 0) {
            return res.render("ai_analysis/index", {
                layout: "layouts/full",
                title: "AI 분석 리포트",
                error: "아기 정보를 찾을 수 없습니다.",
                baby: null,
                hasHealthRecords: false,
                hasFeedingRecords: false,
                todayStats: null,
                monthlyStats: null,
                recommendations: null
            });
        }

        const baby = babyRows[0];

        // 2. 성장 기록 확인
        const healthRecordsQuery = `
            SELECT COUNT(*) as count
            FROM health_records
            WHERE baby_id = ?
        `;
        const [healthRows] = await db.execute(healthRecordsQuery, [baby_id]);
        const hasHealthRecords = healthRows[0].count > 0;

        // 3. 수유 기록 확인
        const feedingRecordsQuery = `
            SELECT COUNT(*) as count
            FROM feeding_records
            WHERE baby_id = ?
        `;
        const [feedingRows] = await db.execute(feedingRecordsQuery, [baby_id]);
        const hasFeedingRecords = feedingRows[0].count > 0;

        // 데이터가 없으면 경고 메시지와 함께 반환
        if (!hasHealthRecords || !hasFeedingRecords) {
            return res.render("ai_analysis/index", {
                layout: "layouts/full",
                title: "AI 분석 리포트",
                error: null,
                baby: baby,
                hasHealthRecords: hasHealthRecords,
                hasFeedingRecords: hasFeedingRecords,
                todayStats: null,
                monthlyStats: null,
                recommendations: null
            });
        }

        // 4. 오늘의 수유 통계
        const todayStatsQuery = `
            SELECT
                COUNT(*) as today_count,
                COALESCE(SUM(amount_consumed), 0) as today_total,
                COALESCE(AVG(amount_consumed), 0) as today_avg,
                COALESCE(AVG(temperature), 0) as avg_temp,
                COUNT(CASE WHEN temperature BETWEEN 36 AND 40 THEN 1 END) as temp_compliant
            FROM feeding_records
            WHERE baby_id = ?
              AND DATE(timestamp) = CURDATE()
        `;
        const [todayRows] = await db.execute(todayStatsQuery, [baby_id]);
        const todayStats = todayRows[0];

        // 온도 준수율 계산
        todayStats.temp_compliance_rate = todayStats.today_count > 0
            ? ((todayStats.temp_compliant / todayStats.today_count) * 100).toFixed(1)
            : 0;

        // 5. 최근 30일 통계 가져오기
        const statsQuery = `
            SELECT
                COUNT(*) as total_feedings,
                AVG(amount_consumed) as avg_amount,
                AVG(temperature) as avg_temperature,
                AVG(duration) as avg_duration
            FROM feeding_records
            WHERE baby_id = ?
              AND timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        `;

        const [statsRows] = await db.execute(statsQuery, [baby_id]);
        const stats = statsRows[0];

        // 6. 아기 프로필 생성 (ML API 요청용)
        const babyProfile = {
            age_month: baby.age_month || 0,
            sex: baby.gender === '남아' ? 'M' : 'F',
            height_cm: baby.current_height_cm || calculateStandardHeight(baby.age_month, baby.gender),
            weight_kg: baby.current_weight_kg || calculateStandardWeight(baby.age_month, baby.gender),
            allergy_risk: baby.allergy_risk || 0,
            lactose_sensitivity: baby.lactose_sensitivity || 0,
            feed_ml_per_intake: Math.round(stats.avg_amount) || 100
        };

        // 7. ML API 호출 - 분유 추천
        let recommendations = [];
        try {
            const isMLServerHealthy = await mlService.checkMLServerHealth();
            if (isMLServerHealthy) {
                const recommendResult = await mlService.getFormulaRecommendation(babyProfile);
                if (recommendResult.success) {
                    recommendations = recommendResult.data.recommendations || [];
                }
            }
        } catch (mlError) {
            console.error("ML API 오류:", mlError);
            // ML 실패 시에도 페이지는 표시 (추천만 없음)
        }

        // 8. 또래 아기 평균 비교 (더미 데이터)
        const peerComparison = {
            age_group: `${baby.age_month}개월`,
            avg_height: calculateStandardHeight(baby.age_month, baby.gender),
            avg_weight: calculateStandardWeight(baby.age_month, baby.gender),
            avg_daily_intake: baby.age_month <= 1 ? 600 : baby.age_month <= 3 ? 750 : baby.age_month <= 6 ? 900 : 1000,
            avg_feeding_count: baby.age_month <= 1 ? 8 : baby.age_month <= 3 ? 6 : baby.age_month <= 6 ? 5 : 4
        };

        // 9. AI 분석 리포트 (더미 데이터)
        const aiInsights = {
            growth_status: baby.current_height_cm && baby.current_height_cm > peerComparison.avg_height ? "평균 이상" : "평균",
            nutrition_status: "양호",
            feeding_pattern: todayStats.today_count >= peerComparison.avg_feeding_count ? "정상" : "부족",
            recommendation: "현재 수유 패턴을 유지하세요. 아기가 건강하게 성장하고 있습니다."
        };

        // 10. 페이지 렌더링
        res.render("ai_analysis/index", {
            layout: "layouts/full",
            title: "AI 분석 리포트",
            error: null,
            baby: baby,
            hasHealthRecords: true,
            hasFeedingRecords: true,
            todayStats: todayStats,
            monthlyStats: {
                total_feedings: stats.total_feedings || 0,
                avg_amount: stats.avg_amount ? Math.round(stats.avg_amount) : 0,
                avg_temperature: stats.avg_temperature ? Number(stats.avg_temperature).toFixed(1) : '0.0',
                avg_duration: stats.avg_duration ? Math.round(stats.avg_duration) : 0
            },
            peerComparison: peerComparison,
            aiInsights: aiInsights,
            recommendations: recommendations
        });

    } catch (error) {
        console.error("AI 분석 페이지 오류:", error);
        res.render("ai_analysis/index", {
            layout: "layouts/full",
            title: "AI 분석 리포트",
            error: "시스템 오류가 발생했습니다.",
            baby: null,
            hasHealthRecords: false,
            hasFeedingRecords: false,
            todayStats: null,
            monthlyStats: null,
            recommendations: null
        });
    }
});

/**
 * 표준 신장 계산 (WHO 기준 근사값)
 */
function calculateStandardHeight(ageMonth, gender) {
    if (!ageMonth) return 50; // 신생아 기본값

    // 간단한 선형 근사 (실제로는 WHO 성장 곡선 사용)
    const baseHeight = 50; // 출생 시
    const monthlyGrowth = gender === '남아' ? 2.5 : 2.3;

    return Math.round(baseHeight + (ageMonth * monthlyGrowth) * 10) / 10;
}

/**
 * 표준 체중 계산 (WHO 기준 근사값)
 */
function calculateStandardWeight(ageMonth, gender) {
    if (!ageMonth) return 3.3; // 신생아 기본값

    // 간단한 선형 근사
    const baseWeight = 3.3; // 출생 시
    const monthlyGain = gender === '남아' ? 0.8 : 0.7;

    return Math.round((baseWeight + (ageMonth * monthlyGain)) * 10) / 10;
}

module.exports = router;
