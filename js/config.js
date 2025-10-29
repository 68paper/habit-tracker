// ============================================
// 글 근육 습관 추적기 v3.0 - 설정 및 초기화
// ============================================

// 글 근육 레벨 시스템
const WRITING_LEVELS = [
    { level: 1, minutes: 5, title: "초보 작가", description: "첫 걸음을 떼는 단계", daysRequired: 7 },
    { level: 2, minutes: 10, title: "습관 작가", description: "루틴이 잡히는 단계", daysRequired: 7 },
    { level: 3, minutes: 15, title: "꾸준한 작가", description: "안정적인 글쓰기", daysRequired: 7 },
    { level: 4, minutes: 20, title: "집중 작가", description: "몰입의 시작", daysRequired: 10 },
    { level: 5, minutes: 30, title: "지속 작가", description: "깊은 사고의 시작", daysRequired: 10 },
    { level: 6, minutes: 45, title: "숙련 작가", description: "글의 흐름을 타는 단계", daysRequired: 14 },
    { level: 7, minutes: 60, title: "전문 작가", description: "1시간 집중력 완성", daysRequired: 14 },
    { level: 8, minutes: 90, title: "마스터 작가", description: "깊은 몰입 상태", daysRequired: 21 },
    { level: 9, minutes: 120, title: "베테랑 작가", description: "2시간 연속 글쓰기", daysRequired: 21 },
    { level: 10, minutes: 180, title: "프로 작가", description: "3시간 지구력", daysRequired: 30 },
    { level: 11, minutes: 240, title: "마라톤 작가", description: "4시간 완주 가능", daysRequired: 30 }
];

// 운동 레벨 시스템
const EXERCISE_LEVELS = [
    { level: 1, title: "시작하는 라이더", required: 5, description: "5회" },
    { level: 2, title: "습관 라이더", required: 10, description: "10회" },
    { level: 3, title: "지속 라이더", required: 20, description: "20회" },
    { level: 4, title: "지구력 라이더", required: 30, description: "30회" },
    { level: 5, title: "열정 라이더", required: 50, description: "50회" },
    { level: 6, title: "마스터 라이더", required: 100, description: "100회" }
];

// 전역 상태
let state = {
    currentDate: new Date(),
    habitData: JSON.parse(localStorage.getItem('habitData') || '{}'),
    currentLevel: parseInt(localStorage.getItem('currentLevel') || '1'),
    levelProgress: parseInt(localStorage.getItem('levelProgress') || '0'),
    currentExerciseLevel: parseInt(localStorage.getItem('currentExerciseLevel') || '1'),
    streakFreezes: parseInt(localStorage.getItem('streakFreezes') || '3'),
    lastFreezeUse: localStorage.getItem('lastFreezeUse') || null
};

// 커스텀 습관
let customHabits = JSON.parse(localStorage.getItem('customHabits') || '[]');

// v3.0: 고정 습관을 customHabits에 통합하는 초기화 함수
function migrateFixedHabits() {
    const fixedHabits = [
        { id: 'japanese', name: '일본어', type: 'simple', color: 'yellow', description: '언어의 다양성 확장', createdAt: '2023-01-01T00:00:00.000Z' },
        { id: 'blog', name: '블로그', type: 'simple', color: 'purple', description: '글쓰기 실전 연습', createdAt: '2023-01-01T00:00:00.001Z' }
    ];

    let isModified = false;
    fixedHabits.forEach(fixedHabit => {
        const exists = customHabits.some(h => h.id === fixedHabit.id);
        if (!exists) {
            customHabits.push(fixedHabit);
            isModified = true;
            console.log(`Added habit: ${fixedHabit.name}`);
        }
    });

    if (isModified) {
        localStorage.setItem('customHabits', JSON.stringify(customHabits));
        console.log('Fixed habits migrated to customHabits');
    }
}

// 초기화
function init() {
    console.log('글 근육 훈련소 시작 - v3.0');
    
    // 고정 습관들을 customHabits에 통합
    migrateFixedHabits();
    
    // 디버깅
    console.log('Current customHabits:', customHabits);
    
    try {
        updateUI();
        console.log('초기화 완료');
        
    } catch (error) {
        console.error('초기화 오류:', error);
        showNotification('앱 초기화 중 오류가 발생했습니다.', 'error');
    }
}

// 키보드 단축키
document.addEventListener('keydown', function(event) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        addSession();
    }
});

// DOM 로드 완료 후 초기화
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(init, 100);
});

// 페이지 로드 시 즉시 실행 (폴백)
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(init, 100);
}
