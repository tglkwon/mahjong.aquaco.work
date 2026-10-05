import React from 'react';

type Section = [string, string];
type PolicyCopy = {
  title: string;
  notice: string;
  termsTitle: string;
  privacyTitle: string;
  terms: Section[];
  privacy: Section[];
  retentionTitle: string;
  columns: [string, string];
  retention: Section[];
  retentionNote: string;
  pending: string;
};

const copy: Record<'ko' | 'en' | 'ja', PolicyCopy> = {
  ko: {
    title: '서비스 이용약관·개인정보 처리방침 개정안',
    notice: '시행 전 개정안 · 작성일 2026-10-05\n아래 내용은 앞으로 적용할 정책의 검토안이며 아직 시행되지 않았습니다. 학습 목적별 동의와 기간별 삭제 절차는 추후 개발 예정입니다. 외부 AI 업체는 미정이며, 이 문안의 게시나 서비스 이용만으로 학습·외부 제공에 동의한 것으로 간주하지 않습니다.',
    termsTitle: '서비스 이용약관 개정안',
    privacyTitle: '개인정보 처리방침 개정안',
    terms: [
      ['1. 목적과 운영', '아쿠아컴퍼니의 마작 월드(이하 “서비스”)는 마작 점수 기록·공유, 점수판 인식, 대기열 및 자리 배정을 지원하는 개인 프로젝트입니다. 이 약관은 운영자와 이용자의 권리·의무 및 이용 조건을 정합니다. 문의는 tglkwon@gmail.com으로 접수합니다.'],
      ['2. 기록과 공유', '일반 대탁 기록표의 입력 내용은 브라우저의 URL 해시에 저장됩니다. URL을 분실하면 기록을 다시 불러오지 못할 수 있고, 공유받은 사람은 해당 기록을 확인할 수 있습니다. 중요한 기록은 별도로 보관하고 불필요한 실명 입력을 피해 주세요. 서버 연동 기능은 참여자 구분, 대기열·자리 배정, 세션 운영과 점수 기록에 필요한 정보를 서버에 저장합니다.'],
      ['3. 사진·영상 인식', '촬영 환경과 점수판 종류에 따라 인식 오류가 발생할 수 있습니다. 기록을 확정하기 전에 점수를 확인하고 수정해 주세요. 처리 위치와 전송·저장 여부는 해당 기능에서 안내합니다. 카메라 권한을 허용한 것만으로 개선 자료 제공이나 외부 모델 학습에 동의한 것으로 간주하지 않습니다.'],
      ['4. 선택적 개선 자료 제공', '사진·영상, 추출 이미지, 정답, 인식 결과·진단 정보 및 게임 기록은 이용자가 선택하여 제공한 경우 점수 인식 모델과 마작 AI 모델의 개발·학습·검증에 사용할 수 있습니다. 점수 인식 개선과 마작 AI 학습의 동의를 구분하고, 외부 업체의 마작 AI 모델 학습은 업체와 목적을 별도로 안내합니다. 제공을 거부해도 일반 점수 기록과 인식 기능을 이용할 수 있습니다. 서버에 저장된 게임 기록을 별도 동의 없이 학습에 전용하지 않습니다. 기존 자료는 당시 안내와 처리 근거를 확인하고 필요한 동의를 받은 뒤 사용합니다.'],
      ['5. 자료의 권리와 이용 범위', '자료의 권리는 원래 권리자에게 있습니다. 운영자는 동의한 목적에 필요한 범위에서 저장·복제·편집·분석하고 모델 개발·학습·검증에 사용합니다. 별도 허락 없이 공개·판매하거나 홍보에 사용하지 않습니다. 외부 업체의 이용 목적·학습 범위·보관 기간·삭제 조건을 별도로 안내합니다. 이용자는 제공할 권한이 있는 자료만 제출하고, 다른 사람의 얼굴·음성·대화·연락처 등 불필요한 개인정보를 제거해 주세요. 운영자는 필요한 권한이 확인되지 않은 부분의 사용을 중단하거나 제거·삭제합니다.'],
      ['6. 서비스 제공과 책임', '운영자는 안정적인 제공과 오류 개선을 위해 노력하지만 중단 없는 제공, 모든 기기에서의 작동 또는 인식 정확성을 보장하지는 않습니다. 유지보수·장애 등으로 기능을 변경하거나 중단하면 가능한 범위에서 안내합니다. 책임은 관계 법령에 따르며 운영자의 고의·과실에 따른 법적 책임과 이용자의 법정 권리를 일괄 면제·제한하지 않습니다.'],
      ['7. 변경과 문의', '변경 내용과 시행일은 서비스에 안내합니다. 추가 동의가 필요한 개인정보 이용·제공 범위 변경은 공지나 계속 이용만으로 동의를 갈음하지 않습니다. 문의: tglkwon@gmail.com. 시행일은 동의·파기 운영과 외부 처리 조건을 확정한 뒤 별도로 공지합니다.'],
    ],
    privacy: [
      ['1. 최소 처리 원칙', '기능 제공에 필요한 최소한의 정보만 처리하며 닉네임에는 별칭을 사용할 수 있습니다. 다른 정보와 결합하여 사람을 알아볼 수 있는 닉네임·기기 식별자도 개인정보로 보호합니다. 일반 기능과 선택적 개선 자료를 구분하고, 개선 자료는 사전 동의를 근거로 처리합니다. 기능별 필수·선택 항목과 법적 근거는 시행 전에 확정하여 공개합니다.'],
      ['2. 항목과 목적', '일반 기록표의 이름·별칭, 점수와 설정은 계산·기록·URL 공유에 사용합니다. 언어, 닉네임·기기 식별자, 점수판 모델 등 브라우저 설정은 설정 유지와 기능 연동에 사용합니다. 서버의 닉네임·식별자·등록 및 갱신 시각, 대기열·자리·세션 정보는 참여자 구분과 운영에 사용합니다. 점수, 참여자 연결 정보, 제출·진행·종료·기록 시각, 인식 신뢰도 및 제출 정보는 기록 관리에 사용합니다. 선택하여 제공한 사진·영상·추출 이미지·정답·진단 정보·게임 기록은 동의한 모델 개발·학습·검증에 사용합니다. 자료는 서버와 운영자의 개인 PC 등 실제 처리 환경에 따라 보관하며 저장·전송 경로의 상세 사항은 시행 전 공개합니다.'],
      ['3. 선택권과 촬영 자료', '카메라 권한, 인식 기능 이용, 개선 자료 제공 및 외부 업체 자체 모델 학습을 구분합니다. 자동 전송도 먼저 안내하고 선택하도록 합니다. 외부 전달 전에 불필요한 얼굴·음성·닉네임·기기 식별자·메타데이터를 제거하거나 최소화합니다. 이름이나 제출자 연결만 지웠다고 익명 자료로 간주하지 않습니다. 법정대리인 동의·확인 절차가 마련되기 전에는 만 14세 미만 이용자의 선택적 학습 자료를 받지 않습니다.'],
      ['4. 외부 처리와 국외 이전', '우리 지시에 따른 처리위탁과 외부 업체의 자체 모델 학습 등 독립적 이용을 구분합니다. 업체별 법인명·연락처·상품·업무, 전달 항목·목적·학습 범위, 이전 국가·시기·방법·법적 근거, 보관 기간·삭제 방식, 거부·철회 방법과 영향을 전달 전에 안내하고 필요한 동의를 받습니다. 업체는 현재 미정입니다. 운영자의 보관 기간이 외부 업체의 모든 저장소·모델에도 동일하게 적용된다고 약속하지 않습니다.'],
      ['5. 파기와 동의 철회', '보관 기간이 끝나거나 목적이 달성되어 불필요해진 개인정보는 지체 없이 복구·재생되지 않도록 파기합니다. 법령상 보존 의무가 있는 정보는 근거·항목·기간을 안내하고 분리 보관합니다. 서버·개인 PC·학습 데이터셋·복제본·백업을 포함하여 삭제하며 복원 시 삭제 정보가 다시 이용되지 않도록 관리합니다. 삭제·철회 요청은 필요한 최소한의 본인 확인 후 관계 법령에 따라 처리하고 향후 학습 중단 및 외부 업체에 필요한 조치를 진행합니다. 이미 학습된 모델의 영향을 제거할 수 있는지와 가능한 조치는 업체·학습 방식별로 사전에 안내하며 법정 권리를 일괄 배제하지 않습니다. 브라우저 및 타인이 보관한 URL 사본은 직접 삭제할 수 없습니다.'],
      ['6. 보호와 권리 행사', '업무상 필요한 인원만 자료에 접근하도록 하고 전송 보호·접근 권한·보관 장치 보호 등 실제 환경에 맞는 조치를 적용합니다. 이용자는 열람·정정·삭제·처리정지·동의 철회를 요청할 수 있고 대리인을 통한 요청은 권한을 확인하여 처리합니다. 문의 및 권리 행사: tglkwon@gmail.com. 담당자 정보와 구체적 보호 조치는 시행 전에 공개합니다.'],
      ['7. 변경', '변경 내용과 시행일을 안내하고 이전 방침을 확인할 수 있도록 보관합니다. 새 방침 게시만으로 기존 자료의 새로운 학습 목적 이용에 동의한 것으로 간주하지 않습니다.'],
    ],
    retentionTitle: '시행 예정 보관 기준',
    columns: ['자료', '기간'],
    retention: [
      ['개선용 원본 사진·영상', '제출일부터 최대 90일'],
      ['추출 이미지·정답·진단 및 동의한 학습용 게임 자료', '원자료 제출일부터 최대 1년'],
      ['서버 닉네임·기기 식별자', '마지막 서버 연동 이용일부터 90일'],
      ['대기열·자리 배정 등 임시 참여 정보', '세션 종료 후 최대 7일 (세션 없는 대기열은 대기 종료 후)'],
      ['서버 게임 기록', '기록 생성일부터 최대 1년'],
      ['브라우저 URL·로컬 저장소', '이용자가 삭제할 때까지'],
    ],
    retentionNote: '이 표는 앞으로 시행할 기준이며 현재 기간별 삭제가 적용됐다는 의미가 아닙니다. 가공·복제로 학습 자료의 기간을 다시 시작하지 않습니다. 게임 기록에 남은 닉네임·식별자 연결도 이용자 정보의 90일 기준에 맞춰 제거합니다. 목적 달성 등으로 불필요해지면 기간 전이라도 파기합니다.',
    pending: '시행 전 확정할 사항: 운영자·개인정보 담당자, 외부 AI 업체와 국외 이전·삭제 조건, 서버·PC·전송 경로, 접속·오류·진단 로그의 세부 항목과 기간, 동의 이력 관리, 백업 삭제 주기, 동의·권리 행사·파기 절차 및 시행일. 준비가 끝난 뒤 최종 방침과 기능별 동의 안내를 공개합니다.',
  },
  en: {
    title: 'Proposed Terms of Service and Privacy Policy',
    notice: 'Draft — not in effect · Prepared 2026-10-05\nPurpose-specific training consent and retention/deletion procedures will be developed later. The external AI provider has not been selected. Publication of this draft or use of the service does not constitute consent to training or external disclosure.',
    termsTitle: 'Proposed Terms of Service',
    privacyTitle: 'Proposed Privacy Policy',
    terms: [
      ['1. Purpose and operation', 'Aquaco’s Mahjong World is a personal project supporting score recording and sharing, scoreboard recognition, queues and seat allocation. These terms describe the rights and obligations of users and the operator. Contact: tglkwon@gmail.com.'],
      ['2. Records and sharing', 'Standard score sheets store entries in the browser URL hash. Losing the URL may prevent recovery; anyone receiving it can view the record. Keep a separate copy of important records and avoid unnecessary real names. Server-connected features store information needed for participant identification, queues, seats, sessions and scores.'],
      ['3. Recognition', 'Recognition may be inaccurate depending on the camera environment and scoreboard. Check and correct scores before confirming them. Each feature explains where media is processed and whether it is transmitted or stored. Camera permission alone is not consent to improvement-data collection or external model training.'],
      ['4. Optional contributions', 'Voluntarily contributed media, extracted images, labels, recognition results, diagnostics and game records may be used to develop, train and evaluate scoreboard recognition and mahjong AI models. Consent for recognition improvement and mahjong AI training is separate. Training an external provider’s mahjong AI requires an explanation of that provider and purpose. Refusal does not restrict ordinary recording or recognition. Operational game records are not repurposed for training without separate consent. Existing material requires review of its original notice and lawful basis, with new consent where necessary.'],
      ['5. Rights and permitted use', 'Rights remain with their original owners. Storage, copying, editing, analysis and training are limited to the agreed purposes. Material is not published, sold or used for promotion without separate permission. External purposes, training scope, retention and deletion conditions are disclosed separately. Submit only material you are entitled to provide and remove unnecessary faces, voices, conversations and contact details. Unauthorized portions are excluded or deleted.'],
      ['6. Availability and liability', 'The operator works to improve reliability but does not guarantee uninterrupted service, operation on every device or recognition accuracy. Changes and interruptions are announced where feasible. Liability follows applicable law; these terms do not generally exclude liability for intentional or negligent conduct or users’ statutory rights.'],
      ['7. Changes and contact', 'Changes and the effective date are announced in the service. Continued use or a notice alone does not replace any additional consent required for changed data use or disclosure. Contact: tglkwon@gmail.com. The effective date will be announced after consent, deletion and external-processing arrangements are ready.'],
    ],
    privacy: [
      ['1. Minimization and grounds', 'Only information needed for the feature is processed; aliases can be used. Nicknames and device identifiers that can identify someone when combined with other information are protected as personal data. Optional improvement data is processed with prior consent. Required/optional fields and legal grounds will be finalized before the policy takes effect.'],
      ['2. Information and purposes', 'Names or aliases, scores and settings support local records and URL sharing. Browser settings include language, nickname/device identifier and scoreboard preferences. Server identifiers, nicknames, registration/update times, queue, seat and session information support participation. Scores, participant links, submission/start/end/record times, recognition confidence and submission details support game records. Optional media, extracted images, labels, diagnostics and game records support the agreed AI development and training purposes. Storage includes the server and the operator’s personal PC as applicable; the detailed storage and transmission arrangements will be disclosed before implementation.'],
      ['3. Choice and media', 'Camera access, recognition, contribution and external providers’ own training are separate choices. Automatic uploads require advance explanation and choice. Unnecessary faces, voices, nicknames, device identifiers and metadata are removed or minimized before external transfer. Removing a name or contributor link alone does not establish anonymity. Optional training contributions from children under 14 are not accepted until parental consent and verification procedures are ready.'],
      ['4. External processing and international transfers', 'Processing on our instructions is distinguished from independent use such as a provider’s own model training. Before transfer, disclose the provider’s legal name/contact/product/task, fields/purpose/training scope, countries/timing/method/legal grounds, retention/deletion and refusal/withdrawal methods and effects, and obtain required consent. No provider is selected yet. Our retention periods are not a promise covering every external store or trained model.'],
      ['5. Deletion and withdrawal', 'Personal data is irreversibly deleted without delay when its period expires or it becomes unnecessary. Any statutory preservation is identified and kept separately. Deletion covers operator-managed servers, PCs, datasets, copies and backups; restores must not reintroduce deleted data. Requests receive minimal necessary identity verification and handling under applicable law, including stopping future training and required action with providers. The ability to remove effects from completed training and available measures are explained for each provider and training method without excluding statutory rights. Browser data and URL copies held by others cannot be directly deleted by the operator.'],
      ['6. Protection and rights', 'Access is restricted to personnel who need it, with transmission, access and storage safeguards appropriate to the environment. Users can request access, correction, deletion, restriction and consent withdrawal; representatives’ authority is verified. Contact: tglkwon@gmail.com. Responsible-person details and concrete safeguards will be disclosed before implementation.'],
      ['7. Changes', 'Changes and effective dates are announced and prior policies remain available. Publishing a new policy does not imply consent to new training uses of old material.'],
    ],
    retentionTitle: 'Planned retention periods', columns: ['Material', 'Period'],
    retention: [
      ['Original improvement photos/videos', 'Up to 90 days from submission'],
      ['Extracted images, labels, diagnostics and consented training game data', 'Up to 1 year from original submission'],
      ['Server nicknames/device identifiers', '90 days from last use of a server-connected feature'],
      ['Temporary queue/seat/participation data', 'Up to 7 days after session end (queue exit for unassigned entries)'],
      ['Server game records', 'Up to 1 year from creation'],
      ['Browser URL/local storage', 'Until deleted by the user'],
    ],
    retentionNote: 'These are planned periods, not a statement that timed deletion already operates. Processing or copying does not restart the training-data period. Nickname/identifier links in game records follow the 90-day user-information rule. Data is deleted earlier if no longer necessary.',
    pending: 'Before implementation: finalize operator/privacy contact, AI providers and international transfer/deletion conditions, server/PC/transmission locations, access/error/diagnostic fields and periods, consent records, backup deletion, consent/rights/deletion procedures and effective date. Publish the final policy and feature-specific consent notices after preparation.',
  },
  ja: {
    title: '利用規約・プライバシーポリシー改定案',
    notice: '施行前の改定案 · 作成日 2026-10-05\n目的別の学習同意と保存期間に応じた削除手続きは今後開発予定です。外部AI事業者は未定です。この案の掲載やサービスの利用をもって学習・外部提供への同意とはみなしません。',
    termsTitle: '利用規約改定案', privacyTitle: 'プライバシーポリシー改定案',
    terms: [
      ['1. 目的と運営', 'アクアカンパニーの麻雀ワールドは、点数記録・共有、点数表示の認識、待機列・座席割当を支援する個人プロジェクトです。本規約は運営者と利用者の権利・義務および利用条件を定めます。お問い合わせ：tglkwon@gmail.com。'],
      ['2. 記録と共有', '通常の記録表はブラウザのURLハッシュに保存します。URLを失うと復元できない場合があり、共有先は記録を閲覧できます。重要な記録は別途保存し、不必要な実名入力は避けてください。サーバー連携機能は参加者識別、待機列・座席・セッション運営、点数記録に必要な情報をサーバーに保存します。'],
      ['3. 写真・動画認識', '撮影環境や卓の種類により誤認識が生じます。確定前に点数を確認・修正してください。処理場所と送信・保存の有無は各機能で案内します。カメラ権限の許可だけで改善資料提供や外部モデル学習への同意とはみなしません。'],
      ['4. 任意の改善資料提供', '任意に提供した写真・動画、抽出画像、正解、認識結果・診断情報、対局記録を点数認識モデルと麻雀AIモデルの開発・学習・検証に使用できます。点数認識改善と麻雀AI学習の同意を区別し、外部事業者の麻雀AI学習は事業者と目的を別途案内します。拒否しても通常の記録・認識を利用できます。運営用の対局記録を別途同意なしに学習へ転用しません。既存資料は当時の案内と処理根拠を確認し、必要な同意を得て利用します。'],
      ['5. 資料の権利と利用範囲', '権利は元の権利者に帰属します。同意した目的に必要な範囲で保存・複製・編集・分析・開発・学習・検証を行います。別途許可なく公開・販売・宣伝利用しません。外部事業者の目的・学習範囲・保存期間・削除条件を案内します。提供権限のある資料のみ提出し、他人の顔・声・会話・連絡先などを除去してください。必要な権限が確認できない部分は利用停止・除去・削除します。'],
      ['6. 提供と責任', '安定運営と改善に努めますが、無停止、すべての端末での動作、認識精度は保証しません。変更・中断は可能な範囲で案内します。責任は適用法令に従い、故意・過失による法的責任や利用者の法定権利を一律に免除・制限しません。'],
      ['7. 変更とお問い合わせ', '変更内容と施行日を案内します。追加同意が必要な利用・提供範囲の変更は、告知や継続利用で同意に代えません。お問い合わせ：tglkwon@gmail.com。施行日は同意・削除運用と外部処理条件の準備後に告知します。'],
    ],
    privacy: [
      ['1. 最小限の処理', '機能に必要な最小限の情報を処理し、ニックネームは別名を使用できます。他の情報との組合せで個人を識別できるニックネーム・端末識別子も個人情報として保護します。任意の改善資料は事前同意に基づき処理します。機能別の必須・任意項目と法的根拠は施行前に確定・公開します。'],
      ['2. 項目と目的', '通常記録表の名前・別名・点数・設定は計算・記録・URL共有に使用します。言語、ニックネーム・端末識別子、卓モデル等のブラウザ設定は設定維持・連携に使用します。サーバーの識別子・ニックネーム・登録更新時刻、待機列・座席・セッション情報は参加者識別と運営に使用します。点数、参加者との関連、提出・開始・終了・記録時刻、認識信頼度、提出情報は記録管理に使用します。任意提供した媒体・抽出画像・正解・診断・対局記録は同意したモデル開発・学習・検証に使用します。保存先にはサーバーと運営者の個人PC等が含まれ、保存・送信経路の詳細は施行前に公開します。'],
      ['3. 選択と撮影資料', 'カメラ権限、認識利用、改善資料提供、外部事業者独自の学習を区別します。自動送信も事前案内と選択を行います。外部送信前に不要な顔・声・ニックネーム・端末識別子・メタデータを除去・最小化します。名前や提出者との関連の除去のみでは匿名とみなしません。法定代理人の同意・確認手続きの準備までは14歳未満の任意学習資料を受け付けません。'],
      ['4. 外部処理と国外移転', '当方の指示による委託と、事業者自身のモデル学習等の独立した利用を区別します。送信前に法人名・連絡先・商品・業務、項目・目的・学習範囲、国・時期・方法・法的根拠、保存期間・削除方法、拒否・撤回方法と影響を案内し、必要な同意を取得します。事業者は未定です。当方の保存期間が外部の全保存先や学習済みモデルに同じく適用されるとは約束しません。'],
      ['5. 削除と撤回', '期間満了や目的達成で不要となった個人情報は遅滞なく復元・再生できないよう削除します。法定保存は根拠・項目・期間を案内し分離保管します。対象は管理下のサーバー・PC・学習データ・複製・バックアップを含み、復元で削除情報を再利用しないよう管理します。最小限の本人確認後、法令に従って削除・撤回要求と将来の学習停止、外部事業者への必要な措置を行います。学習済みモデルへの影響を除去できるかと措置は事業者・学習方式別に事前案内し、法定権利を一律に排除しません。ブラウザや他人のURLコピーは直接削除できません。'],
      ['6. 保護と権利', '必要な担当者のみにアクセスを制限し、送信・アクセス権・保存装置等を実環境に応じて保護します。閲覧・訂正・削除・処理停止・同意撤回を請求でき、代理人の権限を確認して対応します。窓口：tglkwon@gmail.com。担当者と具体的な保護措置は施行前に公開します。'],
      ['7. 変更', '変更内容と施行日を案内し、過去の方針も確認できるよう保存します。新方針の掲載だけで既存資料の新たな学習利用に同意したとはみなしません。'],
    ],
    retentionTitle: '施行予定の保存基準', columns: ['資料', '期間'],
    retention: [
      ['改善用の原本写真・動画', '提出から最大90日'],
      ['抽出画像・正解・診断・同意した学習用対局資料', '元資料の提出から最大1年'],
      ['サーバーのニックネーム・端末識別子', 'サーバー連携の最終利用から90日'],
      ['待機列・座席等の一時参加情報', 'セッション終了後最大7日（未割当の待機列は待機終了後）'],
      ['サーバー対局記録', '作成から最大1年'],
      ['ブラウザURL・ローカルストレージ', '利用者が削除するまで'],
    ],
    retentionNote: '予定の基準であり、期間別削除が既に稼働しているという意味ではありません。加工・複製で学習資料の期間を再開しません。対局記録のニックネーム・識別子との関連も90日の基準で除去します。不要となれば期間前でも削除します。',
    pending: '施行前に確定する事項：運営者・担当者、外部AI事業者と国外移転・削除条件、サーバー・PC・送信経路、接続・エラー・診断情報の項目と期間、同意履歴、バックアップ削除、同意・権利行使・削除手続き、施行日。準備後に最終方針と機能別同意案内を公開します。',
  },
};

