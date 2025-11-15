const express = require("express");
const router = express.Router();

/* GET dashboard page */
router.get("/", function (req, res, next) {
    // 더미 데이터 - 나중에 데이터베이스에서 실제 데이터를 가져올 예정
    const dashboardData = {
        user: {
            name: '박지은',
            baby: {
                name: '지후',
                daysOld: 42, // 생후 일수
                weeksOld: 6, // 생후 주수
                gender: '남아',
                birthWeight: 3.2, // kg
                lastFeedingAgo: '2시간 15분 전'
            }
        },
        currentFeeding: {
            isActive: true,
            startTime: '오후 3:24',
            currentAmount: 85,
            targetAmount: 120,
            temperature: 37.5,
            elapsedMinutes: 5,
            progress: 71
        },
        todayStats: {
            totalAmount: 720,
            targetAmount: 750,
            totalSessions: 6,
            avgInterval: 3.2,
            tempCompliance: 100,
            avgAmount: 120,
            comparison: {
                yesterday: '+35ml',
                trend: 'up'
            }
        },
        insights: [
            {
                type: 'positive',
                icon: '✅',
                title: '건강한 수유 패턴',
                description: '지후의 수유량과 간격이 생후 6주 기준으로 매우 양호합니다. 규칙적인 수유 시간을 잘 지키고 있어요.'
            },
            {
                type: 'info',
                icon: '📊',
                title: '또래 평균 대비 상위',
                description: '생후 6주 아기 평균 대비 일일 수유량이 8% 높습니다. 건강하게 잘 자라고 있어요.'
            },
            {
                type: 'positive',
                icon: '🌡️',
                title: '완벽한 온도 관리',
                description: '모든 수유에서 적정 온도(36-40°C)가 유지되고 있습니다. 아기가 편안하게 수유할 수 있어요.'
            }
        ],
        todayFeedings: [
            {
                time: '오전 6:30',
                amount: 125,
                duration: 12,
                temperature: 37.2,
                status: '완료'
            },
            {
                time: '오전 9:45',
                amount: 110,
                duration: 10,
                temperature: 38.1,
                status: '완료'
            },
            {
                time: '오후 12:20',
                amount: 130,
                duration: 11,
                temperature: 37.5,
                status: '완료'
            },
            {
                time: '오후 3:15',
                amount: 115,
                duration: 9,
                temperature: 37.8,
                status: '완료'
            },
            {
                time: '오후 6:10',
                amount: 120,
                duration: 10,
                temperature: 38.0,
                status: '완료'
            },
            {
                time: '오후 9:24',
                amount: 85,
                duration: 5,
                temperature: 37.5,
                status: '진행중'
            }
        ],
        peerComparison: {
            myBaby: {
                dailyAmount: 720,
                feedingInterval: 3.2,
                avgPerSession: 120
            },
            peerAverage: {
                dailyAmount: 665,
                feedingInterval: 3.1,
                avgPerSession: 110
            },
            percentages: {
                dailyAmount: '+8%',
                avgPerSession: '+9%'
            }
        }
    };

    res.render("dashboard/index", {
        layout: "layouts/full",
        title: "스마트 젖병 - 우리 아기 대시보드",
        data: dashboardData
    });
});

module.exports = router;
