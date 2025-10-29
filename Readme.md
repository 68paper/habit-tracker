# 📝 글 근육 습관 추적기 v3.0

> 프로작가를 향한 여정 - 글 근육을 키우는 점진적 훈련 시스템

![Version](https://img.shields.io/badge/version-3.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ 주요 기능

### 🎯 자동 완료 시스템
- 목표 시간 달성 시 **자동으로 완료 처리**
- 축하 알림 팝업으로 성취감 극대화
- 더 이상 수동 버튼 클릭 불필요!

### 📊 레벨 시스템
- **11단계 글쓰기 레벨**: 5분부터 240분까지
- **6단계 운동 레벨**: 5회부터 100회까지
- 점진적 난이도 상승으로 무리 없는 성장

### 🔥 연속기록 추적
- 매일 글쓰기 연속일 기록
- 운동 연속일 별도 관리
- 전체 활동 연속일 통계

### 🛡️ 연속일 보호막
- 하루 쉬어도 연속기록 유지
- 주간 목표 달성 시 보호막 획득
- 최대 5개까지 보유 가능

### 📈 상세 통계
- 주간/월간 글쓰기 통계
- 평균 작성 시간 및 글자 수
- 최장 연속기록 추적
- 시각적 진행도 표시

### 🎨 사용자 정의 습관
- 나만의 습관 무제한 추가
- 단순 체크형 / 레벨 시스템형 선택
- 색상 커스터마이징

---

## 🚀 빠른 시작

### 온라인에서 바로 사용
👉 **[여기를 클릭하여 바로 시작](https://your-username.github.io/writing-habit-tracker)** (GitHub Pages 링크로 교체하세요)

### 로컬에서 실행

1. **다운로드**
   ```bash
   git clone https://github.com/your-username/writing-habit-tracker.git
   cd writing-habit-tracker
   ```

2. **실행**
   - `index.html` 파일을 브라우저에서 열기
   - 또는 Live Server 등의 로컬 서버 사용

3. **완료!**
   - 데이터는 브라우저 LocalStorage에 자동 저장됩니다

---

## 📁 프로젝트 구조

```
writing-habit-tracker/
├── index.html              # 메인 HTML 파일
├── js/
│   ├── config.js           # 설정 및 초기화
│   ├── utils.js            # 유틸리티 함수
│   ├── sessions.js         # 세션 관리 (자동 완료 기능)
│   ├── habits.js           # 사용자 정의 습관
│   ├── progression.js      # 레벨 및 연속기록
│   ├── analytics.js        # 통계 및 UI 업데이트
│   └── data.js             # 데이터 관리
└── README.md
```

---

## 💡 사용 방법

### 1. 글쓰기 기록하기
1. **세션 추가**: 작업 후 시간과 글자 수 입력
2. **자동 완료**: 목표 시간 달성 시 자동으로 완료! 🎉
3. **축하 알림**: 성취를 축하하는 팝업 표시

### 2. 레벨업 하기
- 연속으로 목표를 달성하면 자동 레벨업
- 레벨이 오를수록 목표 시간 증가
- 점진적으로 글 근육 키우기

### 3. 습관 추가하기
- 하단 "새 습관 추가" 버튼 클릭
- 습관 이름, 타입, 색상 설정
- 매일 체크하며 실천하기

### 4. 데이터 백업
- 하단 "데이터 내보내기" 버튼
- JSON 파일로 다운로드
- 다른 브라우저에서 복원 가능

---

## 🆕 버전 3.0 업데이트 내용

### 새로운 기능
- ✅ **자동 완료 시스템**: 목표 달성 시 자동으로 완료 처리
- ✅ **축하 알림**: 성취 순간을 축하하는 팝업
- ✅ **모듈화 구조**: 7개 파일로 분리되어 유지보수 용이
- ✅ **세션 관리**: 하루 동안 여러 세션 추가 가능

### 버그 수정
- 🐛 연속기록 표시 오류 수정 (보호막 미적용 문제)
- 🐛 데이터 검증 로직 강화

### 개선 사항
- 🎨 UI/UX 개선
- ⚡ 성능 최적화
- 📱 반응형 디자인 개선

---

## 🛠️ 기술 스택

- **Frontend**: HTML5, CSS3 (Tailwind CSS), Vanilla JavaScript
- **Storage**: LocalStorage API
- **Design**: Tailwind CSS v3

---

## 📊 통계 예시

| 항목 | 값 |
|------|-----|
| 누적 작성 시간 | 1,234분 |
| 누적 작성 글자 | 45,678자 |
| 최장 연속기록 | 21일 |
| 현재 레벨 | Lv.5 지속 작가 |

---

## ⚠️ 주의사항

### 데이터 백업
- 브라우저 LocalStorage 사용으로 **캐시 삭제 시 데이터 손실**
- 주기적으로 "데이터 내보내기"로 백업 권장
- JSON 파일을 안전한 곳에 보관하세요

### 브라우저 호환성
- Chrome, Edge, Firefox, Safari 최신 버전 지원
- Internet Explorer는 지원하지 않습니다

### 개인정보
- 모든 데이터는 **로컬에만 저장**됩니다
- 서버 전송 없음, 완전한 오프라인 작동

---

## 🤝 기여하기

버그 리포트, 기능 제안, Pull Request 모두 환영합니다!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

---

## 👤 만든이

**Your Name**
- GitHub: [@your-username](https://github.com/your-username)
- Email: your.email@example.com

---

## 🙏 감사의 말

이 프로젝트는 다음 기술들을 사용했습니다:
- [Tailwind CSS](https://tailwindcss.com/) - UI 프레임워크
- [Claude AI](https://www.anthropic.com/) - 개발 지원

---

## 📝 변경 이력

### v3.0 (2025-10-29)
- 자동 완료 시스템 추가
- 축하 알림 기능
- 모듈화 구조로 전환
- 세션 관리 시스템

### v2.0 (2025-09-XX)
- 사용자 정의 습관 추가
- 운동 기록 기능
- 보호막 시스템

### v1.0 (2025-08-XX)
- 초기 릴리즈
- 기본 글쓰기 추적 기능

---

## 🎯 로드맵

- [ ] 모바일 앱 버전
- [ ] 클라우드 동기화
- [ ] 통계 차트 시각화
- [ ] 다크 모드
- [ ] 다국어 지원

---

## ⭐ Star History

프로젝트가 마음에 드셨다면 ⭐ Star를 눌러주세요!

---

**Happy Writing!** ✍️