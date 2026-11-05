import React from 'react';
import { buildGroupedSequenceRows } from './loadingSheetUtils';
import { FloorPlanPrintSvg } from './FloorPlanPrintSvg';
import { ShoringCrossSectionSvg } from './ShoringCrossSectionSvg';

/**
 * 단일 호기 A4 가로 1장 완성 지시서 컴포넌트
 */
export function SingleLoadingSheetPage({ container, totalContainers }) {
  const spec = container.spec;
  const placedPallets = container.placedPallets || [];
  const fieldDiag = container.fieldDiagnostics || {};
  const doorGuide = fieldDiag.doorShoringGuide;
  const seqRows = buildGroupedSequenceRows(container);
  const bomList = fieldDiag.shoringBOM || [];

  // 품목별 파레트 수 요약 텍스트
  const skuSummary =
    container.skuBreakdown
      ?.map((s) => `${s.name.split(' (')[0]} ${s.palletCount}PLT`)
      .join(', ') || '';

  // 1단적 vs 2단적 문구
  const stackTypeDesc =
    container.tier2Count > 0
      ? `2단 적재 (1단 ${container.tier1Count}PLT + 2단 ${container.tier2Count}PLT)`
      : '1단 평적 (바닥 전방 밀착)';

  // 포크 진입면 안내
  const is1200T12 = placedPallets.some(
    (p) => p.pallet.width === 1200 || p.pallet.length === 1200
  );
  const forkEntryGuide = is1200T12
    ? '박스B(T12 1200×1000): 문 쪽을 향하는 폭 1,000mm 면으로 포크 진입 / 박스A(T11): 1,100mm 면 진입'
    : '공칭 파레트 폭에 맞춰 포크 진입';

  // 쇼링 액션 단계 5개
  const rearClr = fieldDiag.rearClearanceMm ?? 0;
  const defaultShoring =
    rearClr >= 600
      ? [
          '앞벽부터 파레트 간격 없이 전방 밀착 적재 완료',
          `문 앞 빈 공간(${rearClr}mm) 실측 확인`,
          '마지막 열 뒤에 각재 펜스를 세우고 코너포스트까지 대각 버팀목 시공',
          '코너포스트 지지 확인 및 화물 유동 여부 검수 (문 앞 에어백 사용 금지)',
          '컨테이너 도어 닫힘 간섭 여부 확인 후 잠금',
        ]
      : [
          '앞벽부터 파레트 간격 없이 전방 밀착 적재 완료',
          `문 앞 빈 틈(${rearClr}mm) 실측 확인`,
          '세운 빈 파레트 2~4장을 끼우고 각재로 단단히 조임 (문 앞 에어백 금지)',
          '화물 유동 여부 검수',
          '컨테이너 도어 닫힘 간섭 여부 확인 후 잠금',
        ];
  const shoringSteps = doorGuide?.actions?.slice(0, 5) || defaultShoring;

  return (
    <div className="cbm-loading-sheet-page">
      {/* 1. 머리말 */}
      <div className="cbm-ls-header">
        <div className="cbm-ls-header-title-box">
          <h1 className="cbm-ls-main-title">현장 로딩 지시서</h1>
          <div className="cbm-ls-meta-info">
            <strong>{container.index}호기</strong> (총 {totalContainers}대 중) &nbsp;|&nbsp; 규격:{' '}
            <strong>{spec?.name}</strong> ({spec?.subName || '40ft High Cube'})
          </div>
        </div>

        {/* 밑줄 빈칸 기입란 */}
        <div className="cbm-ls-form-grid">
          <div className="cbm-ls-form-row">
            <span>
              작업일: <u>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</u>
            </span>
            <span>
              출고번호: <u>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</u>
            </span>
            <span>
              도크: <u>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</u>
            </span>
            <span>
              작업 시간: <u>&nbsp;&nbsp;&nbsp;&nbsp;:&nbsp;&nbsp;&nbsp;&nbsp; ~ &nbsp;&nbsp;&nbsp;&nbsp;:&nbsp;&nbsp;&nbsp;&nbsp;</u>
            </span>
          </div>
          <div className="cbm-ls-form-row" style={{ marginTop: '3px' }}>
            <span>
              컨테이너 번호: <u>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</u>
            </span>
            <span>
              씰(Seal) 번호: <u>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</u>
            </span>
            <span>
              지게차 기사 서명: <u>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</u>
            </span>
            <span>
              검수자 서명: <u>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</u>
            </span>
          </div>
        </div>
      </div>

      {/* 2. 요약 한 줄 */}
      <div className="cbm-ls-summary-bar">
        <span>
          <strong>총 파레트:</strong> {placedPallets.length} PLT
        </span>
        <span>
          <strong>화물 총중량:</strong> {container.totalWeight.toLocaleString()} kg
        </span>
        <span>
          <strong>적재 방식:</strong> {stackTypeDesc}
        </span>
        <span>
          <strong>품목 구성:</strong> {skuSummary}
        </span>
        <span className="cbm-ls-coord-rule">[좌우 기준] 문 앞에서 안쪽을 바라볼 때 (상단: 우측 / 하단: 좌측)</span>
      </div>

      {/* 3. 평면 배치도 (가로로 넓게) */}
      <FloorPlanPrintSvg container={container} />

      {/* 하단 2개 컬럼 본문 (순서표/체크 vs 쇼링/BOM) */}
      <div className="cbm-ls-body-grid">
        {/* 좌측 컬럼: 4. 적재 순서표 & 7. 적재 전후 확인 */}
        <div className="cbm-ls-col-left">
          {/* 4. 적재 순서표 */}
          <div className="cbm-ls-section-box">
            <div className="cbm-ls-section-head">
              <strong>[ 적재 순서 및 위치 명세표 ]</strong>
              <small>연속된 동일 규격은 묶어서 표기 (앞벽부터 순차 적재)</small>
            </div>
            <table className="cbm-ls-table">
              <thead>
                <tr>
                  <th style={{ width: '13%' }}>순서</th>
                  <th style={{ width: '22%' }}>위치 (열·좌/우)</th>
                  <th style={{ width: '25%' }}>파레트 번호</th>
                  <th>품목 및 규격</th>
                  <th style={{ width: '17%' }}>높이</th>
                  <th style={{ width: '15%' }}>중량</th>
                  <th style={{ width: '8%', textAlign: 'center' }}>확인</th>
                </tr>
              </thead>
              <tbody>
                {seqRows.map((r, i) => (
                  <tr key={i} className={r.isClosing ? 'tr-closing' : r.isLow ? 'tr-warn' : ''}>
                    <td style={{ fontWeight: 'bold' }}>{r.seqText}</td>
                    <td>{r.colText}</td>
                    <td style={{ fontWeight: 'bold' }}>{r.pLabels}</td>
                    <td>{r.itemDesc}</td>
                    <td>{r.heightText}</td>
                    <td>{r.weightText}</td>
                    <td style={{ textAlign: 'center', fontSize: '13px' }}>□</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* 작업 메모 */}
            <div className="cbm-ls-work-memo">
              <div>
                <strong>• 밀착 기준:</strong> 앞벽부터 열간 틈새 없이 전방 밀착 적재 (도어 쪽에 잔여 공간 형성)
              </div>
              <div>
                <strong>• 포크 진입:</strong> {forkEntryGuide}
              </div>
              <div>
                <strong>• 에어백 충진:</strong> 150mm 초과 측면 유격 열간 에어백 충진 (문 앞 공간에는 에어백 사용 금지)
              </div>
            </div>
          </div>

          {/* 7. 적재 전후 확인 (체크칸) */}
          <div className="cbm-ls-section-box" style={{ marginTop: '3px' }}>
            <div className="cbm-ls-section-head">
              <strong>[ 적재 전·후 필수 확인 체크리스트 ]</strong>
            </div>
            <div className="cbm-ls-checklist-grid">
              <div>□ 1. 컨테이너 외관 파손, 빛 샘(Hole), 바닥 돌출, 이물질 및 냄새 없음 확인</div>
              <div>
                □ 2. 컨테이너 내폭 실측 기록: 문쪽 [ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ] mm &nbsp;/&nbsp; 중앙 [ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ] mm
              </div>
              <div>
                □ 3. 첫 번째 열(Front) 적재 후 좌우 작업 여유 실측: 좌우 [ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ] mm
              </div>
              <div>□ 4. 도어 외부에 &quot;쇼링 완료, 문 개방 시 화물 낙하 주의&quot; 표지 부착</div>
              <div>
                □ 5. 단계별 현장 사진 촬영 완료: 1) 앞벽 첫 열 &nbsp; 2) 중간 적재 &nbsp; 3) 최종 쇼링 시공 &nbsp; 4) 씰(Seal) 체결
              </div>
            </div>
          </div>
        </div>

        {/* 우측 컬럼: 5. 쇼링 지시 & 6. 준비 자재 (BOM) */}
        <div className="cbm-ls-col-right">
          {/* 5. 쇼링 지시 */}
          <div className="cbm-ls-section-box">
            <div className="cbm-ls-section-head">
              <strong>[ 도어측 화물 전도·슬라이딩 방지 쇼링 지시 ]</strong>
              <small>{doorGuide?.hasHeightGapRisk ? '단차 및 밀림 동시 방어' : '후방 슬라이딩 차단'}</small>
            </div>

            {/* 문에서 본 단면도 */}
            <ShoringCrossSectionSvg container={container} />

            {/* 쇼링 작업 5단계 */}
            <div className="cbm-ls-shoring-steps">
              {shoringSteps.map((step, idx) => (
                <div key={idx} className="cbm-ls-step-item">
                  <span className="step-num">{idx + 1}</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 6. 준비 자재 (예상 BOM) */}
          <div className="cbm-ls-section-box" style={{ marginTop: '3px' }}>
            <div className="cbm-ls-section-head">
              <strong>[ 필요 쇼링 자재 목록 (BOM) ]</strong>
              <small>작업 전 도크 옆에 사전 불출</small>
            </div>
            <table className="cbm-ls-table">
              <thead>
                <tr>
                  <th style={{ width: '22%' }}>자재명</th>
                  <th style={{ width: '24%' }}>규격</th>
                  <th style={{ width: '16%' }}>소요수량</th>
                  <th>시공 목적</th>
                  <th style={{ width: '10%', textAlign: 'center' }}>준비</th>
                </tr>
              </thead>
              <tbody>
                {bomList.slice(0, 5).map((b, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 'bold' }}>{b.name.split(' (')[0]}</td>
                    <td>{b.spec}</td>
                    <td style={{ fontWeight: 'bold' }}>{b.quantity}</td>
                    <td style={{ fontSize: '12px' }}>{b.purpose.split('(')[0]}</td>
                    <td style={{ textAlign: 'center', fontSize: '13px' }}>□</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="cbm-ls-ht-notice">
              [주의] 수출 건은 반드시 <strong>ISPM 15 (HT) 열처리 검역 마크</strong>가 각인된 목재 자재(각재·파레트)만 사용하십시오. (가공목재인 합판은 검역 면제)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
