// ============================================
// 글 근육 습관 추적기 v3.0 - 유틸리티 함수
// ============================================

// 알림 표시
function showNotification(message, type = 'info') {
    if (type === 'error') {
        alert('오류: ' + message);
    } else {
        console.log(message);
    }
}

// 날짜 키 생성 (YYYY-MM-DD)
function getDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 날짜 포맷팅
function formatDate(date) {
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
    };
    return date.toLocaleDateString('ko-KR', options);
}

// 시간 포맷팅
function formatTime(timestamp) {
    const date = new Date(timestamp);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

// 타임스탬프 생성
function createTimestamp(date, hours = null, minutes = null) {
    const newDate = new Date(date);
    if (hours !== null) newDate.setHours(hours);
    if (minutes !== null) newDate.setMinutes(minutes);
    return newDate.getTime();
}

// 현재 레벨 가져오기
function getCurrentLevel() {
    return WRITING_LEVELS.find(level => level.level === state.currentLevel) || WRITING_LEVELS[0];
}

// 주차 번호 계산
function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// 날짜 변경
function changeDate(days) {
    const newDate = new Date(state.currentDate);
    newDate.setDate(newDate.getDate() + days);
    state.currentDate = newDate;
    updateUI();
}

// 오늘로 이동
function goToToday() {
    state.currentDate = new Date();
    updateUI();
}

// 입력 검증 함수
function validateSessionInput(minutes, characters) {
    const errors = [];
    
    if (!minutes || isNaN(minutes)) {
        errors.push('시간을 입력해주세요.');
    } else if (minutes <= 0) {
        errors.push('시간은 1분 이상이어야 합니다.');
    } else if (minutes > 480) {
        errors.push('시간은 8시간(480분) 이하로 입력해주세요.');
    }
    
    if (characters !== null && characters !== undefined && characters !== '') {
        if (isNaN(characters)) {
            errors.push('글자 수는 숫자로 입력해주세요.');
        } else if (characters < 0) {
            errors.push('글자 수는 음수일 수 없습니다.');
        } else if (characters > 50000) {
            errors.push('글자 수는 50,000자 이하로 입력해주세요.');
        }
    }
    
    return errors;
}

// 데이터 검증 및 수정 함수
function validateAndFixWritingData(data) {
    if (!data) return createEmptyWritingData();
    
    if (!data.sessions) data.sessions = [];
    if (typeof data.completed !== 'boolean') data.completed = false;
    
    data.sessions = data.sessions.filter(session => {
        return session && 
               typeof session.timestamp === 'number' && 
               typeof session.minutes === 'number' && 
               session.minutes > 0 &&
               typeof session.characters === 'number' && 
               session.characters >= 0;
    });
    
    data.totalMinutes = data.sessions.reduce((sum, s) => sum + s.minutes, 0);
    data.totalCharacters = data.sessions.reduce((sum, s) => sum + s.characters, 0);
    
    return data;
}

// 빈 글쓰기 데이터 생성
function createEmptyWritingData() {
    return {
        completed: false,
        sessions: [],
        totalMinutes: 0,
        totalCharacters: 0
    };
}

// 글쓰기 데이터 가져오기
function getWritingData(date) {
    const dateKey = getDateKey(date);
    const rawData = state.habitData[dateKey]?.writing;
    
    if (rawData && rawData.minutes !== undefined && !rawData.sessions) {
        const convertedData = {
            completed: rawData.completed || false,
            sessions: rawData.completed ? [{
                timestamp: createTimestamp(date, 9, 0),
                minutes: rawData.minutes || 0,
                characters: rawData.characters || 0
            }] : [],
            totalMinutes: rawData.minutes || 0,
            totalCharacters: rawData.characters || 0
        };
        
        saveWritingData(date, convertedData);
        return convertedData;
    }
    
    return validateAndFixWritingData(rawData);
}

// 글쓰기 데이터 저장
function saveWritingData(date, writingData) {
    try {
        const dateKey = getDateKey(date);
        if (!state.habitData[dateKey]) {
            state.habitData[dateKey] = {};
        }
        
        state.habitData[dateKey].writing = validateAndFixWritingData(writingData);
        localStorage.setItem('habitData', JSON.stringify(state.habitData));
        
        return true;
    } catch (error) {
        console.error('데이터 저장 오류:', error);
        showNotification('데이터 저장 중 오류가 발생했습니다.', 'error');
        return false;
    }
}

// 오늘 운동 완료 여부
function isExerciseDone() {
    const dateKey = getDateKey(state.currentDate);
    const exerciseData = state.habitData[dateKey]?.exercise;
    return exerciseData && exerciseData.sessions && exerciseData.sessions.length > 0;
}
