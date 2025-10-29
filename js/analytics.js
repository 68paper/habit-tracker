// ============================================
// 글 근육 습관 추적기 v3.0 - 통계 및 UI 업데이트
// ============================================

// ========== 통계 함수 ==========

// 주간 글쓰기 통계
function getWeeklyWritingStats() {
    let totalMinutes = 0;
    let totalCharacters = 0;
    let completedDays = 0;
    const today = new Date(state.currentDate);
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const writingData = getWritingData(date);
        
        if (writingData.completed) {
            totalMinutes += writingData.totalMinutes;
            totalCharacters += writingData.totalCharacters;
            completedDays++;
        }
    }
    
    return {
        totalMinutes,
        totalCharacters,
        completedDays,
        averageMinutes: completedDays > 0 ? Math.round(totalMinutes / completedDays) : 0,
        averageCharacters: completedDays > 0 ? Math.round(totalCharacters / completedDays) : 0
    };
}

// 주간 운동 통계
function getWeeklyExerciseStats() {
    let completedDays = 0;
    const today = new Date(state.currentDate);
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateKey = getDateKey(date);
        const exerciseData = state.habitData[dateKey]?.exercise;
        
        if (exerciseData && exerciseData.sessions && exerciseData.sessions.length > 0) {
            completedDays++;
        }
    }
    
    return { completedDays };
}

// 전체 글쓰기 통계
function getTotalStats() {
    let totalCharacters = 0;
    let totalMinutes = 0;
    let maxDailyCharacters = 0;
    
    Object.values(state.habitData).forEach(dayData => {
        if (dayData.writing?.sessions?.length > 0) {
            const chars = dayData.writing.totalCharacters || 0;
            const mins = dayData.writing.totalMinutes || 0;
            
            totalCharacters += chars;
            totalMinutes += mins;
            maxDailyCharacters = Math.max(maxDailyCharacters, chars);
        }
    }); 
    
    return {
        totalCharacters,
        totalMinutes,
        maxDailyCharacters,
        charactersPerMinute: totalMinutes > 0 ? Math.round(totalCharacters / totalMinutes) : 0
    };
}

// 전체 운동 통계
function getTotalExerciseStats() {
    let totalCalories = 0;
    let totalSessions = 0;
    
    Object.values(state.habitData).forEach(dayData => {
        if (dayData.exercise && dayData.exercise.sessions) {
            totalCalories += dayData.exercise.totalCalories || 0;
            totalSessions += dayData.exercise.sessions.length;
        }
    });
    return { totalCalories, totalSessions };
}

// ========== UI 업데이트 ==========

// 일일 요약 업데이트
function updateDailySummary() {
    const writingData = getWritingData(state.currentDate);
    const currentLevel = getCurrentLevel();
    
    document.getElementById('dailyTotal').textContent = 
        `${writingData.totalMinutes}분 · ${writingData.totalCharacters.toLocaleString()}자`;
    
    const remaining = Math.max(0, currentLevel.minutes - writingData.totalMinutes);
    if (remaining > 0) {
        document.getElementById('goalStatus').textContent = `목표까지 ${remaining}분 필요`;
    } else {
        document.getElementById('goalStatus').textContent = '✅ 목표 달성!';
    }
}

// 완료 버튼 상태 업데이트
function updateDayCompleteButton() {
    const writingData = getWritingData(state.currentDate);
    const currentLevel = getCurrentLevel();
    const btn = document.getElementById('dayCompleteBtn');
    
    if (writingData.completed) {
        btn.className = 'w-full px-6 py-3 rounded-lg font-medium transition-all duration-200 bg-green-500 text-white';
        btn.textContent = '✅ 오늘 목표 완료됨';
    } else if (writingData.totalMinutes >= currentLevel.minutes) {
        btn.className = 'w-full px-6 py-3 rounded-lg font-medium transition-all duration-200 bg-blue-500 text-white hover:bg-blue-600';
        btn.textContent = '목표 달성 완료하기';
    } else {
        btn.className = 'w-full px-6 py-3 rounded-lg font-medium transition-all duration-200 bg-gray-200 text-gray-600';
        btn.textContent = '오늘 목표 달성 완료';
    }
}

