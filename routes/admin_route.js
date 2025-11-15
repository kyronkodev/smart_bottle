const express = require("express");
const router = express.Router();
const deviceController = require('../app/controllers/device_controller');
const db = require('../config/database');

/* GET admin page - 아기 관리 대시보드 */
router.get("/", async function (req, res, next) {
    try {
        // 1. 모든 아기 목록 가져오기
        const babiesQuery = `
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
            ORDER BY created_at DESC
        `;
        const [babies] = await db.execute(babiesQuery);

        // 2. baby_id가 없으면 첫 번째 아기를 자동 선택
        let baby_id = req.query.baby_id;
        if (!baby_id && babies.length > 0) {
            baby_id = babies[0].baby_id;
        }

        // 3. 선택된 아기가 있으면 상세 정보 가져오기
        let selectedBaby = null;
        let babyDevices = [];
        let todayRecord = null;

        if (baby_id && babies.length > 0) {
            selectedBaby = babies.find(b => b.baby_id == baby_id) || babies[0];

            // 아기의 기기 목록
            const devicesQuery = `
                SELECT
                    device_id,
                    device_uuid,
                    device_name,
                    bottle_weight,
                    is_online,
                    last_connected
                FROM devices
                WHERE user_id = (SELECT user_id FROM babies WHERE baby_id = ?)
                ORDER BY created_at DESC
            `;
            const [devices] = await db.execute(devicesQuery, [selectedBaby.baby_id]);
            babyDevices = devices;

            // 오늘의 건강 기록
            const todayQuery = `
                SELECT *
                FROM health_records
                WHERE baby_id = ? AND record_date = CURDATE()
            `;
            const [todayRecords] = await db.execute(todayQuery, [selectedBaby.baby_id]);
            todayRecord = todayRecords[0] || null;
        }

        res.render("admin/index", {
            layout: "layouts/full",
            title: "아기 관리 대시보드",
            babies: babies,
            selectedBaby: selectedBaby,
            babyDevices: babyDevices,
            todayRecord: todayRecord,
            saved: req.query.saved === 'true',
            error: null
        });
    } catch (error) {
        console.error("어드민 페이지 오류:", error);
        res.render("admin/index", {
            layout: "layouts/full",
            title: "아기 관리 대시보드",
            babies: [],
            selectedBaby: null,
            babyDevices: [],
            todayRecord: null,
            saved: false,
            error: "데이터를 불러오는 중 오류가 발생했습니다."
        });
    }
});

/* POST 오늘의 건강 기록 저장 */
router.post("/health-record", async function (req, res, next) {
    try {
        const { baby_id, height_cm, weight_kg, head_circumference_cm, temperature, notes } = req.body;

        const query = `
            INSERT INTO health_records
            (baby_id, record_date, height_cm, weight_kg, head_circumference_cm, temperature, notes)
            VALUES (?, CURDATE(), ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                height_cm = VALUES(height_cm),
                weight_kg = VALUES(weight_kg),
                head_circumference_cm = VALUES(head_circumference_cm),
                temperature = VALUES(temperature),
                notes = VALUES(notes),
                updated_at = CURRENT_TIMESTAMP
        `;

        await db.execute(query, [baby_id, height_cm, weight_kg, head_circumference_cm, temperature, notes]);

        // babies 테이블의 current 값도 업데이트
        if (height_cm || weight_kg) {
            const updateBabyQuery = `
                UPDATE babies
                SET
                    current_height_cm = COALESCE(?, current_height_cm),
                    current_weight_kg = COALESCE(?, current_weight_kg)
                WHERE baby_id = ?
            `;
            await db.execute(updateBabyQuery, [height_cm, weight_kg, baby_id]);
        }

        res.redirect(`/admin?baby_id=${baby_id}&saved=true`);
    } catch (error) {
        console.error("건강 기록 저장 오류:", error);
        res.status(500).json({ error: "건강 기록 저장 실패" });
    }
});

/* GET 성장 일기 페이지 */
router.get("/growth-diary/:baby_id", async function (req, res, next) {
    try {
        const baby_id = req.params.baby_id;

        // 아기 정보
        const babyQuery = `
            SELECT
                baby_id,
                name,
                birth_date,
                gender,
                weight_at_birth,
                TIMESTAMPDIFF(MONTH, birth_date, NOW()) as age_month
            FROM babies
            WHERE baby_id = ?
        `;
        const [babyRows] = await db.execute(babyQuery, [baby_id]);

        if (babyRows.length === 0) {
            return res.status(404).send("아기를 찾을 수 없습니다.");
        }

        const baby = babyRows[0];

        // 건강 기록 (최근 30일)
        const recordsQuery = `
            SELECT
                record_id,
                record_date,
                height_cm,
                weight_kg,
                head_circumference_cm,
                temperature,
                notes,
                created_at
            FROM health_records
            WHERE baby_id = ?
            ORDER BY record_date DESC
            LIMIT 30
        `;
        const [records] = await db.execute(recordsQuery, [baby_id]);

        res.render("admin/growth_diary", {
            layout: "layouts/full",
            title: `${baby.name}의 성장 일기`,
            baby: baby,
            records: records
        });
    } catch (error) {
        console.error("성장 일기 페이지 오류:", error);
        res.status(500).send("오류가 발생했습니다.");
    }
});

/* GET admin devices page */
router.get("/devices", deviceController.getDevicesPage);

/* GET admin device register page */
router.get("/devices/register", deviceController.getRegisterPage);

/* GET admin device edit page */
router.get("/devices/:device_id/edit", deviceController.getEditPage);

module.exports = router;
