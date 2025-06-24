import React from 'react';

function PhotoUploadPanel({ getText, onPhotoUpload }) {
  // 나중에 여기에 사진 업로드 및 처리 로직을 추가합니다.
  const handleUploadClick = () => {
    document.getElementById('photo-upload-input').click();
  };

  // Placeholder for actual photo processing
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && onPhotoUpload) {
      // Simulate recognition and update games state
      // In a real scenario, this would involve an API call or client-side OCR
      console.log('File selected:', file.name);
      // Example: onPhotoUpload([{ id: 1, scores: [25000, 25000, 25000, 25000], isEditable: false }]);
    }
  };

  return (
    <div className="w-full max-w-6xl bg-white rounded-xl shadow-lg p-6 my-4 text-center">
      <h3 className="text-xl font-semibold mb-4 text-gray-800">{getText('scorePhotoInputTitle')}</h3>
      <p className="text-gray-600 mb-6">{getText('scorePhotoInputDesc')}</p>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-500 transition-colors cursor-pointer" onClick={handleUploadClick}>
        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="mt-2 block text-sm font-medium text-gray-900">사진 파일을 여기에 드래그하거나 클릭하여 업로드하세요.</span>
        <input type="file" id="photo-upload-input" className="sr-only" accept="image/*" onChange={handleFileChange} />
      </div>
    </div>
  );
}

export default PhotoUploadPanel;