// 습관 UI 업데이트
function updateCustomHabitsInUI() {
    const totalHabits = 1 + 1 + customHabits.length;
    const completedWriting = getWritingData(state.currentDate).completed ? 1 : 0;
    const completedExercise = isExerciseDone() ? 1 : 0;
    
    const dateKey = getDateKey(state.currentDate);
    const completedCustom = customHabits.filter(habit => {
        if (habit.type === 'simple') {
            return state.habitData[dateKey]?.[habit.id] || false;
        } else if (habit.type === 'level') {
            return (state.habitData[dateKey]?.[habit.id + '_count'] || 0) > 0;
        }
        return false;
    }).length;
    
    const totalCompleted = completedWriting + completedExercise + completedCustom;
    
    document.getElementById('progressText').textContent = `오늘 완료: ${totalCompleted}/${totalHabits}`;
}

// 코치 조언 업데이트
function updateCoachAdvice(writingStats, completedToday, totalWritingStats, exerciseStats) {
    const advice = document.getElementById('coachAdvice');
    const hint = document.getElementById('nextLevelHint');
    
    const writingStreak = getWritingStreakWithFreeze();
    const exerciseStreak = getExerciseStreakWithFreeze();
    const totalExerciseSessions = getTotalExerciseStats().totalSessions;

    if (exerciseStats.completedDays >= 5) {
        advice.textContent = `이번 주 ${exerciseStats.completedDays}회 운동 완료! 꾸준함이 심폐지구력을 키우고 있어요.`;
    } else if (exerciseStreak >= 3) {
        advice.textContent = `🔥 운동 연속 ${exerciseStreak}일 달성! 멋진 흐름입니다.`;
    } else if (totalExerciseSessions >= 20) {
        advice.textContent = `🎉 벌써 ${totalExerciseSessions}회 운동! 당신의 건강한 습관에 박수를 보냅니다.`;
    }
    else if (totalWritingStats.totalCharacters > 100000) {
        advice.textContent = `누적 ${totalWritingStats.totalCharacters.toLocaleString()}자 달성! 이제 진짜 프로 소설가의 모습이 보입니다.`;
    } else if (totalWritingStats.totalCharacters > 50000) {
        advice.textContent = `누적 ${totalWritingStats.totalCharacters.toLocaleString()}자! 꾸준히 쌓인 글의 힘이 대단합니다.`;
    } else if (totalWritingStats.totalCharacters > 10000) {
        advice.textContent = `누적 ${totalWritingStats.totalCharacters.toLocaleString()}자! 꾸준함의 결실이 보이기 시작합니다.`;
    } else if (writingStreak >= 14) {
        advice.textContent = "2주 연속 달성! 이제 글쓰기가 완전히 습관이 되었습니다.";
    } else if (writingStreak >= 7) {
        advice.textContent = "일주일 연속 달성! 이제 글쓰기가 자연스러운 습관이 되어가고 있습니다.";
    } else if (writingStreak >= 3) {
        advice.textContent = "좋은 흐름이에요! 연속 기록을 유지하면서 글 근육을 단단히 만들어가세요.";
    } else if (writingStats.completedDays >= 4) {
        advice.textContent = "이번 주 잘 하고 있어요. 꾸준함이 재능을 이깁니다.";
    } else {
        advice.textContent = "괜찮아요. 작은 시작이 큰 변화를 만듭니다. 오늘부터 다시 시작해보세요.";
    }
    
    const currentLevelData = getCurrentLevel();
    const remainingDays = currentLevelData.daysRequired - writingStreak;
    
    if (remainingDays > 0) {
        hint.textContent = `💡 ${remainingDays}일 더 연속으로 달성하면 다음 레벨로 승급!`;
    } else {
        hint.textContent = "🎉 레벨업 조건 달성! 계속 유지하면 승급합니다!";
    }
}

