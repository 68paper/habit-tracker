// ============================================
// 글 근육 습관 추적기 v3.0 - 사용자 정의 습관 관리
// ============================================

// 새 습관 추가
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

// 습관 삭제
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

// 단순 습관 토글
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

// 레벨형 습관 카운트 증가
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

// 레벨형 습관 카운트 감소
function subtractCustomHabitCount(habitId) {
    const habit = customHabits.find(h => h.id === habitId);
    if (!habit || habit.type !== 'level') return;

    const dateKey = getDateKey(state.currentDate);
    let currentCount = state.habitData[dateKey]?.[habitId + '_count'] || 0;

    if (currentCount > 0) {
        state.habitData[dateKey][habitId + '_count'] = currentCount - 1;
        localStorage.setItem('habitData', JSON.stringify(state.habitData));

        updateUI();
        showNotification('카운트가 1 감소되었습니다.');
    }
}

// 커스텀 습관 레벨업 체크
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

// 커스텀 습관 통계
function getCustomHabitStats(habitId) {
    let totalCount = 0;
    Object.values(state.habitData).forEach(dayData => {
        if (dayData[habitId + '_count']) {
            totalCount += dayData[habitId + '_count'];
        }
    });
    return { totalCount };
}

// 커스텀 습관 렌더링
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
