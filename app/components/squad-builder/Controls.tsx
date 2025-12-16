import React from "react";

interface ControlsProps {
  formation: string;
  formations: string[];
  onFormationChange: (formation: string) => void;
}

const Controls: React.FC<ControlsProps> = ({
  formation,
  formations,
  onFormationChange,
}) => {
  return (
    <select
      value={formation}
      onChange={(e) => onFormationChange(e.target.value)}
      className="bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700"
    >
      {formations.map((key) => (
        <option key={key} value={key}>
          {key}
        </option>
      ))}
    </select>
  );
};

export default Controls;
