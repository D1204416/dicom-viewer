// App.jsx
import React, { useState, useRef } from 'react';
import DicomUploader from './components/DicomUploader';
import DicomViewer from './components/DicomViewer';
import LabelTool from './components/LabelTool';
import LabelList from './components/LabelList';

function App() {
  const [patientInfo, setPatientInfo] = useState(null);
  const [dicomFile, setDicomFile] = useState(null);
  const [labels, setLabels] = useState([]);
  const [labelCounter, setLabelCounter] = useState(1);
  const [selectedAnnotationUID, setSelectedAnnotationUID] = useState(null);
  const viewerRef = useRef(null);

  const handleAddLabel = () => {
    viewerRef.current?.startDrawing();
  };

  const handleLabelComplete = (uid) => {
    const newLabel = {
      uid,
      name: `Label ${labelCounter}`
    };
    setLabels(prev => [...prev, newLabel]);
    setLabelCounter(prev => prev + 1);
  };

  const handleEditLabel = (uid) => {
    setSelectedAnnotationUID(uid);
  };

  const handleDeleteLabel = (uid) => {
    setLabels(labels.filter(label => label.uid !== uid));
    viewerRef.current?.removeAnnotation(uid);
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
          ref={viewerRef}
          file={dicomFile}
          onLabelComplete={handleLabelComplete}
          selectedAnnotationUID={selectedAnnotationUID}
        />
        <div style={{ marginLeft: '20px' }}>
          <LabelTool onAddLabel={handleAddLabel} />
          <LabelList
            labels={labels}
            onEdit={handleEditLabel}
            onDelete={handleDeleteLabel}
          />
        </div>
      </div>
    </div>
  );
}

export default App;