import React from 'react';

function LabelTool() {
  const handleAddLabel = () => {
    console.log('Add new label');
    // TODO: 加入多邊形標記功能
  };

  return (
    <div style={{ marginLeft: '20px' }}>
      <h2>Label Tools</h2>
      <button onClick={handleAddLabel}>Add Label</button>
    </div>
  );
}

export default LabelTool;
