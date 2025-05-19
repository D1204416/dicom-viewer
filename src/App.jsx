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

  return (
    <div className="app-container">
      <h1>DICOM Viewer</h1>
      <DicomUploader setPatientInfo={setPatientInfo} setDicomFile={setDicomFile} />

      {patientInfo && (
        <div>
          <h3>Patient Information</h3>
          <p>Name: {patientInfo.name}</p>
          <p>Birthdate: {patientInfo.birthdate}</p>
          <p>Age: {patientInfo.age}</p>
          <p>Sex: {patientInfo.sex}</p>
        </div>
      )}

      <div className="viewer-label-section" style={{ display: 'flex' }}>
        <DicomViewer file={dicomFile} canvasRef={dicomCanvasRef} />
        <LabelTool />
      </div>
      <LabelList />
    </div>
  );
}

export default App;