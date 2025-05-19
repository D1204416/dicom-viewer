// App.jsx
import React, { useState, useRef } from 'react';
import DicomUploader from './components/DicomUploader';
import DicomViewer from './components/DicomViewer';
import LabelTool from './components/LabelTool';
import LabelList from './components/LabelList';

function App() {
  const [patientInfo, setPatientInfo] = useState(null);
  const [dicomFile, setDicomFile] = useState(null);
  const dicomCanvasRef = useRef(null);
  const [activeTool, setActiveTool] = useState(null);
  const [labelCounter, setLabelCounter] = useState(1);
  const [labels, setLabels] = useState([]);

  const handleAddLabel = () => {
    setActiveTool('FreehandRoi');
  };

  const handleEditLabel = () => {
    setActiveTool('FreehandRoi');
  };

  const handleLabelComplete = (event) => {
    const newLabel = {
      id: Date.now(),
      name: `Label ${labelCounter}`,
      toolData: event.detail.annotation,
    };
    setLabels([...labels, newLabel]);
    setLabelCounter(labelCounter + 1);
    setActiveTool(null);
  };

  const handleDeleteLabel = (id) => {
    setLabels(labels.filter(label => label.id !== id));
  };

  return (
    <div className="app-container">
      <h1>DICOM Viewer</h1>
      <DicomUploader setPatientInfo={setPatientInfo} setDicomFile={setDicomFile} />

      {patientInfo && (
        <div>
          <h3>Patient Information</h3>
          <p>Name: {patientInfo.name}</p>
          <p>Birthdate: {patientInfo.birthdate}</p>
          <p>Sex: {patientInfo.sex}</p>
          <p>Age: {patientInfo.age}</p>
        </div>
      )}

      <div style={{ display: 'flex' }}>
        <DicomViewer
          file={dicomFile}
          canvasRef={dicomCanvasRef}
          activeTool={activeTool}
          onLabelComplete={handleLabelComplete}
        />
        <div style={{ marginLeft: '20px' }}>
          <LabelTool onAddLabel={handleAddLabel} />
          <LabelList
            labels={labels}
            onDelete={handleDeleteLabel}
            onEdit={handleEditLabel}
          />
        </div>
      </div>
    </div>
  );
}

export default App;