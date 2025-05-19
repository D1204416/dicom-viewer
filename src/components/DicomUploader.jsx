// components/DicomUploader.jsx
import React from 'react';
import * as dicomParser from 'dicom-parser';

function DicomUploader({ setPatientInfo }) {
  const handleUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = function () {
      try {
        const arrayBuffer = reader.result;
        const byteArray = new Uint8Array(arrayBuffer);
        const dataSet = dicomParser.parseDicom(byteArray);

        const name = dataSet.string('x00100010');
        const birthdate = dataSet.string('x00100030');
        const sex = dataSet.string('x00100040');

        // 簡單推估年齡
        const birthYear = birthdate ? birthdate.substring(0, 4) : '0000';
        const currentYear = new Date().getFullYear();
        const age = currentYear - parseInt(birthYear);

        setPatientInfo({ name, birthdate, sex, age });
      } catch (err) {
        console.error('DICOM parsing failed:', err);
        alert('無法解析 DICOM 檔案');
      }
    };

    if (file) {
      reader.readAsArrayBuffer(file);
    }
  };

  return (
    <div>
      <h2>Upload DICOM</h2>
      <input type="file" accept=".dcm" onChange={handleUpload} />
    </div>
  );
}

export default DicomUploader;
