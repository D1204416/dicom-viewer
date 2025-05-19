// components/LabelList.jsx
import React from 'react';

function LabelList({ labels, onDelete, onEdit }) {
  return (
    <div>
      <h2>Label List</h2>
      {labels.map(label => (
        <div key={label.id}>
          {label.name}
          <button onClick={() => onEdit(label.id)}>Edit</button>
          <button onClick={() => onDelete(label.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}

export default LabelList;