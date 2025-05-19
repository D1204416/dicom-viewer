// components/LabelList.jsx
import React from 'react';

function LabelList({ labels, onEdit, onDelete }) {
  return (
    <div>
      <h2>Label List</h2>
      {labels.map(label => (
        <div key={label.uid}>
          {label.name}
          <button onClick={() => onEdit(label.uid)}>Edit</button>
          <button onClick={() => onDelete(label.uid)}>Delete</button>
        </div>
      ))}
    </div>
  );
}

export default LabelList;