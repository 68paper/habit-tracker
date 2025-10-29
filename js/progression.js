// ============================================
// 글 근육 습관 추적기 v3.0 - 레벨 및 연속기록 시스템
// ============================================

// ========== 레벨 시스템 ==========

// 글쓰기 레벨업 체크
function checkLevelUp() {
    const currentLevelData = getCurrentLevel();
    const streak = getWritingStreakWithFreeze();
    
    if (streak >= currentLevelData.daysRequired && state.currentLevel < WRITING_LEVELS.length) {
        const oldLevel = state.currentLevel;
        state.currentLevel++;
        state.levelProgress = 0;
        localStorage.setItem('currentLevel', state.currentLevel.toString());
        localStorage.setItem('levelProgress', '0');
        
        setTimeout(() => {
            alert(`🎉 축하합니다! Lv.${oldLevel} ${currentLevelData.title}에서 Lv.${state.currentLevel}로 레벨업했습니다!`);
        }, 500);
    } else {
        state.levelProgress = Math.min(streak, currentLevelData.daysRequired);
        localStorage.setItem('levelProgress', state.levelProgress.toString());
    }
}

// 레벨 진행도 체크
function checkLevelProgress() {
    const currentLevelData = getCurrentLevel();
    const streak = getWritingStreakWithFreeze();
    state.levelProgress = Math.min(streak, currentLevelData.daysRequired);
    localStorage.setItem('levelProgress', state.levelProgress.toString());
}

// 운동 레벨업 체크
function checkExerciseLevelUp() {
    if (state.currentExerciseLevel >= EXERCISE_LEVELS.length) return;
    
    const currentLevelData = EXERCISE_LEVELS.find(level => level.level === state.currentExerciseLevel);
    const totalStats = getTotalExerciseStats();
    
    const nextLevelData = EXERCISE_LEVELS[state.currentExerciseLevel];
    
    if (totalStats.totalSessions >= nextLevelData.required) {
        const oldLevel = state.currentExerciseLevel;
        state.currentExerciseLevel++;
        localStorage.setItem('currentExerciseLevel', state.currentExerciseLevel.toString());
        
        setTimeout(() => {
            alert(`🎉 축하합니다! Lv.${oldLevel} ${currentLevelData.title}에서 Lv.${state.currentExerciseLevel}로 레벨업했습니다!`);
        }, 500);
    }
}

// ========== 연속기록 시스템 ==========

// 글쓰기 연속기록 (보호막 미포함)
function getWritingStreak() {
    let streak = 0;
    let checkDate = new Date(state.currentDate);
    
    while (true) {
        const writingData = getWritingData(checkDate);
        if (writingData.completed) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }
    
    return streak;
}

// 글쓰기 연속기록 (보호막 포함)
function getWritingStreakWithFreeze() {
    let streak = 0;
    let checkDate = new Date(state.currentDate);
    let usedFreeze = false;
    
    while (true) {
        const dateKey = getDateKey(checkDate);
        const writingData = getWritingData(checkDate);
        const hasFreeze = state.habitData[dateKey]?.streakFreeze;
        
        if (writingData.completed) {
            streak++;
        } else if (hasFreeze && !usedFreeze) {
            streak++;
            usedFreeze = true;
        } else {
            break;
        }
        
        checkDate.setDate(checkDate.getDate() - 1);
    }
    
    return streak;
}

// 운동 연속기록
function getExerciseStreak() {
    let streak = 0;
    let checkDate = new Date(state.currentDate);
    
    while (true) {
        const dateKey = getDateKey(checkDate);
        const exerciseData = state.habitData[dateKey]?.exercise;
        if (exerciseData && exerciseData.sessions && exerciseData.sessions.length > 0) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }
    return streak;
}

