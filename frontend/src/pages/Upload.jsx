
import { useState } from 'react';

import {
    UploadCloud,
    FileSpreadsheet,
    ShieldCheck,
    CheckCircle,
    AlertCircle
} from 'lucide-react';

import api from '../services/api';

function Upload() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleFileChange = (event) => {
        const file = event.target.files[0];

        setMessage('');
        setError('');

        if (!file) {
            setSelectedFile(null);
            return;
        }

        if (!file.name.toLowerCase().endsWith('.csv')) {
            setSelectedFile(null);
            setError('Please select a CSV file.');
            event.target.value = '';
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setSelectedFile(null);
            setError('File size must not exceed 5 MB.');
            event.target.value = '';
            return;
        }

        setSelectedFile(file);
    };

    const handleUpload = async (event) => {
        event.preventDefault();

        if (!selectedFile) {
            setError('Please select a CSV file first.');
            return;
        }

        setUploading(true);
        setMessage('');
        setError('');

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);

            const response = await api.post(
                '/history/upload',
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            setMessage(
                `${response.data.message}. Records imported: ${response.data.total_records}`
            );

            setSelectedFile(null);
            event.target.reset();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Unable to upload the file. Please try again.'
            );
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="dashboard-page">
            <div className="page-header">
                <div>
                    <h1>Upload Browser History</h1>
                    <p>
                        Import your browsing history to analyze your digital footprint.
                    </p>
                </div>
            </div>

            <section className="dashboard-panel upload-panel">
                <div className="upload-icon">
                    <UploadCloud size={42} />
                </div>

                <h2>Upload your CSV file</h2>

                <p>
                    Select your exported browser history CSV file
                    to begin analyzing your browsing activity.
                </p>

                <form onSubmit={handleUpload}>
                    <label className="upload-dropzone">
                        <FileSpreadsheet size={35} />

                        <strong>Choose a CSV file</strong>

                        <span>CSV format · Maximum size 5 MB</span>

                        <input
                            type="file"
                            accept=".csv,text/csv"
                            hidden
                            onChange={handleFileChange}
                        />
                    </label>

                    {selectedFile && (
                        <p className="selected-file">
                            Selected: {selectedFile.name}
                        </p>
                    )}

                    {error && (
                        <div className="error-message">
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    {message && (
                        <div className="success-message">
                            <CheckCircle size={18} />
                            <span>{message}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="primary-button"
                        disabled={!selectedFile || uploading}
                    >
                        {uploading ? 'Uploading...' : 'Upload and Analyze'}
                    </button>
                </form>

                <div className="upload-privacy">
                    <ShieldCheck size={19} />

                    <span>
                        Your uploaded browsing data remains under your control.
                    </span>
                </div>
            </section>
        </div>
    );
}

export default Upload;
