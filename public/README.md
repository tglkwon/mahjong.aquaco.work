# 일본의 리치 마작에 관련된 이것저것들 만든 사이트입니다.

## 현재는 대탁 기록용 페이지와 대탁 기록용 페이지 우마, 오카가 서비스 중입니다.
대탁 기록용 페이지는 친구들끼리 편하게 대탁하고 그 결과만 간단히 기록하기 위한 페이지입니다.
서버에 저장되는 것이 없으니 걱정 없이 편하게 이용하셔도 됩니다.
백엔드 없이 프론트로만 동작합니다.
기록 다하고 공유 버튼 누르면 자동으로 현재 페이지로 갈 수 있는 링크가 복사됩니다.
다만 링크의 주소에 페이지 내용이 저장되므로 링크를 잃어버리면 복구할 수 없습니다.

## 대탁 기록용 페이지의 새로운 기능으로 작탁의 점수표시판의 사진을 업로드하면 점수를 자동으로 입력하는 페이지를 개발중입니다.
다른 대탁 기록용 페이지처럼 대탁 점수 기록 자체는 저장하지 않지만, 이미지 처리를 위해 업로드되는 사진은 서버에 저장됩니다.

### 1.3v URL 압축 및 UX 개선 250805
- 데이터 구조 최적화 및 pako 라이브러리 압축 적용으로 공유 URL 길이 단축
- 우마/오카 페이지에서 플레이어 4명 선택 및 중복 여부 확인 로직 추가
- 기록 추가 버튼 비활성화 시 사유를 알려주는 팝업 메시지 기능 추가

### 1.0v finish beta /set_score_umaoka, make beta /set_score_photo 250624
### 0.99v input type reset, make sidebar, make about page, merge Add Record & Share button 250622
### 0.98v input type inputmode test 250622
### 0.97v /set_score_umaoka 250621
### 0.96v make uma, oka function 250621
### 0.95v split /set_score, /set_score_umaoka 250621
### 0.92v make player's position
### 0.91v fix mobile view, reset numbering in table 250612