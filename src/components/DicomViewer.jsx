// components/DicomViewer.jsx
import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import * as cornerstone from 'cornerstone-core';
import * as cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';
import * as dicomParser from 'dicom-parser';
import * as cornerstoneTools from 'cornerstone-tools';
import * as cornerstoneMath from 'cornerstone-math';
import Hammer from 'hammerjs';

// 初始化 cornerstone 套件依賴
cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
cornerstoneWADOImageLoader.external.dicomParser = dicomParser;
cornerstoneTools.external.cornerstone = cornerstone;
cornerstoneTools.external.cornerstoneMath = cornerstoneMath;
cornerstoneTools.external.Hammer = Hammer;

cornerstoneWADOImageLoader.configure({});
cornerstoneTools.init();

const DicomViewer = forwardRef(({ file, onLabelComplete }, ref) => {
  const elementRef = useRef(null);

  useImperativeHandle(ref, () => ({
    startDrawing: () => {
      cornerstoneTools.setToolActive('FreehandRoi', { mouseButtonMask: 1 });
    },
    removeAnnotation: (uid) => {
      const element = elementRef.current;
      if (!element) return;

      const toolState = cornerstoneTools.getToolState(element, 'FreehandRoi');
      if (!toolState || !toolState.data) return;

      const originalData = toolState.data;

      // 先清除全部
      cornerstoneTools.clearToolState(element, 'FreehandRoi');

      // 把未刪除的標記重新加入
      const remaining = originalData.filter(item => item?.measurementData?.uid !== uid);
      remaining.forEach(item => {
        cornerstoneTools.addToolState(element, 'FreehandRoi', item);
      });

      cornerstone.updateImage(element);
    }

  }));

  useEffect(() => {
    if (!file || !elementRef.current) return;

    const element = elementRef.current;
    cornerstone.enable(element);

    const imageId = cornerstoneWADOImageLoader.wadouri.fileManager.add(file);
    cornerstone.loadImage(imageId).then(image => {
      cornerstone.displayImage(element, image);

      cornerstoneTools.addTool(cornerstoneTools.FreehandRoiTool);
      cornerstoneTools.setToolPassive('FreehandRoi');

      // 當標記完成時回傳 UID
      element.addEventListener('cornerstonetoolsmeasurementcompleted', (evt) => {
        const uid = evt.detail?.measurementData?.uid ?? `auto-${Date.now()}`;
        onLabelComplete(uid);
      });
    });
  }, [file]);

  return (
    <div>
      <h2>DICOM Image</h2>
      <div
        ref={elementRef}
        style={{ width: 512, height: 512, background: 'black' }}
      />
    </div>
  );
});

export default DicomViewer;
