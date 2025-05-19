// components/LabelTool.jsx
import React from 'react';

function LabelTool({ onAddLabel }) {
  return (
    <div>
      <h2>Label Tools</h2>
      <button onClick={onAddLabel}>Add Label</button>
    </div>
  );
}

export default LabelTool;