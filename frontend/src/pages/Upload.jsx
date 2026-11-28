
import { useEffect, useState } from 'react';

import {
    UploadCloud,
    FileSpreadsheet,
    ShieldCheck,
    CheckCircle,
    AlertCircle,
    Users
} from 'lucide-react';

import api from '../services/api';
import { getUploadedFiles } from '../services/historyService';

function Upload() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [errorDetails, setErrorDetails] = useState([]);
    const [uploads, setUploads] = useState([]);
    const [uploadsLoading, setUploadsLoading] = useState(true);
    const [uploadsError, setUploadsError] = useState('');

    const loadUploads = async () => {
        try {
            setUploadsError('');
            const data = await getUploadedFiles();
            setUploads(data);
        } catch (err) {
            setUploadsError(
                err.response?.data?.message ||
                'Unable to load team uploads.'
            );
        } finally {
            setUploadsLoading(false);
        }
    };

    useEffect(() => {
        let cancelled = false;

        getUploadedFiles()
            .then((data) => {
                if (!cancelled) {
                    setUploads(data);
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    setUploadsError(
                        err.response?.data?.message ||
                        'Unable to load team uploads.'
                    );
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setUploadsLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, []);

    const handleFileChange = (event) => {
        const file = event.target.files[0];

        setMessage('');
        setError('');
        setErrorDetails([]);

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

        if (file.size > 4 * 1024 * 1024) {
            setSelectedFile(null);
            setError('File size must not exceed 4 MB.');
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
        setErrorDetails([]);

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
                `${response.data.message} ` +
                `Rows: ${response.data.total_records} · ` +
                `Imported: ${response.data.imported_records} · ` +
                `Duplicates: ${response.data.duplicates}`
            );

            setSelectedFile(null);
            event.target.reset();
            loadUploads();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Unable to upload the file. Please try again.'
            );

            setErrorDetails(
                Array.isArray(err.response?.data?.errors)
                    ? err.response.data.errors
                    : []
            );
        } finally {
            setUploading(false);
        }
    };

    const formatUploadDate = (value) => {
        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return '—';
        }

        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="dashboard-page">
            <div className="page-header">
                <div>
                    <h1>Upload Browser History</h1>
                    <p>
                        Add a CSV to the shared team dashboard.
                    </p>
                </div>
            </div>

            <section className="dashboard-panel upload-panel">
                <div className="upload-icon">
                    <UploadCloud size={42} />
                </div>

                <h2>Upload your CSV file</h2>

                <p>
                    Select your exported Chrome or Edge browser history CSV file
                    to begin analyzing your browsing activity.
                </p>

                <div className="upload-format">
                    <h3>Required columns</h3>

                    <p>
                        <code>URL</code>, <code>Title</code> and{' '}
                        <code>Visit Time</code>. Common header variants such as{' '}
                        <code>Website URL</code>, <code>Page Title</code> and{' '}
                        <code>Last Visit Time</code> are recognized automatically,
                        along with ISO, US (MM/DD/YYYY) and Chromium timestamp
                        formats.
                    </p>

                    <p>
                        No export yet?{' '}
                        <a href="/sample-browser-history.csv" download>
                            Download a sample CSV
                        </a>{' '}
                        to test the complete flow.
                    </p>
                </div>

                <form onSubmit={handleUpload}>
                    <label className="upload-dropzone">
                        <FileSpreadsheet size={35} />

                        <strong>Choose a CSV file</strong>

                        <span>Chrome/Edge CSV · Maximum size 4 MB</span>

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

                    {errorDetails.length > 0 && (
                        <ul className="upload-errors">
                            {errorDetails.map((detail, index) => (
                                <li key={index}>{detail}</li>
                            ))}
                        </ul>
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
                        Uploads are visible to every registered team member.
                        Login accounts remain separate.
                    </span>
                </div>
            </section>

            <section className="dashboard-panel team-uploads">
                <div className="panel-header">
                    <div>
                        <h2>Team uploads</h2>
                        <p>CSV files imported by every member</p>
                    </div>

                    <span className="panel-badge">
                        <Users size={14} />
                        {uploads.length} files
                    </span>
                </div>

                {uploadsLoading ? (
                    <p>Loading team uploads...</p>
                ) : uploadsError ? (
                    <div className="error-message">{uploadsError}</div>
                ) : uploads.length === 0 ? (
                    <p>No team uploads yet.</p>
                ) : (
                    <div className="domain-table-wrap">
                        <table className="domain-table uploads-table">
                            <thead>
                                <tr>
                                    <th>File</th>
                                    <th>Uploaded by</th>
                                    <th>Date</th>
                                    <th>Rows</th>
                                    <th>Visits</th>
                                    <th>Status</th>
                                </tr>
                            </thead>

                            <tbody>
                                {uploads.map((file) => (
                                    <tr key={file.id}>
                                        <td>
                                            <strong>{file.file_name}</strong>
                                        </td>
                                        <td>{file.uploader_name || 'Unknown member'}</td>
                                        <td>{formatUploadDate(file.upload_date)}</td>
                                        <td>{file.row_count}</td>
                                        <td>
                                            <span className="domain-visits">
                                                {file.visit_count}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="history-category">
                                                {file.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}

export default Upload;
