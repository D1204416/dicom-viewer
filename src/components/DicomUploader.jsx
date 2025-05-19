import React from 'react';

function DicomUploader() {
  const handleUpload = (e) => {
    const file = e.target.files[0];
    console.log('Uploaded DICOM file:', file);
    // TODO: 解析 DICOM 資訊
  };

  return (
    <div>
      <h2>Upload DICOM</h2>
      <input type="file" accept=".dcm" onChange={handleUpload} />
    </div>
  );
}

export default DicomUploader;
