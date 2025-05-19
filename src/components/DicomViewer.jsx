// components/DicomViewer.jsx
import React, { useEffect } from 'react';
import * as cornerstone from 'cornerstone-core';
import * as cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';
import * as dicomParser from 'dicom-parser';
import * as cornerstoneMath from 'cornerstone-math';

cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
cornerstoneWADOImageLoader.external.dicomParser = dicomParser;
cornerstoneWADOImageLoader.configure({
  beforeSend: function(xhr) {
    // 可設定授權等 header
  },
});

function DicomViewer({ file, canvasRef }) {
  useEffect(() => {
    if (!file || !canvasRef.current) return;

    const element = canvasRef.current;
    cornerstone.enable(element);

    const imageId = cornerstoneWADOImageLoader.wadouri.fileManager.add(file);
    cornerstone.loadImage(imageId).then((image) => {
      cornerstone.displayImage(element, image);
    }).catch((err) => {
      console.error('Failed to display image:', err);
    });
  }, [file, canvasRef]);

  return (
    <div>
      <h2>DICOM Image</h2>
      <div ref={canvasRef} style={{ width: 512, height: 512, background: 'black' }} />
    </div>
  );
}

export default DicomViewer;