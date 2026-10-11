import React from 'react';
import { CameraIcon } from './Icons';

export function PlaceholderFrame({
  badge = '사진 및 도면 준비 중',
  title = '현장 작업 사진 등록 위치',
  desc = '추후 실제 현장 작업 사진 및 세부 지침이 업로드될 예정입니다.',
  hint = '촬영 예정: 고화질 정면/측면 컷',
  className = ''
}) {
  return (
    <div className={`placeholder-frame ${className}`}>
      <div className="placeholder-inner">
        <div className="placeholder-icon-wrap">
          <CameraIcon className="w-8 h-8 text-neutral-400" />
        </div>
        <div className="placeholder-badge">{badge}</div>
        <h4 className="placeholder-title">{title}</h4>
        <p className="placeholder-desc">{desc}</p>
        {hint && <span className="placeholder-hint">💡 {hint}</span>}
      </div>
    </div>
  );
}
