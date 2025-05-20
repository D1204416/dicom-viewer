// App.jsx
import React, { useState, useRef, useEffect } from 'react';
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
  const addedLabelsRef = useRef(new Set()); // 追踪已添加的標記 UID

  // 當組件掛載或 dicomFile 改變時，重置標記狀態
  useEffect(() => {
    if (dicomFile) {
      setLabels([]);
      setLabelCounter(1);
      setSelectedAnnotationUID(null);
      addedLabelsRef.current.clear();
    }
  }, [dicomFile]);

  const handleAddLabel = () => {
    console.log('Starting to draw new label');
    viewerRef.current?.startDrawing();
  };

  const handleLabelComplete = (uid) => {
    console.log('Label complete with UID:', uid);
    
    // 檢查標記是否已經添加，防止重複
    if (addedLabelsRef.current.has(uid)) {
      console.log('Duplicate label UID detected, skipping:', uid);
      return;
    }
    
    // 添加到追踪集合
    addedLabelsRef.current.add(uid);
    
    const newLabel = {
      uid,
      name: `Label ${labelCounter}`
    };
    
    setLabels(prev => [...prev, newLabel]);
    setLabelCounter(prev => prev + 1);
  };

  const handleEditLabel = (uid) => {
    console.log('Edit label triggered for UID:', uid);
    setSelectedAnnotationUID(uid);
    
    // 嘗試啟動該標記的編輯模式
    const success = viewerRef.current?.editAnnotation(uid);
    
    if (!success) {
      console.log('Failed to activate edit mode for annotation');
      // 嘗試同步 UI 與實際標記狀態
      syncAnnotationsWithUI();
    }
  };

  const handleDeleteLabel = (uid) => {
    console.log('Delete label triggered for UID:', uid);
    
    // 嘗試刪除標記
    const success = viewerRef.current?.removeAnnotation(uid);
    
    if (success) {
      // 從追踪集合中移除
      addedLabelsRef.current.delete(uid);
      
      // 更新標記列表
      setLabels(prev => prev.filter(label => label.uid !== uid));
      
      // 如果刪除的是當前選中的標記，清除選中狀態
      if (selectedAnnotationUID === uid) {
        setSelectedAnnotationUID(null);
      }
    } else {
      console.log('Failed to delete annotation, UI may be out of sync');
      // 同步 UI 與實際標記狀態
      syncAnnotationsWithUI();
    }
  };

  // 同步 UI 標記列表與實際標記狀態
  const syncAnnotationsWithUI = () => {
    if (!viewerRef.current) return;
    
    viewerRef.current.getAnnotations().then(annotations => {
      console.log('Syncing UI with actual annotations:', annotations);
      
      // 獲取有效的 UID 集合
      const validUids = new Set(annotations.map(a => a.uid));
      
      // 更新 UI 標記列表
      setLabels(prev => {
        // 保留有效的標記
        const validLabels = prev.filter(label => validUids.has(label.uid));
        
        // 添加新的標記（在 UI 中不存在但在實際標記中存在）
        const existingUids = new Set(validLabels.map(label => label.uid));
        const newAnnotations = annotations.filter(a => !existingUids.has(a.uid));
        
        const newLabels = newAnnotations.map(a => ({
          uid: a.uid,
          name: `Label ${labelCounter + newAnnotations.indexOf(a)}`
        }));
        
        // 如果有新標記，更新計數器
        if (newLabels.length > 0) {
          setLabelCounter(labelCounter + newLabels.length);
        }
        
        // 更新追踪集合
        addedLabelsRef.current = new Set(validLabels.concat(newLabels).map(label => label.uid));
        
        return [...validLabels, ...newLabels];
      });
    }).catch(err => {
      console.error('Error syncing annotations:', err);
    });
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