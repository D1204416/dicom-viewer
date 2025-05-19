import React from 'react';
import DicomUploader from './components/DicomUploader';
import DicomViewer from './components/DicomViewer';
import LabelTool from './components/LabelTool';
import LabelList from './components/LabelList';

function App() {
  return (
    <div className="app-container">
      <h1>DICOM Viewer</h1>
      <DicomUploader />
      <div className="viewer-label-section" style={{ display: 'flex' }}>
        <DicomViewer />
        <LabelTool />
      </div>
      <LabelList />
    </div>
  );
}

export default App;
