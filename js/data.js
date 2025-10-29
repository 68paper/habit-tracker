// ============================================
// 글 근육 습관 추적기 v3.0 - 데이터 관리
// ============================================

// 데이터 내보내기 (다운로드)
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

// 데이터 가져오기 (업로드)
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
                    
                    // 이전 버전 변환 (v1.0 -> v3.0)
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
                    // 이전 버전 변환 (v2.0 -> v3.0)
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
