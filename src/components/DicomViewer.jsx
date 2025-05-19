// components/DicomViewer.jsx
import React, { useRef, useEffect } from 'react';

function DicomViewer() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.fillText('DICOM Image Placeholder', 10, 50);
  }, []);

  return (
    <div>
      <h2>DICOM Image</h2>
      <canvas ref={canvasRef} width={512} height={512} />
    </div>
  );
}

export default DicomViewer;