// 운동 연속기록 (보호막 포함)
function getExerciseStreakWithFreeze() {
    let streak = 0;
    let checkDate = new Date(state.currentDate);
    let usedFreeze = false;
    
    while (true) {
        const dateKey = getDateKey(checkDate);
        const exerciseData = state.habitData[dateKey]?.exercise;
        const hasExercise = exerciseData && exerciseData.sessions && exerciseData.sessions.length > 0;
        const hasFreeze = state.habitData[dateKey]?.streakFreeze;
        
        if (hasExercise) {
            streak++;
        } else if (hasFreeze && !usedFreeze) {
            streak++;
            usedFreeze = true;
        } else {
            break;
        }
        
        checkDate.setDate(checkDate.getDate() - 1);
    }
    
    return streak;
}

// 전체 활동 연속기록 (보호막 포함)
function getTotalActivityStreakWithFreeze() {
    let streak = 0;
    let checkDate = new Date(state.currentDate);
    let usedFreeze = false;
    
    while (true) {
        const dateKey = getDateKey(checkDate);
        const dayData = state.habitData[dateKey];
        const hasFreeze = dayData?.streakFreeze;
        
        let hasAnyActivity = (dayData?.writing?.completed) || (dayData?.exercise?.sessions?.length > 0);
        
        customHabits.forEach(habit => {
            if (dayData?.[habit.id] || dayData?.[habit.id + '_count'] > 0) {
                hasAnyActivity = true;
            }
        });

        if (hasAnyActivity) {
            streak++;
        } else if (hasFreeze && !usedFreeze) {
            streak++;
            usedFreeze = true;
        } else {
            break;
        }
        
        checkDate.setDate(checkDate.getDate() - 1);
    }
    
    return streak;
}

// 최장 연속기록
function getLongestStreak() {
    let maxStreak = 0;
    let currentStreak = 0;
    
    const allDates = Object.keys(state.habitData)
        .filter(dateKey => state.habitData[dateKey].writing?.completed)
        .sort();
    
    for (let i = 0; i < allDates.length; i++) {
        if (i === 0) {
            currentStreak = 1;
        } else {
            const prevDate = new Date(allDates[i - 1]);
            const currDate = new Date(allDates[i]);
            const diffDays = (currDate - prevDate) / (1000 * 60 * 60 * 24);
            
            if (diffDays === 1) {
                currentStreak++;
            } else {
                maxStreak = Math.max(maxStreak, currentStreak);
                currentStreak = 1;
            }
        }
    }
    
    return Math.max(maxStreak, currentStreak);
}

// ========== 연속기록 UI 및 보호막 ==========