function Sections({ sections }: { sections: Section[] }) {
  return <>{sections.map(([title, body]) => (
    <section key={title} className="space-y-2">
      <h4 className="font-semibold text-gray-800">{title}</h4>
      <p className="leading-relaxed">{body}</p>
    </section>
  ))}</>;
}

export default function LegalDraft({ language = 'ko' }: { language?: string }) {
  const text = copy[language === 'en' || language === 'ja' ? language : 'ko'];
  return (
    <section className="p-4 sm:p-6 border-b text-gray-600 space-y-6" aria-labelledby="legal-draft-title">
      <h2 id="legal-draft-title" className="text-xl font-bold text-purple-700">{text.title}</h2>
      <p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900 whitespace-pre-line leading-relaxed">{text.notice}</p>
      <div className="space-y-5">
        <h3 className="text-lg font-bold text-gray-800">{text.termsTitle}</h3>
        <Sections sections={text.terms} />
      </div>
      <div className="space-y-5">
        <h3 className="text-lg font-bold text-gray-800">{text.privacyTitle}</h3>
        <Sections sections={text.privacy} />
      </div>
      <section className="space-y-3">
        <h3 className="text-lg font-bold text-gray-800">{text.retentionTitle}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead><tr>{text.columns.map(column => <th key={column} scope="col" className="border p-3 text-left bg-gray-50">{column}</th>)}</tr></thead>
            <tbody>{text.retention.map(([item, period]) => <tr key={item}><th scope="row" className="border p-3 text-left font-medium">{item}</th><td className="border p-3">{period}</td></tr>)}</tbody>
          </table>
        </div>
        <p className="text-sm leading-relaxed">{text.retentionNote}</p>
      </section>
      <p className="rounded-lg bg-gray-50 p-4 text-sm leading-relaxed">{text.pending}</p>
    </section>
  );
}
