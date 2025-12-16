import React from 'react';

interface PositionSelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const PositionSelect: React.FC<PositionSelectProps> = ({ value, onChange, className = '' }) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`bg-gray-600 text-white px-3 py-2 rounded border border-gray-500 focus:border-blue-500 focus:outline-none text-sm ${className}`}
    >
      <option value="GK">GK (골키퍼)</option>
      <optgroup label="수비수">
        <option value="LWB">LWB (좌측 윙백)</option>
        <option value="LB">LB (좌측 풀백)</option>
        <option value="LCB">LCB (좌측 중앙 수비수)</option>
        <option value="CB">CB (중앙 수비수)</option>
        <option value="RCB">RCB (우측 중앙 수비수)</option>
        <option value="RB">RB (우측 풀백)</option>
        <option value="RWB">RWB (우측 윙백)</option>
      </optgroup>
      <optgroup label="수비형 미드필더">
        <option value="LDM">LDM (좌측 수비형 미드필더)</option>
        <option value="CDM">CDM (중앙 수비형 미드필더)</option>
        <option value="RDM">RDM (우측 수비형 미드필더)</option>
      </optgroup>
      <optgroup label="중앙 미드필더">
        <option value="LCM">LCM (좌측 중앙 미드필더)</option>
        <option value="CM">CM (중앙 미드필더)</option>
        <option value="RCM">RCM (우측 중앙 미드필더)</option>
      </optgroup>
      <optgroup label="공격형 미드필더">
        <option value="LM">LM (좌측 미드필더)</option>
        <option value="LAM">LAM (좌측 공격형 미드필더)</option>
        <option value="CAM">CAM (중앙 공격형 미드필더)</option>
        <option value="RAM">RAM (우측 공격형 미드필더)</option>
        <option value="RM">RM (우측 미드필더)</option>
      </optgroup>
      <optgroup label="공격수">
        <option value="LW">LW (좌측 윙어)</option>
        <option value="LF">LF (좌측 포워드)</option>
        <option value="LS">LS (좌측 스트라이커)</option>
        <option value="CF">CF (중앙 포워드)</option>
        <option value="ST">ST (스트라이커)</option>
        <option value="RS">RS (우측 스트라이커)</option>
        <option value="RF">RF (우측 포워드)</option>
        <option value="RW">RW (우측 윙어)</option>
      </optgroup>
    </select>
  );
};

export default PositionSelect;