// 연속기록 UI 업데이트
function updateStreakUI() {
    const writingStreak = getWritingStreakWithFreeze();
    const exerciseStreak = getExerciseStreakWithFreeze();
    const totalStreak = getTotalActivityStreakWithFreeze();
    
    document.getElementById('writingStreakDisplay').textContent = writingStreak;
    document.getElementById('exerciseStreakDisplay').textContent = exerciseStreak;
    document.getElementById('totalStreakDisplay').textContent = totalStreak;
    
    const todayWriting = getWritingData(state.currentDate);
    if (todayWriting.completed) {
        document.getElementById('writingStreakStatus').textContent = '오늘 완료! 🔥';
    } else if (writingStreak > 0) {
        document.getElementById('writingStreakStatus').textContent = '오늘 완료하면 ' + (writingStreak + 1) + '일!';
    } else {
        document.getElementById('writingStreakStatus').textContent = '오늘 완료하면 1일!';
    }
    
    const todayExercise = isExerciseDone();
    if (todayExercise) {
        document.getElementById('exerciseStreakStatus').textContent = '오늘 완료! 💪';
    } else if (exerciseStreak > 0) {
        document.getElementById('exerciseStreakStatus').textContent = '운동하면 ' + (exerciseStreak + 1) + '일!';
    } else {
        document.getElementById('exerciseStreakStatus').textContent = '운동하고 기록 시작!';
    }
    
    const dateKey = getDateKey(state.currentDate);
    let hasAnyActivity = todayWriting.completed || todayExercise;
    customHabits.forEach(habit => {
        if (state.habitData[dateKey]?.[habit.id] || state.habitData[dateKey]?.[habit.id + '_count'] > 0) {
            hasAnyActivity = true;
        }
    });

    if (hasAnyActivity) {
        document.getElementById('totalStreakStatus').textContent = '오늘도 활동! 🎯';
    } else if (totalStreak > 0) {
        document.getElementById('totalStreakStatus').textContent = '활동하면 ' + (totalStreak + 1) + '일!';
    } else {
        document.getElementById('totalStreakStatus').textContent = '매일 무언가는 하자!';
    }
    
    document.getElementById('freezeCount').textContent = state.streakFreezes + '개 보유';
    const freezeBtn = document.getElementById('freezeBtn');
    if (state.streakFreezes <= 0) {
        freezeBtn.textContent = '보호막 없음';
        freezeBtn.className = 'text-xs text-gray-400 mt-1';
    } else if (state.lastFreezeUse === getDateKey(state.currentDate)) {
        freezeBtn.textContent = '오늘 사용함';
        freezeBtn.className = 'text-xs text-blue-400 mt-1';
    } else {
        freezeBtn.textContent = '보호막 사용하기';
        freezeBtn.className = 'text-xs text-blue-500 hover:text-blue-700 mt-1 cursor-pointer';
    }
}

// 보호막 사용
function useStreakFreeze() {
    if (state.streakFreezes <= 0) {
        alert('사용 가능한 보호막이 없습니다.');
        return;
    }
    
    const dateKey = getDateKey(state.currentDate);
    if (state.lastFreezeUse === dateKey) {
        alert('오늘은 이미 보호막을 사용했습니다.');
        return;
    }
    
    if (!confirm('연속일 보호막을 사용하시겠습니까?\n오늘 활동을 하지 않아도 연속 기록이 유지됩니다.')) {
        return;
    }
    
    state.streakFreezes--;
    state.lastFreezeUse = dateKey;
    
    if (!state.habitData[dateKey]) {
        state.habitData[dateKey] = {};
    }
    state.habitData[dateKey].streakFreeze = true;
    
    localStorage.setItem('streakFreezes', state.streakFreezes.toString());
    localStorage.setItem('lastFreezeUse', state.lastFreezeUse);
    localStorage.setItem('habitData', JSON.stringify(state.habitData));
    
    updateUI();
    alert('보호막이 사용되었습니다! 오늘 연속 기록이 유지됩니다.');
}

// 주간 목표 달성 및 보호막 지급
function checkWeeklyGoalAndRewardFreeze() {
    if (state.streakFreezes >= 5) return;
    
    const today = new Date(state.currentDate);
    const weekNumber = getWeekNumber(today);
    const yearWeekKey = `${today.getFullYear()}-W${weekNumber}`;
    
    const lastRewardWeek = localStorage.getItem('lastRewardWeek') || '';
    if (lastRewardWeek === yearWeekKey) return;
    
    const weekStats = getWeeklyWritingStats();
    
    let totalActiveDaysThisWeek = 0;
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const key = getDateKey(date);
        const dayData = state.habitData[key];
        
        if (dayData?.writing?.completed || dayData?.exercise?.sessions?.length > 0) {
            totalActiveDaysThisWeek++;
        }
    }
    
    if (weekStats.completedDays >= 5 || totalActiveDaysThisWeek >= 6) {
        state.streakFreezes = Math.min(state.streakFreezes + 1, 5);
        localStorage.setItem('streakFreezes', state.streakFreezes.toString());
        localStorage.setItem('lastRewardWeek', yearWeekKey);
        
        setTimeout(() => {
            alert('🎁 주간 목표 달성! 연속일 보호막 1개를 획득했습니다!');
        }, 300);
    }
}
