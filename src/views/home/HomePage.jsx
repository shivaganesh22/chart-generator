import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../other/AuthContext';
import { toastWarning, toastSuccess } from '../components/Notifications';
import { Upload, X, FileText, CheckCircle, AlertTriangle } from 'lucide-react';

const HomePage = () => {
  const { startLoad, stopLoad, host } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setUploadStatus(null);
    } else {
      toastWarning('Please upload a valid CSV file.');
      setUploadStatus('error');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'text/csv') {
      setFile(droppedFile);
      setUploadStatus(null);
    } else {
      toastWarning('Please upload a valid CSV file.');
      setUploadStatus('error');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toastWarning('Please select a file to upload.');
      return;
    }

    startLoad();
    setUploadStatus(null);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${host}/api/upload/`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        toastSuccess('File uploaded and preprocessed successfully!');
        setUploadStatus('success');
        navigate('/charts', { state: { data } });
      } else {
        toastWarning('Failed to upload and preprocess the file.');
        setUploadStatus('error');
      }
    } catch (error) {
      toastWarning('An error occurred while uploading the file.');
      setUploadStatus('error');
    } finally {
      stopLoad();
    }
  };

  const removeFile = () => {
    setFile(null);
    setUploadStatus(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <main className="flex  justify-center  py-12 px-4 sm:px-6 lg:px-8 ">
      <div className="max-w-3xl w-full">
        <div className="bg-white shadow-xl rounded-lg p-8"> {/* Card container */}
          <div>
            <h1 className="text-left text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              Data Analysis Dashboard
            </h1>
            <p className="mt-2 text-left text-sm text-gray-600">
              Upload your CSV file for advanced data preprocessing and visualization
            </p>
          </div>

          <div
            className={`
              mt-6 flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-colors duration-300 ease-in-out
              ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white hover:border-gray-400 hover:shadow-md'}
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv"
              className="hidden"
            />

            {!file && (
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" strokeWidth={1.5} />
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 ease-in-out rounded"
                  >
                    Choose a file
                  </button>
                  <span className="text-gray-500"> or drag and drop</span>
                </div>
                <p className="mt-2 text-sm text-gray-500">CSV files only</p>
              </div>
            )}

            {file && (
              <div className="w-full">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg shadow">
                  <div className="flex items-center space-x-4">
                    <FileText className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="p-2 hover:bg-gray-200 rounded-full transition-colors duration-200"
                  >
                    <X className="h-5 w-5 text-gray-500 hover:text-red-500" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {uploadStatus === 'error' && (
            <div className="mt-4 rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Upload Error</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>There was a problem uploading your file. Please ensure it's a valid CSV and try again.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-start">
            <button
              type="button"
              onClick={handleUpload}
              disabled={!file}
              className={`
                px-5 py-2.5 rounded-md text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-300
                ${file ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500' : 'bg-gray-400 cursor-not-allowed'}
              `}
            >
              Process Dataset
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default HomePage;