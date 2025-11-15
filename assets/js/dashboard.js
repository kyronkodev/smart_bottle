// 스마트 젖병 부모용 대시보드 JavaScript

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('스마트 젖병 대시보드 로드 완료');

    // 필터 버튼 이벤트 설정
    initFilterButtons();

    // 실시간 데이터 갱신 시작 (30초마다)
    // startRealTimeUpdate();
});

// 필터 버튼 초기화
function initFilterButtons() {
    const filterButtons = document.querySelectorAll('.filter-btn');

    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // 모든 버튼에서 active 클래스 제거
            filterButtons.forEach(btn => btn.classList.remove('active'));

            // 클릭된 버튼에 active 클래스 추가
            this.classList.add('active');

            // 필터에 따른 데이터 로드
            const filter = this.textContent.trim();
            loadFeedingData(filter);
        });
    });
}

// 수유 데이터 로드
function loadFeedingData(filter) {
    console.log(`${filter} 데이터 로드 중...`);

    // TODO: API 호출로 실제 데이터 가져오기
    // fetch(`/api/feedings?filter=${filter}`)
    //     .then(response => response.json())
    //     .then(data => {
    //         updateFeedingTable(data);
    //     })
    //     .catch(error => {
    //         console.error('데이터 로드 실패:', error);
    //     });
}

// 테이블 업데이트
function updateFeedingTable(data) {
    const tbody = document.querySelector('table tbody');
    tbody.innerHTML = '';

    data.forEach(feeding => {
        const row = createFeedingRow(feeding);
        tbody.appendChild(row);
    });
}

// 수유 기록 행 생성
function createFeedingRow(feeding) {
    const row = document.createElement('tr');
    if (feeding.status === '진행중') {
        row.classList.add('row-highlight');
    }

    row.innerHTML = `
        <td class="font-semibold">${feeding.time}</td>
        <td>
            <span class="amount-display">
                <span class="amount-value">${feeding.amount}</span>
                <span class="amount-unit">ml</span>
            </span>
        </td>
        <td>${feeding.duration}분</td>
        <td class="${getTempClass(feeding.temperature)}">${feeding.temperature}°C</td>
        <td><span class="badge ${feeding.status === '진행중' ? 'badge-active' : 'badge-success'}">${feeding.status}</span></td>
    `;

    return row;
}

// 온도에 따른 클래스 반환
function getTempClass(temp) {
    if (temp < 36) return 'temp-cold';
    if (temp > 40) return 'temp-hot';
    return 'temp-good';
}

// 실시간 수유 데이터 갱신
function updateRealTimeFeeding() {
    fetch('/api/feedings/current')
        .then(response => response.json())
        .then(data => {
            if (data.success && data.data && data.data.isActive) {
                updateFeedingProgress(data.data);
                showFeedingActive();
            } else {
                hideFeedingActive();
            }
        })
        .catch(error => {
            console.error('실시간 데이터 갱신 실패:', error);
        });
}

// 수유 진행 상태 업데이트
function updateFeedingProgress(data) {
    const amountEl = document.getElementById('feeding-amount');
    if (amountEl) {
        amountEl.textContent = data.currentAmount;
    }

    const percentage = (data.currentAmount / data.targetAmount) * 100;
    const progressFill = document.querySelector('.progress-fill');
    if (progressFill) {
        progressFill.style.width = `${percentage}%`;
    }

    const progressLabel = document.querySelector('.progress-label');
    if (progressLabel) {
        progressLabel.textContent = `진행률 ${Math.round(percentage)}%`;
    }
}

// 수유 진행 중 섹션 표시
function showFeedingActive() {
    const feedingActive = document.querySelector('.feeding-active');
    if (feedingActive) {
        feedingActive.style.display = 'block';
    }
}

// 수유 진행 중 섹션 숨김
function hideFeedingActive() {
    const feedingActive = document.querySelector('.feeding-active');
    if (feedingActive) {
        feedingActive.style.display = 'none';
    }
}

// 실시간 업데이트 시작
function startRealTimeUpdate() {
    // 초기 로드
    updateRealTimeFeeding();

    // 30초마다 갱신
    setInterval(updateRealTimeFeeding, 30000);
}

// 알림 버튼 클릭
document.querySelector('.notification-btn')?.addEventListener('click', function() {
    alert('알림 기능은 개발 중입니다.');
});

// 통계 새로고침
function refreshStats() {
    fetch('/api/stats/today')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateStatsDisplay(data.data);
            }
        })
        .catch(error => {
            console.error('통계 갱신 실패:', error);
        });
}

// 통계 표시 업데이트
function updateStatsDisplay(stats) {
    // TODO: 통계 카드 업데이트 구현
    console.log('통계 업데이트:', stats);
}

// Export functions (필요시)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadFeedingData,
        updateRealTimeFeeding,
        getTempClass,
        refreshStats
    };
}
