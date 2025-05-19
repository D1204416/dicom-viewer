// components/DicomViewer.jsx
import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
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

const DicomViewer = forwardRef(({ file, onLabelComplete, selectedAnnotationUID }, ref) => {
  const elementRef = useRef(null);

  useImperativeHandle(ref, () => ({
    startDrawing: () => {
      cornerstoneTools.setToolActive('FreehandRoi', { mouseButtonMask: 1 });
    },
    removeAnnotation: (uid) => {
      const toolState = cornerstoneTools.globalToolStateManager.get('FreehandRoi');
      const toolData = toolState[elementRef.current?.id] || [];
      const remaining = toolData.data.filter(item => item.annotationUID !== uid);
      toolState[elementRef.current?.id].data = remaining;
      cornerstone.updateImage(elementRef.current);
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

      element.addEventListener('cornerstonetoolsmeasurementcompleted', (evt) => {
        console.log('📌 evt.detail:', evt.detail);
        console.log('🧩 measurementData:', evt.detail?.measurementData);

        const uid = evt.detail?.measurementData?.uid ?? `auto-${Date.now()}`;
        onLabelComplete(uid);
      });
    });
  }, [file]);

  useEffect(() => {
    if (selectedAnnotationUID && elementRef.current) {
      cornerstoneTools.annotation.state.setAnnotationSelected(selectedAnnotationUID);
    }
  }, [selectedAnnotationUID]);

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