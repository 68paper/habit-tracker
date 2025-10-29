// ============================================
// 글 근육 습관 추적기 v3.0 - 세션 관리
// ============================================

// ========== 글쓰기 세션 관리 ==========

// 세션 목록 렌더링
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

// 세션 추가 (자동 완료 + 축하 알림 추가)
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
        const currentLevel = getCurrentLevel();
        const wasCompleted = writingData.completed;
        
        const newSession = {
            timestamp: Date.now(),
            minutes: minutes,
            characters: characters
        };
        
        writingData.sessions.push(newSession);
        writingData.totalMinutes += minutes;
        writingData.totalCharacters += characters;
        
        // 🎉 자동 완료 로직: 목표 시간 달성 시 자동으로 completed = true
        const justCompletedGoal = !wasCompleted && writingData.totalMinutes >= currentLevel.minutes;
        
        if (justCompletedGoal) {
            writingData.completed = true;
        }
        
        if (saveWritingData(state.currentDate, writingData)) {
            document.getElementById('sessionMinutes').value = '';
            document.getElementById('sessionCharacters').value = '';
            
            // 목표 달성 시 레벨업 체크 및 보호막 확인
            if (justCompletedGoal) {
                checkLevelUp();
                checkWeeklyGoalAndRewardFreeze();
                
                // 🎉 축하 알림!
                setTimeout(() => {
                    alert(`🎉 축하합니다!\n\n오늘 목표 ${currentLevel.minutes}분을 달성했습니다!\n작성 시간: ${writingData.totalMinutes}분\n작성 글자: ${writingData.totalCharacters.toLocaleString()}자\n\n계속해서 멋진 글쓰기를 이어가세요! ✍️`);
                }, 300);
            }
            
            updateUI();
            
            if (!justCompletedGoal) {
                showNotification('세션이 추가되었습니다!');
            }
        }
        
    } catch (error) {
        console.error('세션 추가 오류:', error);
        showNotification('세션 추가 중 오류가 발생했습니다.', 'error');
    }
}

// 세션 수정
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
        
        // 수정 후 목표 미달 시 자동으로 completed = false
        const currentLevel = getCurrentLevel();
        if (writingData.completed && writingData.totalMinutes < currentLevel.minutes) {
            writingData.completed = false;
        }
        // 수정 후 목표 달성 시 자동으로 completed = true
        else if (!writingData.completed && writingData.totalMinutes >= currentLevel.minutes) {
            writingData.completed = true;
            setTimeout(() => {
                alert(`🎉 수정 후 목표 달성!\n\n목표 ${currentLevel.minutes}분을 달성했습니다!`);
            }, 300);
        }
        
        if (saveWritingData(state.currentDate, writingData)) {
            if (writingData.completed) {
                checkLevelUp();
                checkWeeklyGoalAndRewardFreeze();
            } else {
                checkLevelProgress();
            }
            updateUI();
            showNotification('세션이 수정되었습니다!');
        }
        
    } catch (error) {
        console.error('세션 수정 오류:', error);
        showNotification('세션 수정 중 오류가 발생했습니다.', 'error');
    }
}

// 세션 삭제
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
        
        // 삭제 후 목표 미달 시 자동으로 completed = false
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

// 하루 완료 상태 토글 (수동 토글용 - 버튼 클릭 시)
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
            if (writingData.completed) {
                checkLevelUp();
                checkWeeklyGoalAndRewardFreeze();
                showNotification('🎉 오늘 목표를 달성했습니다!');
            }
            updateUI();
        }
        
    } catch (error) {
        console.error('완료 상태 변경 오류:', error);
        showNotification('완료 상태 변경 중 오류가 발생했습니다.', 'error');
    }
}

// ========== 운동 세션 관리 ==========

// 운동 세션 추가
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

// 운동 세션 삭제
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

// 운동 세션 렌더링
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

// 운동 요약 업데이트
function updateExerciseSummary() {
    const dateKey = getDateKey(state.currentDate);
    const exerciseData = state.habitData[dateKey]?.exercise;
    const totalMinutes = exerciseData?.totalMinutes || 0;
    const totalCalories = exerciseData?.totalCalories || 0;
    
    document.getElementById('exerciseDailyTotal').textContent = 
        `${totalMinutes}분 · ${totalCalories.toLocaleString()}kcal`;
}
