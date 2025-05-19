// components/LabelList.jsx
import React, { useState } from 'react';

function LabelList() {
  const [labels, setLabels] = useState([
    { id: 1, name: 'Label 1' },
    { id: 2, name: 'Label 2' },
  ]);

  const handleEdit = (id) => {
    console.log('Edit label:', id);
  };

  const handleDelete = (id) => {
    console.log('Delete label:', id);
    setLabels(labels.filter(label => label.id !== id));
  };

  return (
    <div>
      <h2>Label List</h2>
      {labels.map(label => (
        <div key={label.id}>
          {label.name}
          <button onClick={() => handleEdit(label.id)}>Edit</button>
          <button onClick={() => handleDelete(label.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}

export default LabelList;