// 전체 UI 업데이트 (메인 함수)
function updateUI() {
    try {
        document.getElementById('currentDateText').textContent = formatDate(state.currentDate);
        
        const currentLevelData = getCurrentLevel();
        document.getElementById('currentLevel').textContent = currentLevelData.level;
        document.getElementById('levelDescription').textContent = `${currentLevelData.title} (${currentLevelData.minutes}분)`;
        document.getElementById('levelProgress').textContent = 
            `다음 레벨까지: ${state.levelProgress}/${currentLevelData.daysRequired}일`;
        
        const rawWritingProgress = (state.levelProgress / currentLevelData.daysRequired) * 100;
        const progressPercentage = Math.min(rawWritingProgress, 100);
        document.getElementById('progressBar').style.width = `${progressPercentage}%`;
        
        const currentExerciseLevelData = EXERCISE_LEVELS.find(level => level.level === state.currentExerciseLevel) || EXERCISE_LEVELS[0];
        const totalExerciseStats = getTotalExerciseStats();
        const nextExerciseRequired = (state.currentExerciseLevel < EXERCISE_LEVELS.length) ? EXERCISE_LEVELS[state.currentExerciseLevel].required : EXERCISE_LEVELS[EXERCISE_LEVELS.length - 1].required;

        const rawProgress = (totalExerciseStats.totalSessions / nextExerciseRequired) * 100;
        const progressExercisePercentage = Math.min(rawProgress, 100);

        document.getElementById('currentExerciseLevel').textContent = currentExerciseLevelData.level;
        document.getElementById('exerciseLevelDescription').textContent = `${currentExerciseLevelData.title}`;
        document.getElementById('exerciseLevelProgress').textContent = `다음 레벨까지: ${totalExerciseStats.totalSessions}/${nextExerciseRequired}회`;
        document.getElementById('exerciseProgressBar').style.width = `${progressExercisePercentage}%`;

        WRITING_LEVELS.forEach((levelData) => {
            const levelId = levelData.level === 11 ? '11' : levelData.level;
            const levelBox = document.getElementById(`writing-level-${levelId}`);
            if (levelBox) {
                if (levelData.level === state.currentLevel) {
                    levelBox.className = "p-2 bg-blue-100 rounded text-center";
                } else {
                    levelBox.className = "p-2 bg-gray-100 rounded text-center";
                }
            }
        });

        EXERCISE_LEVELS.forEach((levelData) => {
            const levelId = levelData.level === 6 ? '6' : levelData.level;
            const levelBox = document.getElementById(`exercise-level-${levelId}`);
            if (levelBox) {
                if (levelData.level === state.currentExerciseLevel) {
                    levelBox.className = "p-2 bg-green-100 rounded text-center";
                } else {
                    levelBox.className = "p-2 bg-gray-100 rounded text-center";
                }
            }
        });
        
        document.getElementById('currentTarget').textContent = `${currentLevelData.minutes}분`;
        
        renderSessions();
        updateDailySummary();
        updateDayCompleteButton();

        renderExerciseSessions();
        updateExerciseSummary();
        
        updateStreakUI();
        
        document.getElementById('novel-streak').textContent = getWritingStreakWithFreeze();
        document.getElementById('exercise-streak').textContent = getExerciseStreakWithFreeze();
        
        const weekStats = getWeeklyWritingStats();
        const totalStats = getTotalStats();
        const weeklyExerciseStats = getWeeklyExerciseStats();
        
        document.getElementById('novel-week').textContent = weekStats.completedDays;
        document.getElementById('exercise-week').textContent = weeklyExerciseStats.completedDays;
        document.getElementById('weeklyMinutes').textContent = weekStats.totalMinutes;
        document.getElementById('averageMinutes').textContent = weekStats.averageMinutes;
        document.getElementById('weeklyCharacters').textContent = weekStats.totalCharacters.toLocaleString();
        document.getElementById('averageCharacters').textContent = weekStats.averageCharacters.toLocaleString();
        
        document.getElementById('charactersPerMinute').textContent = 
            totalStats.charactersPerMinute > 0 ? `${totalStats.charactersPerMinute}자/분` : '-';
        document.getElementById('dailyBest').textContent = `${totalStats.maxDailyCharacters.toLocaleString()}자`;
        document.getElementById('longestStreak').textContent = `${getLongestStreak()}일`;
        document.getElementById('totalCharacters').textContent = `${totalStats.totalCharacters.toLocaleString()}자`;
        
        renderCustomHabits();
        updateCustomHabitsInUI();
        
        const progressText = document.getElementById('progressText').textContent;
        const parts = progressText.match(/(\d+)\/(\d+)/);
        const totalCompleted = parseInt(parts[1]);
        const totalHabitsIncludingCustom = parseInt(parts[2]);
        
        const progressBadge = document.getElementById('progressBadge');
        if (totalCompleted === totalHabitsIncludingCustom) {
            progressBadge.className = 'px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 animate-pulse-gentle';
            progressBadge.textContent = '✨ 일일 그랜드 슬램! ✨';
        } else if (totalCompleted > 0) {
            progressBadge.className = 'px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800';
            progressBadge.textContent = '👍 잘 하고 있어요!';
        } else {
            progressBadge.className = 'px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800';
            progressBadge.textContent = '시작해보세요!';
        }
        
        updateCoachAdvice(weekStats, totalCompleted, totalStats, weeklyExerciseStats);
        
    } catch (error) {
        console.error('UI 업데이트 오류:', error);
        showNotification('화면 업데이트 중 오류가 발생했습니다.', 'error');
    }
}
