import React from 'react';

export function PasteCargoModal({
  pasteModalOpen,
  setPasteModalOpen,
  pasteText,
  setPasteText,
  handleApplyPasteText,
}) {
  if (!pasteModalOpen) return null;

  return (
    <div className="cbm-modal-backdrop" onClick={() => setPasteModalOpen(false)}>
      <div className="cbm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cbm-modal-head">
          <h3>엑셀 / CSV 데이터 복사 붙여넣기</h3>
          <button type="button" onClick={() => setPasteModalOpen(false)}>
            ✕
          </button>
        </div>
        <p className="cbm-modal-desc">
          엑셀에서 헤더(<code>화물명, 가로(mm), 세로(mm), 높이(mm), 수량, 중량(kg/박스)</code>)를 포함하여 복사한 뒤 아래 창에 붙여넣으세요.
        </p>
        <textarea
          className="cbm-paste-textarea"
          rows={8}
          placeholder={`화물명,가로(mm),세로(mm),높이(mm),수량,중량(kg/박스)\n박스A (Item1),510,240,210,1246,4.20\n박스B (Item2),750,410,220,294,9.29\n박스C (Item3),600,400,300,8,9.13`}
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
        />
        <div className="cbm-modal-actions">
          <button
            type="button"
            className="cbm-btn cbm-btn-outline"
            onClick={() =>
              setPasteText(
                `화물명,가로(mm),세로(mm),높이(mm),수량,중량(kg/박스)\n박스A (Item1),510,240,210,1246,4.20\n박스B (Item2),750,410,220,294,9.29\n박스C (Item3),600,400,300,8,9.13`
              )
            }
          >
            샘플 텍스트 채우기
          </button>
          <button
            type="button"
            className="cbm-btn cbm-btn-primary"
            onClick={handleApplyPasteText}
          >
            데이터 반영하기
          </button>
        </div>
      </div>
    </div>
  );
}
