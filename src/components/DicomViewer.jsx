// components/DicomViewer.jsx
import React, { useEffect } from 'react';
import * as cornerstone from 'cornerstone-core';
import * as cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';
import * as dicomParser from 'dicom-parser';
import * as cornerstoneTools from 'cornerstone-tools';
import * as cornerstoneMath from 'cornerstone-math';
import Hammer from 'hammerjs';

cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
cornerstoneWADOImageLoader.external.dicomParser = dicomParser;
cornerstoneTools.external.cornerstone = cornerstone;
cornerstoneTools.external.cornerstoneMath = cornerstoneMath;
cornerstoneTools.external.Hammer = Hammer;

cornerstoneWADOImageLoader.configure({});
cornerstoneTools.init();

function DicomViewer({ file, canvasRef, activeTool, onLabelComplete }) {
  useEffect(() => {
    if (!file || !canvasRef.current) return;

    const element = canvasRef.current;
    cornerstone.enable(element);

    const imageId = cornerstoneWADOImageLoader.wadouri.fileManager.add(file);
    cornerstone.loadImage(imageId).then((image) => {
      cornerstone.displayImage(element, image);

      // 註冊工具並確保能顯示標記
      cornerstoneTools.addTool(cornerstoneTools.FreehandRoiTool);

      if (activeTool === 'FreehandRoi') {
        cornerstoneTools.setToolActive('FreehandRoi', { mouseButtonMask: 1 });
      } else {
        cornerstoneTools.setToolPassive('FreehandRoi'); // 保持可見但不可互動
      }

      element.removeEventListener('cornerstonetoolsmeasurementcompleted', onLabelComplete);
      element.addEventListener('cornerstonetoolsmeasurementcompleted', onLabelComplete);
    }).catch((err) => {
      console.error('Failed to display image:', err);
    });
  }, [file, canvasRef, activeTool]);

  return (
    <div>
      <h2>DICOM Image</h2>
      <div
        ref={canvasRef}
        style={{ width: 512, height: 512, background: 'black' }}
      />
    </div>
  );
}

export default DicomViewer;