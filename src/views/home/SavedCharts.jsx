import { useEffect, useState } from "react";
import { useAuth } from '../other/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toastSuccess, toastWarning } from '../components/Notifications';
import { Button, Spinner } from "flowbite-react";
const SavedCharts = () => {
    const navigate = useNavigate();
    const [charts, setCharts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { startLoad, stopLoad, host } = useAuth();

    useEffect(() => {
        if (localStorage.getItem('token') == null) { 
            navigate('/login'); 
            toastWarning("Please login first");
        }
    }, []);

    useEffect(() => {
        fetchCharts();
    }, []);

    const fetchCharts = async () => {
        try {
            const response = await fetch(`${host}/api/save/`, {
                method: "GET",
                headers: { Authorization: `Token ${localStorage.getItem('token')}` },
            });
            if (response.ok) {
                const data = await response.json();
                setCharts(data);
            }
        } catch (error) {
            console.error("Error fetching charts:", error);
        } finally {
            setLoading(false);
        }
    };

    const getFileName = (url) => {
        return url.split("/").pop();
    };

    const handleDownload = (url) => {
        fetch(url)
            .then(response => response.blob())
            .then(blob => {
                const blobUrl = window.URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = blobUrl;
                link.download = getFileName(url);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(blobUrl);
            })
            .catch(error => {
                console.error("Error downloading image:", error);
                toastWarning("Failed to download chart.");
            });
    };

    const handleDelete = async (id) => {
        try {
            const response = await fetch(`${host}/api/save/${id}/`, {
                method: "DELETE",
                headers: { Authorization: `Token ${localStorage.getItem('token')}` },
            });
            if (response.ok) {
                setCharts(charts.filter((chart) => chart.id !== id));
                toastSuccess("Chart deleted successfully");
            }
        } catch (error) {
            console.error("Error deleting chart:", error);
        }
    };

    const toggleDashboard = async (id) => {
        try {
            const response = await fetch(`${host}/api/save/${id}/toggle_dashboard/`, {
                method: "POST",
                headers: { 
                    Authorization: `Token ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
            });
            if (response.ok) {
                const data = await response.json();
                setCharts(charts.map(chart => 
                    chart.id === id 
                        ? {...chart, is_in_dashboard: data.is_in_dashboard}
                        : chart
                ));
                toastSuccess(`Chart ${data.is_in_dashboard ? 'added to' : 'removed from'} dashboard`);
            }
        } catch (error) {
            console.error("Error toggling dashboard:", error);
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Saved Charts
                </h2>
                <Button onClick={() => navigate('/dashboard')} className="bg-blue-600">
                    View Dashboard
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center">
                    <Spinner size="xl" />
                </div>
            ) : charts.length === 0 ? (
                <p className="text-center text-gray-500">No charts saved yet.</p>
            ) : (
                <div className="grid md:grid-cols-3 sm:grid-cols-2 gap-6">
                    {charts.map((chart) => (
                        <div key={chart.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                            <a href={chart.chart} target="_blank" rel="noopener noreferrer">
                                <img
                                    src={chart.chart}
                                    alt="Saved Chart"
                                    className="w-full h-48 object-cover"
                                />
                            </a>
                            <div className="p-4 text-center">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                                    {getFileName(chart.chart)}
                                </h3>
                                <div className="mt-3 flex justify-center gap-2">
                                    <button
                                        onClick={() => handleDownload(chart.chart)}
                                        className="px-3 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800"
                                    >
                                        <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M14.707 7.793a1 1 0 0 0-1.414 0L11 10.086V1.5a1 1 0 0 0-2 0v8.586L6.707 7.793a1 1 0 1 0-1.414 1.414l4 4a1 1 0 0 0 1.416 0l4-4a1 1 0 0 0-.002-1.414Z" />
                                        </svg>
                                        Download
                                    </button>
                                    <button
                                        onClick={() => toggleDashboard(chart.id)}
                                        className={`px-3 py-2 text-sm font-medium text-white rounded-lg ${
                                            chart.is_in_dashboard 
                                                ? 'bg-green-600 hover:bg-green-700'
                                                : 'bg-gray-600 hover:bg-gray-700'
                                        }`}
                                    >
                                        {chart.is_in_dashboard ? 'In Dashboard' : 'Add to Dashboard'}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(chart.id)}
                                        className="px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                                    >
                                        <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SavedCharts;