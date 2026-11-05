import React, { useState, useEffect, useRef } from 'react';

const SAVED_PROJECTS_KEY = 'wac_cbm_saved_projects_v1';
export const PROJECT_FORMAT_VERSION = 1;

/**
 * 프로젝트 전체 데이터 유효성 검증 헬퍼
 * - 필수 항목(cargos, palletConfig, selectedContainerId) 존재 여부 검사
 * - 치수, 수량, 중량 등 숫자 형식의 엄격한 유효성(양수, Finite) 검사
 * - 오류 발생 시 구체적인 사유를 반환하며 기존 입력은 절대 변경하지 않음
 */
export function validateProjectData(raw) {
  if (!raw || typeof raw !== 'object') {
    return { valid: false, error: '유효한 프로젝트 데이터 객체가 아닙니다.' };
  }

  // 형식 버전 번호 검사
  const version = Number(raw.version);
  if (!version || isNaN(version) || version < 1) {
    return {
      valid: false,
      error: '지원되지 않거나 유효하지 않은 형식 버전 번호입니다 (버전 번호 누락).',
    };
  }

  const data = raw.project?.data || raw.data || raw;

  // 1. 화물 목록(cargos) 검사
  if (!Array.isArray(data.cargos) || data.cargos.length === 0) {
    return {
      valid: false,
      error: '화물(박스) 목록이 비어 있거나 올바른 배열 형식이 아닙니다.',
    };
  }

  for (let i = 0; i < data.cargos.length; i++) {
    const c = data.cargos[i];
    const name = c.name || `화물 #${i + 1}`;
    const w = Number(c.width);
    const l = Number(c.length);
    const h = Number(c.height);
    const q = Number(c.quantity);
    const wt = Number(c.weight);

    if (!isFinite(w) || w <= 0 || !isFinite(l) || l <= 0 || !isFinite(h) || h <= 0) {
      return {
        valid: false,
        error: `[${name}] 화물의 박스 치수(가로/세로/높이)가 유효한 양수 숫자가 아닙니다.`,
      };
    }
    if (!isFinite(q) || q <= 0 || !Number.isInteger(q)) {
      return {
        valid: false,
        error: `[${name}] 화물의 수량이 유효한 1 이상의 정수가 아닙니다.`,
      };
    }
    if (!isFinite(wt) || wt <= 0) {
      return {
        valid: false,
        error: `[${name}] 화물의 박스 단중(kg)이 유효한 양수 숫자가 아닙니다.`,
      };
    }
  }

  // 2. 파레트 설정(palletConfig) 검사
  const pc = data.palletConfig;
  if (!pc || typeof pc !== 'object') {
    return {
      valid: false,
      error: '파레트 규격 설정값(palletConfig)이 누락되었습니다.',
    };
  }
  const pw = Number(pc.width);
  const pl = Number(pc.length);
  const pmh = Number(pc.maxTotalHeight);
  const pmw = Number(pc.maxWeight);

  if (!isFinite(pw) || pw <= 0 || !isFinite(pl) || pl <= 0) {
    return {
      valid: false,
      error: '파레트 가로·세로 규격 치수가 올바른 숫자가 아닙니다.',
    };
  }
  if (!isFinite(pmh) || pmh <= 0 || !isFinite(pmw) || pmw <= 0) {
    return {
      valid: false,
      error: '파레트 최대 적재높이 또는 최대 적재중량 설정이 올바른 숫자가 아닙니다.',
    };
  }

  // 3. 컨테이너 선택(selectedContainerId) 검사
  if (!data.selectedContainerId || typeof data.selectedContainerId !== 'string') {
    return {
      valid: false,
      error: '선택된 컨테이너 규격 식별자(selectedContainerId)가 올바르지 않습니다.',
    };
  }

  return { valid: true, sanitizedData: data, projectName: raw.project?.name || raw.name || '불러온 프로젝트' };
}

