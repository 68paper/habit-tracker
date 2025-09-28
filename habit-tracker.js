
function showNotification(message, type = 'info') {
    if (type === 'error') {
        alert('오류: ' + message);
    } else {
        console.log(message);
    }
}

// 글쓰기 세션 관련 함수들
function renderSessions() {
    const container = document.getElementById('sessionsContainer');
    const writingData = getWritingData(state.currentDate);
    
    if (writingData.sessions.length === 0) {
        container.innerHTML = '<div class="text-sm text-gray-500 text-center py-4">아직 작업 기록이 없습니다. 첫 세션을 추가해보세요!</div>';
        return;
    }
    
    const sortedSessions = [...writingData.sessions].sort((a, b) => a.timestamp - b.timestamp);
    
    container.innerHTML = sortedSessions.map((session, originalIndex) => {
        const realIndex = writingData.sessions.findIndex(s => s.timestamp === session.timestamp);
        const time = formatTime(session.timestamp);
        
        return `
            <div class="session-item flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div class="flex items-center space-x-3">
                    <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span class="text-sm font-medium text-gray-800">${time} 세션</span>
                </div>
                <div class="flex items-center space-x-3">
                    <div class="text-sm text-gray-600">
                        <span class="font-medium">${session.minutes}분</span>
                        ${session.characters > 0 ? ` · <span class="font-medium">${session.characters.toLocaleString()}자</span>` : ''}
                    </div>
                    <div class="flex space-x-1">
                        <button onclick="editSession(${realIndex})" class="text-blue-500 hover:text-blue-700 text-xs px-2 py-1 rounded" title="수정">
                            ✏️
                        </button>
                        <button onclick="removeSession(${realIndex})" class="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded" title="삭제">
                            ✕
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function addSession() {
    try {
        const minutesValue = document.getElementById('sessionMinutes').value;
        const charactersValue = document.getElementById('sessionCharacters').value;
        
        const minutes = parseInt(minutesValue) || 0;
        const characters = charactersValue === '' ? 0 : parseInt(charactersValue) || 0;
        
        const errors = validateSessionInput(minutes, characters);
        if (errors.length > 0) {
            alert(errors.join('\n'));
            return;
        }
        
        const writingData = getWritingData(state.currentDate);
        const newSession = {
            timestamp: Date.now(),
            minutes: minutes,
            characters: characters
        };
        
        writingData.sessions.push(newSession);
        writingData.totalMinutes += minutes;
        writingData.totalCharacters += characters;
        
        if (saveWritingData(state.currentDate, writingData)) {
            document.getElementById('sessionMinutes').value = '';
            document.getElementById('sessionCharacters').value = '';
            
            updateUI();
            showNotification('세션이 추가되었습니다!');
        }
        
    } catch (error) {
        console.error('세션 추가 오류:', error);
        showNotification('세션 추가 중 오류가 발생했습니다.', 'error');
    }
}

function editSession(index) {
    try {
        const writingData = getWritingData(state.currentDate);
        if (index < 0 || index >= writingData.sessions.length) return;
        
        const session = writingData.sessions[index];
        const newMinutes = prompt('시간을 수정하세요 (분):', session.minutes);
        const newCharacters = prompt('글자 수를 수정하세요:', session.characters);
        
        if (newMinutes === null || newCharacters === null) return;
        
        const minutes = parseInt(newMinutes) || 0;
        const characters = parseInt(newCharacters) || 0;
        
        const errors = validateSessionInput(minutes, characters);
        if (errors.length > 0) {
            alert(errors.join('\n'));
            return;
        }
        
        writingData.totalMinutes = writingData.totalMinutes - session.minutes + minutes;
        writingData.totalCharacters = writingData.totalCharacters - session.characters + characters;
        
        session.minutes = minutes;
        session.characters = characters;
        
        if (saveWritingData(state.currentDate, writingData)) {
            updateUI();
            showNotification('세션이 수정되었습니다!');
        }
        
    } catch (error) {
        console.error('세션 수정 오류:', error);
        showNotification('세션 수정 중 오류가 발생했습니다.', 'error');
    }
}

function removeSession(index) {
    try {
        if (!confirm('이 세션을 삭제하시겠습니까?')) return;
        
        const writingData = getWritingData(state.currentDate);
        if (index < 0 || index >= writingData.sessions.length) return;
        
        const session = writingData.sessions[index];
        
        writingData.totalMinutes -= session.minutes;
        writingData.totalCharacters -= session.characters;
        
        writingData.sessions.splice(index, 1);
        
        const currentLevel = getCurrentLevel();
        const totalMinutes = writingData.totalMinutes;
        
        if (writingData.completed && totalMinutes < currentLevel.minutes) {
            writingData.completed = false;
        }
        
        if (saveWritingData(state.currentDate, writingData)) {
            checkLevelProgress();
            updateUI();
            showNotification('세션이 삭제되었습니다.');
        }
        
    } catch (error) {
        console.error('세션 삭제 오류:', error);
        showNotification('세션 삭제 중 오류가 발생했습니다.', 'error');
    }
}

function toggleDayComplete() {
    try {
        const writingData = getWritingData(state.currentDate);
        const currentLevel = getCurrentLevel();
        
        if (!writingData.completed && writingData.totalMinutes < currentLevel.minutes) {
            alert(`목표 시간(${currentLevel.minutes}분)을 달성한 후 완료할 수 있습니다.`);
            return;
        }
        
        writingData.completed = !writingData.completed;
        
        if (saveWritingData(state.currentDate, writingData)) {
            checkLevelUp();
            checkWeeklyGoalAndRewardFreeze();
            updateUI();
            
            if (writingData.completed) {
                showNotification('🎉 오늘 목표를 달성했습니다!');
            }
        }
        
    } catch (error) {
        console.error('완료 상태 변경 오류:', error);
        showNotification('완료 상태 변경 중 오류가 발생했습니다.', 'error');
    }
}

// 운동 기록 함수들
function addExerciseSession() {
    try {
        const minutesValue = document.getElementById('exerciseMinutes').value;
        const caloriesValue = document.getElementById('exerciseCalories').value;
        
        const minutes = parseInt(minutesValue) || 0;
        const calories = parseInt(caloriesValue) || 0;

        if (minutes <= 0) {
            alert('시간은 1분 이상이어야 합니다.');
            return;
        }
        if (calories < 0) {
            alert('칼로리는 0kcal 이상이어야 합니다.');
            return;
        }

        const dateKey = getDateKey(state.currentDate);
        if (!state.habitData[dateKey]) {
            state.habitData[dateKey] = {};
        }
        if (!state.habitData[dateKey].exercise) {
            state.habitData[dateKey].exercise = { sessions: [], totalMinutes: 0, totalCalories: 0 };
        }
        
        const newSession = {
            timestamp: Date.now(),
            minutes: minutes,
            calories: calories
        };
        
        state.habitData[dateKey].exercise.sessions.push(newSession);
        state.habitData[dateKey].exercise.totalMinutes += minutes;
        state.habitData[dateKey].exercise.totalCalories += calories;

        localStorage.setItem('habitData', JSON.stringify(state.habitData));
        
        document.getElementById('exerciseMinutes').value = '';
        document.getElementById('exerciseCalories').value = '';
        
        checkExerciseLevelUp();
        checkWeeklyGoalAndRewardFreeze();
        updateUI();
        showNotification('운동 기록이 추가되었습니다!');
        
    } catch (error) {
        console.error('운동 기록 추가 오류:', error);
        showNotification('운동 기록 추가 중 오류가 발생했습니다.', 'error');
    }
}

function removeExerciseSession(timestamp) {
    try {
        if (!confirm('이 운동 세션을 삭제하시겠습니까?')) return;

        const dateKey = getDateKey(state.currentDate);
        const exerciseData = state.habitData[dateKey]?.exercise;

        if (!exerciseData || !exerciseData.sessions) return;

        const index = exerciseData.sessions.findIndex(s => s.timestamp === timestamp);
        if (index === -1) return;

        const session = exerciseData.sessions[index];
        exerciseData.totalMinutes -= session.minutes;
        exerciseData.totalCalories -= session.calories;
        exerciseData.sessions.splice(index, 1);
        
        if (exerciseData.sessions.length === 0) {
            delete state.habitData[dateKey].exercise;
        } else {
            state.habitData[dateKey].exercise = exerciseData;
        }

        localStorage.setItem('habitData', JSON.stringify(state.habitData));

        checkExerciseLevelUp();
        updateUI();
        showNotification('운동 세션이 삭제되었습니다.');

    } catch (error) {
        console.error('운동 세션 삭제 오류:', error);
        showNotification('운동 세션 삭제 중 오류가 발생했습니다.', 'error');
    }
}

function renderExerciseSessions() {
    const container = document.getElementById('exerciseSessionsContainer');
    const dateKey = getDateKey(state.currentDate);
    const exerciseData = state.habitData[dateKey]?.exercise;
    
    if (!exerciseData || !exerciseData.sessions || exerciseData.sessions.length === 0) {
        container.innerHTML = '<div class="text-sm text-gray-500 text-center py-4">아직 운동 기록이 없습니다.</div>';
        return;
    }
    
    const sortedSessions = [...exerciseData.sessions].sort((a, b) => a.timestamp - b.timestamp);
    
    container.innerHTML = sortedSessions.map(session => {
        const time = formatTime(session.timestamp);
        return `
            <div class="session-item flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div class="flex items-center space-x-3">
                    <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span class="text-sm font-medium text-gray-800">${time} 세션</span>
                </div>
                <div class="flex items-center space-x-3">
                     <div class="text-sm text-gray-600">
                        <span class="font-medium">${session.minutes}분</span>
                        · <span class="font-medium">${session.calories.toLocaleString()}kcal</span>
                     </div>
                    <button onclick="removeExerciseSession(${session.timestamp})" class="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded" title="삭제">
                        ✕
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function updateExerciseSummary() {
    const dateKey = getDateKey(state.currentDate);
    const exerciseData = state.habitData[dateKey]?.exercise;
    const totalMinutes = exerciseData?.totalMinutes || 0;
    const totalCalories = exerciseData?.totalCalories || 0;
    
    document.getElementById('exerciseDailyTotal').textContent = 
        `${totalMinutes}분 · ${totalCalories.toLocaleString()}kcal`;
}

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

// 레벨 업 체크
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

function checkLevelProgress() {
    const currentLevelData = getCurrentLevel();
    const streak = getWritingStreakWithFreeze();
    state.levelProgress = Math.min(streak, currentLevelData.daysRequired);
    localStorage.setItem('levelProgress', state.levelProgress.toString());
}

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

// UI 업데이트
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

        // 레벨 미리보기 업데이트
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
        
        // 연속일 업데이트
        updateStreakUI();
        
        document.getElementById('novel-streak').textContent = getWritingStreak();
        document.getElementById('exercise-streak').textContent = getExerciseStreak();
        
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
        
        // 커스텀 습관 업데이트
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

// UI에서 습관 관련 부분을 업데이트
function updateCustomHabitsInUI() {
    // 전체 진행률 계산에 모든 습관 포함
    const totalHabits = 1 + 1 + customHabits.length; // 글쓰기 + 운동 + 사용자 정의

    // 완료된 항목 수 계산
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

// 날짜 변경
function changeDate(days) {
    const newDate = new Date(state.currentDate);
    newDate.setDate(newDate.getDate() + days);
    state.currentDate = newDate;
    updateUI();
}

// 데이터 내보내기
function exportData() {
    try {
        const exportData = {
            habitData: state.habitData,
            currentLevel: state.currentLevel,
            levelProgress: state.levelProgress,
            currentExerciseLevel: state.currentExerciseLevel,
            streakFreezes: state.streakFreezes,
            lastFreezeUse: state.lastFreezeUse,
            customHabits: customHabits,
            exportDate: new Date().toISOString(),
            version: '3.0'
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        const fileName = `writing_habits_${new Date().toISOString().split('T')[0]}.json`;
        
        link.href = URL.createObjectURL(dataBlob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        
        showNotification('데이터가 성공적으로 다운로드되었습니다!');
        
    } catch (error) {
        console.error('데이터 내보내기 오류:', error);
        showNotification('데이터 내보내기 중 오류가 발생했습니다.', 'error');
    }
}

// 데이터 가져오기
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            let convertedCount = 0;
            
            if (importedData.habitData) {
                const convertedData = {};
                
                Object.keys(importedData.habitData).forEach(dateKey => {
                    const dayData = importedData.habitData[dateKey];
                    convertedData[dateKey] = { ...dayData };
                    
                    // 이전 버전 변환
                    if (dayData.novel !== undefined) {
                        convertedData[dateKey].writing = {
                            completed: dayData.novel,
                            sessions: dayData.novel ? [{
                                timestamp: createTimestamp(new Date(dateKey), 9, 0),
                                minutes: 5,
                                characters: 0
                            }] : [],
                            totalMinutes: dayData.novel ? 5 : 0,
                            totalCharacters: 0
                        };
                        delete convertedData[dateKey].novel;
                        convertedCount++;
                    }
                    else if (convertedData[dateKey].writing && 
                            convertedData[dateKey].writing.minutes !== undefined && 
                            !convertedData[dateKey].writing.sessions) {
                        
                        const writing = convertedData[dateKey].writing;
                        convertedData[dateKey].writing = {
                            completed: writing.completed || false,
                            sessions: writing.completed ? [{
                                timestamp: createTimestamp(new Date(dateKey), 9, 0),
                                minutes: writing.minutes || 0,
                                characters: writing.characters || 0
                            }] : [],
                            totalMinutes: writing.minutes || 0,
                            totalCharacters: writing.characters || 0
                        };
                        convertedCount++;
                    }
                    
                    if (convertedData[dateKey].writing) {
                        convertedData[dateKey].writing = validateAndFixWritingData(convertedData[dateKey].writing);
                    }
                });
                
                state.habitData = { ...state.habitData, ...convertedData };
                localStorage.setItem('habitData', JSON.stringify(state.habitData));
            }
            
            if (importedData.currentLevel) {
                state.currentLevel = Math.max(1, Math.min(importedData.currentLevel, WRITING_LEVELS.length));
                localStorage.setItem('currentLevel', state.currentLevel.toString());
            }
            
            if (importedData.levelProgress !== undefined) {
                state.levelProgress = Math.max(0, importedData.levelProgress);
                localStorage.setItem('levelProgress', state.levelProgress.toString());
            }

            if (importedData.currentExerciseLevel) {
                state.currentExerciseLevel = Math.max(1, Math.min(importedData.currentExerciseLevel, EXERCISE_LEVELS.length));
                localStorage.setItem('currentExerciseLevel', state.currentExerciseLevel.toString());
            }

            if (importedData.streakFreezes !== undefined) {
                state.streakFreezes = Math.max(0, Math.min(importedData.streakFreezes, 5));
                localStorage.setItem('streakFreezes', state.streakFreezes.toString());
            }

            if (importedData.lastFreezeUse) {
                state.lastFreezeUse = importedData.lastFreezeUse;
                localStorage.setItem('lastFreezeUse', state.lastFreezeUse);
            }

            if (importedData.customHabits) {
                customHabits = importedData.customHabits;
                localStorage.setItem('customHabits', JSON.stringify(customHabits));
            }
            
            updateUI();
            
            let message = '데이터를 성공적으로 가져왔습니다!';
            if (convertedCount > 0) {
                message += `\n${convertedCount}개의 이전 기록을 새 형식으로 변환했습니다.`;
            }
            
            alert(message);
            
        } catch (error) {
            console.error('데이터 가져오기 오류:', error);
            alert('파일 형식이 올바르지 않거나 손상되었습니다.');
        }
    };
    
    reader.readAsText(file);
    event.target.value = '';
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
}// 글 근육 레벨 시스템
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

// 연속일 보호막 시스템
function useStreakFreeze() {
    if (state.streakFreezes <= 0) {
        alert('보호막이 부족합니다. 주간 목표를 달성하여 보호막을 충전하세요!');
        return;
    }

    const today = getDateKey(state.currentDate);
    if (state.lastFreezeUse === today) {
        alert('오늘은 이미 보호막을 사용했습니다.');
        return;
    }

    if (confirm('연속일 보호막을 사용하시겠습니까? 오늘의 연속 기록이 보호됩니다.')) {
        state.streakFreezes--;
        state.lastFreezeUse = today;
        
        const dateKey = getDateKey(state.currentDate);
        if (!state.habitData[dateKey]) {
            state.habitData[dateKey] = {};
        }
        state.habitData[dateKey].streakFreeze = true;
        
        localStorage.setItem('streakFreezes', state.streakFreezes.toString());
        localStorage.setItem('lastFreezeUse', state.lastFreezeUse);
        localStorage.setItem('habitData', JSON.stringify(state.habitData));
        
        updateUI();
        alert('✨ 보호막을 사용했습니다! 오늘의 연속 기록이 보호됩니다.');
    }
}

function checkWeeklyGoalAndRewardFreeze() {
    const weekStats = getWeeklyWritingStats();
    const weeklyExerciseStats = getWeeklyExerciseStats();
    const totalWeeklyActivity = weekStats.completedDays + weeklyExerciseStats.completedDays;
    
    if (weekStats.completedDays >= 5 || totalWeeklyActivity >= 6) {
        const currentWeek = getWeekNumber(state.currentDate);
        const lastRewardWeek = localStorage.getItem('lastFreezeRewardWeek');
        
        if (lastRewardWeek !== currentWeek.toString()) {
            state.streakFreezes = Math.min(state.streakFreezes + 1, 5);
            localStorage.setItem('streakFreezes', state.streakFreezes.toString());
            localStorage.setItem('lastFreezeRewardWeek', currentWeek.toString());
            
            setTimeout(() => {
                alert('🎉 주간 목표 달성! 연속일 보호막 1개가 충전되었습니다!');
            }, 500);
        }
    }
}

function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
}

// 사용자 정의 습관 추가
function addCustomHabit() {
    const habitName = prompt('새로운 습관 이름을 입력하세요:');
    if (!habitName || habitName.trim() === '') return;
    
    const habitType = confirm('레벨 시스템을 사용하시겠습니까?\n확인: 레벨 시스템 (횟수 기반)\n취소: 단순 체크 (완료/미완료)');
    
    let habitConfig = {
        id: 'custom_' + Date.now(),
        name: habitName.trim(),
        type: habitType ? 'level' : 'simple',
        color: prompt('습관 색상을 입력하세요 (예: blue, green, red, purple, yellow, pink, indigo):', 'blue') || 'blue',
        description: prompt('습관 설명을 입력하세요 (예: 매일 10분):', '새로운 습관'),
        createdAt: new Date().toISOString()
    };
    
    if (habitType) {
        const targetCount = parseInt(prompt('목표 횟수를 입력하세요 (예: 10):', '10')) || 10;
        
        habitConfig.levels = [
            { level: 1, required: Math.ceil(targetCount * 0.2), title: "시작" },
            { level: 2, required: Math.ceil(targetCount * 0.4), title: "발전" },
            { level: 3, required: Math.ceil(targetCount * 0.6), title: "숙련" },
            { level: 4, required: Math.ceil(targetCount * 0.8), title: "전문" },
            { level: 5, required: targetCount, title: "마스터" }
        ].filter(l => l.required > 0);

        if (habitConfig.levels.length === 0) {
            habitConfig.levels = [{ level: 1, required: 1, title: "최소 시작" }];
        }
        
        habitConfig.currentLevel = 1;
    }
    
    customHabits.push(habitConfig);
    localStorage.setItem('customHabits', JSON.stringify(customHabits));
    
    renderCustomHabits();
    updateUI();
    alert(`"${habitName}" 습관이 추가되었습니다!`);
}

// 사용자 정의 습관 삭제
function removeCustomHabit(habitId) {
    const habit = customHabits.find(h => h.id === habitId);
    if (!habit || !confirm(`정말 "${habit.name}" 습관을 삭제하시겠습니까?`)) return;
    
    customHabits = customHabits.filter(h => h.id !== habitId);
    localStorage.setItem('customHabits', JSON.stringify(customHabits));
    
    Object.keys(state.habitData).forEach(dateKey => {
        delete state.habitData[dateKey][habitId];
        delete state.habitData[dateKey][habitId + '_count'];
    });
    localStorage.setItem('habitData', JSON.stringify(state.habitData));
    
    updateUI();
    alert(`"${habit.name}" 습관이 삭제되었습니다.`);
}

// 사용자 정의 습관 토글
function toggleCustomHabit(habitId) {
    const dateKey = getDateKey(state.currentDate);
    const habit = customHabits.find(h => h.id === habitId);

    if (!habit || habit.type !== 'simple') return;

    if (!state.habitData[dateKey]) {
        state.habitData[dateKey] = {};
    }
    
    state.habitData[dateKey][habitId] = !state.habitData[dateKey][habitId];
    localStorage.setItem('habitData', JSON.stringify(state.habitData));
    
    checkWeeklyGoalAndRewardFreeze();
    updateUI();
}

// 레벨 시스템 습관 카운트 추가
function addCustomHabitCount(habitId) {
    const habit = customHabits.find(h => h.id === habitId);
    if (!habit || habit.type !== 'level') return;
    
    const dateKey = getDateKey(state.currentDate);
    if (!state.habitData[dateKey]) {
        state.habitData[dateKey] = {};
    }
    if (!state.habitData[dateKey][habitId + '_count']) {
        state.habitData[dateKey][habitId + '_count'] = 0;
    }
    
    state.habitData[dateKey][habitId + '_count']++;
    localStorage.setItem('habitData', JSON.stringify(state.habitData));
    
    checkCustomHabitLevelUp(habitId);
    updateUI();
}

// 레벨업 체크
function checkCustomHabitLevelUp(habitId) {
    const habit = customHabits.find(h => h.id === habitId);
    if (!habit || habit.type !== 'level') return;
    
    const stats = getCustomHabitStats(habitId);
    const nextLevel = habit.levels.find(l => l.level === habit.currentLevel + 1);
    if (!nextLevel) return;
    
    if (stats.totalCount >= nextLevel.required) {
        habit.currentLevel++;
        localStorage.setItem('customHabits', JSON.stringify(customHabits));
        
        setTimeout(() => {
            alert(`🎉 "${habit.name}" 레벨업! Lv.${habit.currentLevel} ${nextLevel.title} 달성!`);
        }, 500);
    }
}

// 사용자 정의 습관 통계
function getCustomHabitStats(habitId) {
    let totalCount = 0;
    Object.values(state.habitData).forEach(dayData => {
        if (dayData[habitId + '_count']) {
            totalCount += dayData[habitId + '_count'];
        }
    });
    return { totalCount };
}

// 사용자 정의 습관 렌더링
function renderCustomHabits() {
    const container = document.getElementById('customHabitsContainer');
    if (!container) {
        console.error('customHabitsContainer not found');
        return;
    }
    
    console.log('Rendering custom habits:', customHabits);
    
    const totalHabits = customHabits.length;

    if (totalHabits === 0) {
        container.innerHTML = `
            <div class="bg-white rounded-lg shadow-md p-4 border-2 border-dashed border-gray-300">
                <div class="text-center">
                    <p class="text-gray-600 mb-3">나만의 습관을 추가해보세요!</p>
                    <button onclick="addCustomHabit()" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm">
                        + 새 습관 추가
                    </button>
                </div>
            </div>
        `;
        return;
    }
    
    let habitHTML = customHabits.map(habit => {
        const colorClasses = {
            blue: 'bg-blue-500 border-blue-200',
            green: 'bg-green-500 border-green-200',
            red: 'bg-red-500 border-red-200',
            purple: 'bg-purple-500 border-purple-200',
            yellow: 'bg-yellow-500 border-yellow-200',
            pink: 'bg-pink-500 border-pink-200',
            indigo: 'bg-indigo-500 border-indigo-200'
        };
        
        const safeColor = colorClasses[habit.color] ? habit.color : 'blue';
        const classes = colorClasses[safeColor];
        const classParts = classes.split(' ');
        
        const dateKey = getDateKey(state.currentDate);
        const isDone = state.habitData[dateKey]?.[habit.id] || false;
        
        const btnClass = isDone ? classes : 'bg-gray-200 border-gray-200';
        
        let statusText = habit.description || '반복적인 활동';
        let extraControls = '';
        
        if (habit.type === 'level') {
            const stats = getCustomHabitStats(habit.id);
            const currentLevelData = habit.levels.find(l => l.level === habit.currentLevel) || habit.levels[0];
            const nextLevel = habit.levels.find(l => l.level === habit.currentLevel + 1);
            
            const nextRequired = nextLevel ? nextLevel.required : (currentLevelData.required || 1);

            statusText = `Lv.${habit.currentLevel} | 다음 레벨까지: ${stats.totalCount} / ${nextRequired}회`;
            extraControls = `                
                <button onclick="subtractCustomHabitCount('${habit.id}')" class="px-2 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors" title="횟수 감소">-1</button>
                <button onclick="addCustomHabitCount('${habit.id}')" class="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors" title="횟수 추가">+1</button>
            `;
        }
        
        return `
            <div class="bg-white rounded-lg shadow-md p-4 border-l-4 ${classParts[1]}">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <div class="w-3 h-3 rounded-full ${classParts[0]}"></div>
                        <div>
                            <h4 class="font-semibold text-gray-800">${habit.name}</h4>
                            <p class="text-xs text-gray-600">${statusText}</p>
                        </div>
                    </div>
                    <div class="flex items-center space-x-2">
                        ${extraControls}
                        ${habit.type === 'simple' ? `
                            <button onclick="toggleCustomHabit('${habit.id}')" class="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${btnClass} ${isDone ? 'text-white shadow-lg' : 'text-gray-500 hover:bg-gray-300'}">
                                <span class="text-xl">${isDone ? '✓' : '✗'}</span>
                            </button>` : ''
                        }
                        <button onclick="removeCustomHabit('${habit.id}')" class="text-red-400 hover:text-red-600 text-xs" title="습관 삭제">✕</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    habitHTML += `
        <div class="bg-white rounded-lg shadow-md p-4 border-2 border-dashed border-gray-300">
            <div class="text-center">
                <button onclick="addCustomHabit()" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm">
                    + 새 습관 추가
                </button>
            </div>
        </div>
    `;
    
    container.innerHTML = habitHTML;
}

// 연속일 계산 함수들
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

// 연속일 상태 메시지 업데이트
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

// 유틸리티 함수들
function getDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDate(date) {
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
    };
    return date.toLocaleDateString('ko-KR', options);
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

function getCurrentLevel() {
    return WRITING_LEVELS.find(level => level.level === state.currentLevel) || WRITING_LEVELS[0];
}

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

function createEmptyWritingData() {
    return {
        completed: false,
        sessions: [],
        totalMinutes: 0,
        totalCharacters: 0
    };
}

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

function createTimestamp(date, hours = null, minutes = null) {
    const newDate = new Date(date);
    if (hours !== null) newDate.setHours(hours);
    if (minutes !== null) newDate.setMinutes(minutes);
    return newDate.getTime();
}

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

function isExerciseDone() {
    const dateKey = getDateKey(state.currentDate);
    const exerciseData = state.habitData[dateKey]?.exercise;
    return exerciseData && exerciseData.sessions && exerciseData.sessions.length > 0;
}

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

function subtractCustomHabitCount(habitId) {
    const habit = customHabits.find(h => h.id === habitId);
    if (!habit || habit.type !== 'level') return;

    const dateKey = getDateKey(state.currentDate);
    let currentCount = state.habitData[dateKey]?.[habitId + '_count'] || 0;

    if (currentCount > 0) {
        state.habitData[dateKey][habitId + '_count'] = currentCount - 1;
        localStorage.setItem('habitData', JSON.stringify(state.habitData));

        // 레벨 다운 체크 (선택적: 복잡하므로 보통은 수동으로만 카운트를 줄임)

        updateUI();
        showNotification('카운트가 1 감소되었습니다.');
    }
}