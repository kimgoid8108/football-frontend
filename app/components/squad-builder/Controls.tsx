import React from 'react';
import { FORMATIONS } from '../../constants/squad-builder';

interface ControlsProps {
  formation: string;
  onFormationChange: (formation: string) => void;
}

const Controls: React.FC<ControlsProps> = ({ formation, onFormationChange }) => {
  return (
    <select
      value={formation}
      onChange={(e) => onFormationChange(e.target.value)}
      className="bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700"
    >
      {Object.keys(FORMATIONS).map((key) => (
        <option key={key} value={key}>{key}</option>
      ))}
    </select>
  );
};

export default Controls;

