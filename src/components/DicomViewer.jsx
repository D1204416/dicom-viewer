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

const DicomViewer = forwardRef(({ file, onLabelComplete, selectedAnnotationUID }, ref) => {
  const elementRef = useRef(null);
  const measurementCompletedHandlerRef = useRef(null);
  
  // 追蹤當前 FreehandRoi 標記的 UID 結構
  const logToolState = () => {
    const element = elementRef.current;
    if (!element) return;
    
    const toolState = cornerstoneTools.getToolState(element, 'FreehandRoi');
    if (toolState && toolState.data) {
      console.log('Current FreehandRoi Tool State:');
      console.log('Total annotations:', toolState.data.length);
      
      toolState.data.forEach((item, index) => {
        console.log(`Item ${index}:`, item);
        
        // 嘗試找出 UID 儲存的位置
        const uidCandidates = {
          uid: item.uid,
          uuid: item.uuid,
          measurementDataUid: item.measurementData?.uid,
          _id: item._id,
          id: item.id
        };
        
        console.log(`Item ${index} UUID/UID candidates:`, uidCandidates);
        
        // 遍歷所有屬性尋找可能的 UID
        for (const key in item) {
          if (typeof item[key] === 'string' && 
              (key.includes('uid') || key.includes('id') || key.includes('uuid'))) {
            console.log(`Found additional ID field: ${key} = ${item[key]}`);
          }
        }
      });
    } else {
      console.log('No FreehandRoi tool state found');
    }
  };

  // 獲取當前所有標記信息
  const getAnnotations = () => {
    const element = elementRef.current;
    if (!element) return [];
    
    const toolState = cornerstoneTools.getToolState(element, 'FreehandRoi');
    if (!toolState || !toolState.data) return [];
    
    return toolState.data.map((item, index) => {
      // 嘗試獲取標記的 UID
      const uid = item.uid || 
                 item.uuid || 
                 item.measurementData?.uid || 
                 item._id || 
                 item.id || 
                 `generated-${index}`;
      
      return { uid, index };
    });
  };

  useImperativeHandle(ref, () => ({
    startDrawing: () => {
      console.log('Start drawing activated');
      cornerstoneTools.setToolActive('FreehandRoi', { mouseButtonMask: 1 });
    },
    
    // 獲取所有標記信息
    getAnnotations: () => {
      return Promise.resolve(getAnnotations());
    },
    
    // 更新編輯功能
    editAnnotation: (uid) => {
      console.log('Attempting to edit annotation with UID:', uid);
      const element = elementRef.current;
      if (!element) {
        console.log('No element reference found');
        return;
      }
      
      // 記錄當前工具狀態以檢查 UID 結構
      logToolState();
      
      // 啟用 FreehandRoi 工具進行編輯
      cornerstoneTools.setToolActive('FreehandRoi', { mouseButtonMask: 1 });
      
      // 嘗試選擇特定標記
      const toolState = cornerstoneTools.getToolState(element, 'FreehandRoi');
      if (!toolState || !toolState.data) {
        console.log('No tool state found');
        return;
      }
      
      // 查找匹配的標記
      const annotations = getAnnotations();
      const matchIndex = annotations.findIndex(annotation => annotation.uid === uid);
      
      if (matchIndex !== -1) {
        const toolIndex = annotations[matchIndex].index;
        console.log(`Found matching annotation at index ${toolIndex}`);
        
        // 標記為活動狀態 (cornerstone-tools 6.x 方式)
        try {
          // 嘗試使用 cornerstone-tools 6.x 中可能的 API
          if (typeof cornerstoneTools.FreehandRoi?.setActiveHandleIndex === 'function') {
            cornerstoneTools.FreehandRoi.setActiveHandleIndex(element, toolIndex, 0);
          }
          
          // 手動標記為活動狀態
          toolState.data.forEach((item, idx) => {
            if (idx === toolIndex) {
              item.active = true;
              if (item.handles) {
                item.handles.activeHandleIndex = 0;
              }
            } else {
              item.active = false;
            }
          });
          
          cornerstone.updateImage(element);
          console.log('Image updated for editing');
          return true;
        } catch (error) {
          console.error('Error activating annotation for edit:', error);
        }
      } else {
        console.log('No matching annotation found for editing');
      }
      
      return false;
    },
    
    // 更新刪除功能
    removeAnnotation: (uid) => {
      console.log('Attempting to remove annotation with UID:', uid);
      const element = elementRef.current;
      if (!element) {
        console.log('No element reference found');
        return false;
      }
      
      // 記錄刪除前的工具狀態
      console.log('Tool state before removal:');
      logToolState();
      
      const toolState = cornerstoneTools.getToolState(element, 'FreehandRoi');
      if (!toolState || !toolState.data) {
        console.log('No tool state found');
        return false;
      }
      
      // 方法 1: 獲取所有標記並根據 UID 找到對應索引
      const annotations = getAnnotations();
      const matchIndex = annotations.findIndex(annotation => annotation.uid === uid);
      
      if (matchIndex !== -1) {
        const toolIndex = annotations[matchIndex].index;
        console.log(`Found matching annotation at index ${toolIndex}, removing...`);
        
        // 從數組中移除
        toolState.data.splice(toolIndex, 1);
        
        // 更新圖像
        cornerstone.updateImage(element);
        
        // 檢查刪除後的狀態
        console.log('Tool state after removal:');
        logToolState();
        
        console.log('Annotation removed successfully');
        return true;
      }
      
      // 方法 2: 如果只有一個標記，直接刪除它
      if (toolState.data.length === 1) {
        console.log('Only one annotation exists, removing it');
        cornerstoneTools.clearToolState(element, 'FreehandRoi');
        cornerstone.updateImage(element);
        console.log('All annotations cleared');
        return true;
      }
      
      // 方法 3: 嘗試保存所有標記並重新添加除要刪除的之外的所有標記
      console.log('Trying alternative removal method');
      const savedAnnotations = [...toolState.data];
      
      // 清除所有標記
      cornerstoneTools.clearToolState(element, 'FreehandRoi');
      
      // 找出要跳過的索引
      let skipIndex = -1;
      savedAnnotations.forEach((item, index) => {
        const annotationUid = item.uid || 
                             item.uuid || 
                             item.measurementData?.uid || 
                             item._id || 
                             item.id;
        
        if (annotationUid === uid) {
          skipIndex = index;
        }
      });
      
      // 重新添加除了要刪除的標記外的所有標記
      savedAnnotations.forEach((annotation, index) => {
        if (index !== skipIndex) {
          cornerstoneTools.addToolState(element, 'FreehandRoi', annotation);
        }
      });
      
      // 如果找不到匹配的標記，則移除最後一個（假設是最近添加的）
      if (skipIndex === -1 && savedAnnotations.length > 0) {
        console.log('No exact match found, removing last annotation');
        cornerstoneTools.clearToolState(element, 'FreehandRoi');
        
        for (let i = 0; i < savedAnnotations.length - 1; i++) {
          cornerstoneTools.addToolState(element, 'FreehandRoi', savedAnnotations[i]);
        }
      }
      
      cornerstone.updateImage(element);
      console.log('Annotations restored excluding the target');
      
      return true;
    }
  }));

  useEffect(() => {
    if (!file || !elementRef.current) return;

    const element = elementRef.current;
    cornerstone.enable(element);

    const imageId = cornerstoneWADOImageLoader.wadouri.fileManager.add(file);
    cornerstone.loadImage(imageId).then(image => {
      cornerstone.displayImage(element, image);

      // 嘗試安全地添加工具
      try {
        // 嘗試檢查工具是否已添加
        try {
          const alreadyAdded = cornerstoneTools.getToolForElement(element, 'FreehandRoi');
          if (!alreadyAdded) {
            console.log('Adding FreehandRoi tool');
            cornerstoneTools.addToolForElement(element, cornerstoneTools.FreehandRoiTool);
          }
        } catch (error) {
          // 如果 getToolForElement 不可用，直接嘗試添加
          try {
            console.log('Adding FreehandRoi tool (fallback method)');
            cornerstoneTools.addTool(cornerstoneTools.FreehandRoiTool);
          } catch (toolError) {
            // 忽略工具已添加的錯誤
            console.log('Tool may already be added (expected):', toolError);
          }
        }
      } catch (error) {
        console.error('Error setting up tools:', error);
      }
      
      // 設置工具為被動模式
      cornerstoneTools.setToolPassive('FreehandRoi');

      // 移除任何現有的事件處理器
      if (measurementCompletedHandlerRef.current) {
        element.removeEventListener(
          'cornerstonetoolsmeasurementcompleted', 
          measurementCompletedHandlerRef.current
        );
        measurementCompletedHandlerRef.current = null;
      }
      
      // 創建去抖動版本的事件處理器
      let debounceTimer = null;
      const handleMeasurementCompleted = (evt) => {
        if (debounceTimer) {
          clearTimeout(debounceTimer);
          debounceTimer = null;
        }
        
        debounceTimer = setTimeout(() => {
          console.log('Measurement completed event:', evt);
          
          // 使用更獨特的 UID 生成方式
          const timestamp = Date.now();
          const randomStr = Math.random().toString(36).substring(2, 10);
          const uid = `uid-${timestamp}-${randomStr}`;
          
          console.log('Generated UID for new annotation:', uid);
          
          // 確保 UID 被設置到工具數據中
          if (evt.detail && evt.detail.measurementData) {
            evt.detail.measurementData.uid = uid;
            
            // 直接獲取並修改工具狀態以確保 UID 設置正確
            const element = elementRef.current;
            const toolState = cornerstoneTools.getToolState(element, 'FreehandRoi');
            
            if (toolState && toolState.data && toolState.data.length > 0) {
              // 找到最後添加的標記（應該是剛剛創建的）
              const lastAnnotation = toolState.data[toolState.data.length - 1];
              
              // 設置多個位置的 UID 以確保它被正確保存
              lastAnnotation.uid = uid;
              if (lastAnnotation.measurementData) {
                lastAnnotation.measurementData.uid = uid;
              }
              
              console.log('UID set on tool state:', uid);
              
              // 更新圖像以確保變更生效
              cornerstone.updateImage(element);
            }
          }
          
          // 記錄新添加標記後的工具狀態
          logToolState();
          
          // 僅在 UID 已設置後回調
          onLabelComplete(uid);
        }, 50); // 50ms 去抖動
      };
      
      // 保存處理器引用以便於清理
      measurementCompletedHandlerRef.current = handleMeasurementCompleted;
      
      // 添加事件監聽器
      element.addEventListener(
        'cornerstonetoolsmeasurementcompleted', 
        measurementCompletedHandlerRef.current
      );
    });
    
    // 清理函數
    return () => {
      if (elementRef.current && measurementCompletedHandlerRef.current) {
        elementRef.current.removeEventListener(
          'cornerstonetoolsmeasurementcompleted', 
          measurementCompletedHandlerRef.current
        );
        measurementCompletedHandlerRef.current = null;
      }
    };
  }, [file, onLabelComplete]);

  // 監聽 selectedAnnotationUID 變化
  useEffect(() => {
    if (selectedAnnotationUID && elementRef.current) {
      console.log('Selected annotation changed to:', selectedAnnotationUID);
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