export function ProjectManagerModal({
  isOpen,
  onClose,
  theme = 'dark',
  currentProjectData,
  onLoadProjectData,
}) {
  const isLight = theme === 'light';
  const fileInputRef = useRef(null);

  const [savedProjects, setSavedProjects] = useState([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: string }

  // localStorage에서 저장된 프로젝트 목록 로드
  useEffect(() => {
    if (!isOpen) return;
    try {
      const raw = localStorage.getItem(SAVED_PROJECTS_KEY);
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          setSavedProjects(list);
        }
      }
    } catch (e) {
      console.error('Failed to load saved projects:', e);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const persistProjects = (updatedList) => {
    try {
      localStorage.setItem(SAVED_PROJECTS_KEY, JSON.stringify(updatedList));
      setSavedProjects(updatedList);
    } catch (e) {
      setFeedback({ type: 'error', message: `저장 용량 초과 또는 브라우저 오류: ${e.message}` });
    }
  };

  // 현재 입력값으로 새 프로젝트 저장
  const handleSaveCurrent = () => {
    const trimmed = (newProjectName || '').trim();
    if (!trimmed) {
      setFeedback({ type: 'error', message: '프로젝트 이름을 입력해주세요.' });
      return;
    }

    const newId = `proj_${Date.now()}`;
    const nowIso = new Date().toISOString();
    const summary = {
      cargoCount: currentProjectData.cargos?.length || 0,
      totalBoxes: (currentProjectData.cargos || []).reduce(
        (sum, c) => sum + (Number(c.quantity) || 0),
        0
      ),
      containerId: currentProjectData.selectedContainerId || '40FT_HC',
      palletSpec: currentProjectData.palletSelectionMode || 'CUSTOM_MIX',
    };

    const newProject = {
      id: newId,
      name: trimmed,
      version: PROJECT_FORMAT_VERSION,
      createdAt: nowIso,
      updatedAt: nowIso,
      summary,
      data: currentProjectData,
    };

    const updated = [newProject, ...savedProjects.filter((p) => p.name !== trimmed)];
    persistProjects(updated);
    setNewProjectName('');
    setFeedback({
      type: 'success',
      message: `"${trimmed}" 프로젝트가 브라우저에 성공적으로 저장되었습니다.`,
    });
  };

  // 프로젝트 불러오기
  const handleLoad = (proj) => {
    const val = validateProjectData({
      version: proj.version || PROJECT_FORMAT_VERSION,
      name: proj.name,
      data: proj.data,
    });

    if (!val.valid) {
      setFeedback({
        type: 'error',
        message: `프로젝트 불러오기 실패: ${val.error} (기존 입력값을 유지합니다)`,
      });
      return;
    }

    onLoadProjectData(val.sanitizedData, proj.name);
    setFeedback({
      type: 'success',
      message: `"${proj.name}" 프로젝트를 성공적으로 불러왔습니다.`,
    });
    setTimeout(() => {
      onClose();
    }, 400);
  };

  // 프로젝트 이름 변경 시작
  const handleStartRename = (proj) => {
    setEditingProjectId(proj.id);
    setEditingName(proj.name);
  };

  // 프로젝트 이름 변경 완료
  const handleSaveRename = (id) => {
    const trimmed = editingName.trim();
    if (!trimmed) {
      setFeedback({ type: 'error', message: '변경할 프로젝트 이름을 입력해주세요.' });
      return;
    }
    const updated = savedProjects.map((p) =>
      p.id === id ? { ...p, name: trimmed, updatedAt: new Date().toISOString() } : p
    );
    persistProjects(updated);
    setEditingProjectId(null);
    setEditingName('');
    setFeedback({ type: 'success', message: '프로젝트 이름이 변경되었습니다.' });
  };

  // 프로젝트 삭제
  const handleDelete = (id, name) => {
    if (!window.confirm(`"${name}" 프로젝트를 삭제하시겠습니까?`)) return;
    const updated = savedProjects.filter((p) => p.id !== id);
    persistProjects(updated);
    setFeedback({ type: 'success', message: `"${name}" 프로젝트가 삭제되었습니다.` });
  };

  // JSON 파일로 내보내기 (특정 프로젝트 또는 현재 설정)
  const handleExportJson = (proj) => {
    const name = proj ? proj.name : (newProjectName.trim() || 'WAC_적재_프로젝트');
    const dataToExport = proj ? proj.data : currentProjectData;

    const payload = {
      format: 'WAC_CBM_PROJECT',
      version: PROJECT_FORMAT_VERSION,
      exportedAt: new Date().toISOString(),
      project: {
        name,
        data: dataToExport,
      },
    };

    const jsonStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = name.replace(/[/\\?%*:|"<>]/g, '_');
    a.href = url;
    a.download = `${safeName}_wac_cbm.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setFeedback({
      type: 'success',
      message: `"${name}.json" 파일이 다운로드되었습니다.`,
    });
  };

  // JSON 파일 가져오기 (Import)
  const handleImportJsonFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        let parsed = null;
        try {
          parsed = JSON.parse(text);
        } catch (jsonErr) {
          setFeedback({
            type: 'error',
            message: `JSON 파싱 오류: 올바른 JSON 파일 형식이 아닙니다. 기존 입력을 변경하지 않습니다.`,
          });
          return;
        }

        const val = validateProjectData(parsed);
        if (!val.valid) {
          setFeedback({
            type: 'error',
            message: `가져오기 검증 실패: ${val.error} (기존 입력값을 안전하게 유지합니다)`,
          });
          return;
        }

        // 유효성 검증 성공 -> 현재 작업 환경에 즉시 반영
        onLoadProjectData(val.sanitizedData, val.projectName);

        // 또한 로컬스토리지 목록에도 자동 저장 제안
        const nowIso = new Date().toISOString();
        const importedProject = {
          id: `proj_${Date.now()}`,
          name: val.projectName,
          version: PROJECT_FORMAT_VERSION,
          createdAt: nowIso,
          updatedAt: nowIso,
          summary: {
            cargoCount: val.sanitizedData.cargos?.length || 0,
            totalBoxes: (val.sanitizedData.cargos || []).reduce(
              (sum, c) => sum + (Number(c.quantity) || 0),
              0
            ),
            containerId: val.sanitizedData.selectedContainerId || '40FT_HC',
            palletSpec: val.sanitizedData.palletSelectionMode || 'CUSTOM_MIX',
          },
          data: val.sanitizedData,
        };
        const updated = [importedProject, ...savedProjects.filter((p) => p.name !== val.projectName)];
        persistProjects(updated);

        setFeedback({
          type: 'success',
          message: `"${val.projectName}" JSON 파일을 성공적으로 가져왔으며, 시뮬레이터에 반영되었습니다.`,
        });
      } catch (err) {
        setFeedback({
          type: 'error',
          message: `파일 읽기 오류: ${err.message}. 기존 입력을 유지합니다.`,
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="cbm-modal-backdrop" onClick={onClose}>
      <div
        className="cbm-modal-content cbm-project-modal"
        style={{ maxWidth: '820px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 헤더 */}
        <div className="cbm-modal-header">
          <div className="cbm-modal-title">
            <span>프로젝트 저장 및 불러오기 (Project Manager)</span>
            <span className="cbm-pm-badge">형식 v{PROJECT_FORMAT_VERSION}</span>
          </div>
          <button type="button" className="cbm-modal-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        {/* 중요 필수 안내 바 */}
        <div className="cbm-pm-notice-bar">
          <strong>※ 주의 안내:</strong> 저장은 브라우저(localStorage)에 저장되며, 브라우저 캐시나 방문 기록을 지우면 사라지므로 중요한 건은 반드시 <strong>[JSON 내보내기]</strong>로 파일을 다운로드하여 영구 보관하세요.
        </div>

        {/* 피드백 메시지 (성공 / 오류 알림) */}
        {feedback && (
          <div
            className={`cbm-pm-alert ${
              feedback.type === 'success' ? 'cbm-pm-alert-success' : 'cbm-pm-alert-error'
            }`}
          >
            <span>{feedback.message}</span>
            <button
              type="button"
              className="cbm-pm-alert-close"
              onClick={() => setFeedback(null)}
            >
              ×
            </button>
          </div>
        )}

        <div className="cbm-pm-body">
          {/* 1. 현재 작업 내용 저장 및 파일 I/O 섹션 */}
          <div className="cbm-pm-section">
            <h4 className="cbm-pm-section-title">현재 입력값(화물·조건·공차·컨테이너) 저장 및 내보내기</h4>
            <div className="cbm-pm-save-bar">
              <input
                type="text"
                className="cbm-pm-input"
                placeholder="저장할 프로젝트 이름 입력 (예: 2026-11 유럽 수출건)"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveCurrent();
                }}
              />
              <button
                type="button"
                className="cbm-btn cbm-btn-emerald"
                onClick={handleSaveCurrent}
              >
                브라우저에 저장
              </button>
              <button
                type="button"
                className="cbm-btn cbm-btn-outline"
                onClick={() => handleExportJson(null)}
                title="현재 전체 설정을 JSON 파일로 다운로드합니다"
              >
                JSON 내보내기
              </button>
              <button
                type="button"
                className="cbm-btn cbm-btn-outline"
                onClick={() => fileInputRef.current?.click()}
                title="JSON 파일을 열어 시뮬레이터에 불러옵니다"
              >
                JSON 가져오기
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                style={{ display: 'none' }}
                onChange={handleImportJsonFile}
              />
            </div>
          </div>

          {/* 2. 저장된 프로젝트 목록 섹션 */}
          <div className="cbm-pm-section">
            <div className="cbm-pm-list-header">
              <h4 className="cbm-pm-section-title">
                저장된 프로젝트 목록 (총 {savedProjects.length}개)
              </h4>
            </div>

            {savedProjects.length === 0 ? (
              <div className="cbm-pm-empty">
                저장된 프로젝트가 없습니다. 위의 입력창에 프로젝트 이름을 입력하고 [브라우저에 저장] 또는 [JSON 가져오기]를 해보세요.
              </div>
            ) : (
              <div className="cbm-pm-list">
                {savedProjects.map((proj) => {
                  const isEditing = editingProjectId === proj.id;
                  const dateStr = new Date(proj.updatedAt || proj.createdAt).toLocaleString();
                  const s = proj.summary || {};

                  return (
                    <div key={proj.id} className="cbm-pm-item">
                      <div className="cbm-pm-item-info">
                        {isEditing ? (
                          <div className="cbm-pm-inline-edit">
                            <input
                              type="text"
                              className="cbm-pm-input-sm"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveRename(proj.id);
                                if (e.key === 'Escape') setEditingProjectId(null);
                              }}
                              autoFocus
                            />
                            <button
                              type="button"
                              className="cbm-btn cbm-btn-sm cbm-btn-emerald"
                              onClick={() => handleSaveRename(proj.id)}
                            >
                              확인
                            </button>
                            <button
                              type="button"
                              className="cbm-btn cbm-btn-sm cbm-btn-outline"
                              onClick={() => setEditingProjectId(null)}
                            >
                              취소
                            </button>
                          </div>
                        ) : (
                          <div className="cbm-pm-item-name-row">
                            <strong className="cbm-pm-item-name">{proj.name}</strong>
                            <span className="cbm-pm-item-date">{dateStr}</span>
                          </div>
                        )}

                        <div className="cbm-pm-item-meta">
                          <span className="cbm-pm-meta-pill">품목 {s.cargoCount || 0}개</span>
                          <span className="cbm-pm-meta-pill">총 {(s.totalBoxes || 0).toLocaleString()}박스</span>
                          <span className="cbm-pm-meta-pill">파레트 {s.palletSpec || 'T11'}</span>
                          <span className="cbm-pm-meta-pill">컨테이너 {s.containerId || '40FT_HC'}</span>
                        </div>
                      </div>

                      <div className="cbm-pm-item-actions">
                        <button
                          type="button"
                          className="cbm-btn cbm-btn-sm cbm-btn-primary"
                          onClick={() => handleLoad(proj)}
                          title="이 프로젝트를 시뮬레이터로 불러옵니다"
                        >
                          불러오기
                        </button>
                        <button
                          type="button"
                          className="cbm-btn cbm-btn-sm cbm-btn-outline"
                          onClick={() => handleExportJson(proj)}
                          title="JSON 파일로 다운로드"
                        >
                          JSON 내보내기
                        </button>
                        {!isEditing && (
                          <button
                            type="button"
                            className="cbm-btn cbm-btn-sm cbm-btn-outline"
                            onClick={() => handleStartRename(proj)}
                            title="이름 변경"
                          >
                            이름 변경
                          </button>
                        )}
                        <button
                          type="button"
                          className="cbm-btn cbm-btn-sm cbm-btn-danger"
                          onClick={() => handleDelete(proj.id, proj.name)}
                          title="프로젝트 삭제"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="cbm-modal-footer">
          <button type="button" className="cbm-btn cbm-btn-outline" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
