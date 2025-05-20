// components/DicomViewer.jsx
import React, { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';
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
  // 用於保存和恢復標記數據
  const [internalAnnotations, setInternalAnnotations] = useState([]);
  
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
    if (!element) return internalAnnotations;
    
    const toolState = cornerstoneTools.getToolState(element, 'FreehandRoi');
    if (!toolState || !toolState.data) return internalAnnotations;
    
    const annotations = toolState.data.map((item, index) => {
      // 嘗試獲取標記的 UID
      const uid = item.uid || 
                 item.uuid || 
                 item.measurementData?.uid || 
                 item._id || 
                 item.id || 
                 `generated-${index}`;
      
      return { 
        uid, 
        index,
        data: { ...item } // 保存完整的標記數據以便恢復
      };
    });
    
    // 更新內部保存的標記
    setInternalAnnotations(annotations);
    
    return annotations;
  };

  // 保存當前工具狀態
  const saveAnnotations = () => {
    const annotations = getAnnotations();
    console.log('Saving annotations:', annotations);
    setInternalAnnotations(annotations);
    return annotations;
  };

  // 恢復保存的工具狀態
  const restoreAnnotations = () => {
    const element = elementRef.current;
    if (!element || internalAnnotations.length === 0) return false;
    
    console.log('Restoring annotations:', internalAnnotations);
    
    try {
      // 清除當前工具狀態
      cornerstoneTools.clearToolState(element, 'FreehandRoi');
      
      // 恢復保存的標記
      internalAnnotations.forEach(annotation => {
        if (annotation.data) {
          cornerstoneTools.addToolState(element, 'FreehandRoi', annotation.data);
        }
      });
      
      // 更新圖像
      cornerstone.updateImage(element);
      
      return true;
    } catch (error) {
      console.error('Error restoring annotations:', error);
      return false;
    }
  };

  useImperativeHandle(ref, () => ({
    startDrawing: () => {
      console.log('Start drawing activated');
      // 確保工具狀態可用
      restoreAnnotations();
      cornerstoneTools.setToolActive('FreehandRoi', { mouseButtonMask: 1 });
    },
    
    // 獲取所有標記信息
    getAnnotations: () => {
      // 嘗試恢復標記如果沒有找到
      const toolState = cornerstoneTools.getToolState(elementRef.current, 'FreehandRoi');
      if (!toolState || !toolState.data || toolState.data.length === 0) {
        restoreAnnotations();
      }
      
      return Promise.resolve(getAnnotations());
    },
    
    // 更新編輯功能
    editAnnotation: (uid) => {
      console.log('Attempting to edit annotation with UID:', uid);
      const element = elementRef.current;
      if (!element) {
        console.log('No element reference found');
        return false;
      }
      
      // 記錄當前工具狀態以檢查 UID 結構
      logToolState();
      
      // 檢查工具狀態，如果不存在則嘗試恢復
      let toolState = cornerstoneTools.getToolState(element, 'FreehandRoi');
      if (!toolState || !toolState.data || toolState.data.length === 0) {
        console.log('No tool state found, attempting to restore');
        const restored = restoreAnnotations();
        if (!restored) {
          console.log('Failed to restore annotations');
          return false;
        }
        toolState = cornerstoneTools.getToolState(element, 'FreehandRoi');
      }
      
      // 再次檢查工具狀態
      if (!toolState || !toolState.data) {
        console.log('Still no tool state after restoration attempt');
        return false;
      }
      
      // 啟用 FreehandRoi 工具進行編輯
      cornerstoneTools.setToolActive('FreehandRoi', { mouseButtonMask: 1 });
      
      // 查找匹配的標記
      let foundMatch = false;
      toolState.data.forEach((item, index) => {
        // 檢查所有可能的 UID 位置
        const itemUid = item.uid || 
                       item.uuid || 
                       item.measurementData?.uid || 
                       item._id || 
                       item.id;
        
        if (itemUid === uid) {
          console.log(`Found matching annotation at index ${index}`);
          foundMatch = true;
          
          // 標記為活動狀態
          try {
            item.active = true;
            if (item.handles) {
              item.handles.activeHandleIndex = 0;
            }
          } catch (error) {
            console.error('Error activating annotation:', error);
          }
        } else if (item) {
          // 取消其他標記的活動狀態
          item.active = false;
        }
      });
      
      // 更新圖像
      cornerstone.updateImage(element);
      
      // 保存當前狀態
      saveAnnotations();
      
      return foundMatch;
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
      
      // 檢查工具狀態，如果不存在則嘗試恢復
      let toolState = cornerstoneTools.getToolState(element, 'FreehandRoi');
      if (!toolState || !toolState.data || toolState.data.length === 0) {
        console.log('No tool state found, attempting to restore');
        const restored = restoreAnnotations();
        if (!restored) {
          console.log('Failed to restore annotations');
          return false;
        }
        toolState = cornerstoneTools.getToolState(element, 'FreehandRoi');
      }
      
      // 再次檢查工具狀態
      if (!toolState || !toolState.data) {
        console.log('Still no tool state after restoration attempt');
        return false;
      }
      
      // 查找要刪除的標記
      let matchingIndex = -1;
      for (let i = 0; i < toolState.data.length; i++) {
        const item = toolState.data[i];
        const itemUid = item.uid || 
                       item.uuid || 
                       item.measurementData?.uid || 
                       item._id || 
                       item.id;
        
        if (itemUid === uid) {
          matchingIndex = i;
          break;
        }
      }
      
      if (matchingIndex !== -1) {
        console.log(`Found matching annotation at index ${matchingIndex}, removing...`);
        
        // 從數組中移除
        toolState.data.splice(matchingIndex, 1);
        
        // 更新圖像
        cornerstone.updateImage(element);
        
        // 檢查刪除後的狀態
        console.log('Tool state after removal:');
        logToolState();
        
        // 更新內部保存的標記
        saveAnnotations();
        
        console.log('Annotation removed successfully');
        return true;
      } else {
        console.log('No matching annotation found to remove');
        return false;
      }
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
        console.log('Adding FreehandRoi tool');
        cornerstoneTools.addTool(cornerstoneTools.FreehandRoiTool);
        cornerstoneTools.setToolPassive('FreehandRoi');
      } catch (error) {
        console.log('Tool may already be added (expected):', error);
        // 即使報錯也繼續（可能工具已添加）
        cornerstoneTools.setToolPassive('FreehandRoi');
      }

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
          }
          
          // 獲取工具狀態並設置 UID
          const toolState = cornerstoneTools.getToolState(element, 'FreehandRoi');
          if (toolState && toolState.data && toolState.data.length > 0) {
            // 找到最後添加的標記（應該是剛剛創建的）
            const lastAnnotation = toolState.data[toolState.data.length - 1];
            
            // 設置 UID 到多個可能的位置
            lastAnnotation.uid = uid;
            if (lastAnnotation.measurementData) {
              lastAnnotation.measurementData.uid = uid;
            }
            
            console.log('UID set on tool state:', uid);
            
            // 更新圖像以確保變更生效
            cornerstone.updateImage(element);
          }
          
          // 記錄新添加標記後的工具狀態
          logToolState();
          
          // 保存當前狀態 - 這是關鍵改進
          saveAnnotations();
          
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