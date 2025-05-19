# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

# 🩻 DICOM Viewer Web App (React)

本專案為 RD 面試考題實作：建立一個可 **上傳、顯示、解析 DICOM 檔案並進行影像標記的網頁工具**，使用 React + Canvas 技術實作。

---

## 📌 專案功能

- ✅ 上傳 `.dcm` DICOM 影像檔
- ✅ 顯示病患資訊（姓名、生日、年齡、性別）
- ✅ 使用 Canvas 呈現 DICOM 影像
- ✅ 支援多邊形標記（可新增、編輯、刪除）
- ✅ 標記列表管理功能
- ✅ 專案結構模組化，利於維護

---

## 🛠️ 使用技術

- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Cornerstone.js](https://docs.cornerstonejs.org/)（DICOM 顯示）
- HTML5 Canvas（標記繪圖）
- JavaScript (ES6+)

---

## 🚀 專案啟動

### 1. 安裝依賴

```bash
npm install

