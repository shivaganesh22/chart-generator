import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area, LineChart, Line, ScatterChart, Scatter,
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Treemap,
    ReferenceArea
} from 'recharts';
import { useAuth } from '../other/AuthContext';
import { useNavigate } from 'react-router-dom'
import { toastSuccess, toastWarning } from '../components/Notifications';

const COLORS = [
    '#33A1FF', "#FF5733", "#33FF57", "#3357FF", "#FF33A1", "#33FFF5",
    "#F5FF33", "#A133FF", "#FF3333", "#33FF33", "#3333FF",
    "#FF8C33", "#33FF8C", "#338CFF", "#FF338C", "#33FFC4",
    "#C4FF33", "#8C33FF", "#FF333D", "#33FF5A", "#335AFF",
    "#FF33C4", "#33FF8C", "#338CFF", "#FF338C", "#33FFC4",
    "#C4FF33", "#8C33FF", "#FF333D", "#33FF5A", "#335AFF"
];


const TREND_LINES = ['Linear', 'Exponential', 'Logarithmic', 'Power', 'Polynomial', 'Average', 'Minimum', 'Maximum'];
const PRECISION_OPTIONS = [1, 0.1, 0.01, 0.001, 0.0001, 0.00001, 0.000001];

const ChartDashboard = () => {
    const location = useLocation();
    const [activeMenu, setActiveMenu] = useState('fields');
    const [chartType, setChartType] = useState('bar');
    const [chartData, setChartData] = useState([]);
    const [columns, setColumns] = useState([]);
    const { startLoad, stopLoad, host } = useAuth();
    const navigate = useNavigate();
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(false);
    const [csvFile, setCsvFile] = useState(null);
    const [fields, setFields] = useState({
        xAxis: '',
        yAxis: '',
        secondaryAxis: '',
    });

    const [options, setOptions] = useState({
        title: '',
        xAxisTitle: '',
        yAxisTitle: '',
        showLegend: true,
        hideXAxisLabels: false,
        logarithmicScale: false,
        orientation: 'vertical',
        showValues: true,
        yAxisRange: {
            min: '',
            max: '',
        },
        trendLine: {
            enabled: false,
            type: 'Linear',
        },
        showGrid: true,
        barColor: COLORS[0],
    });

    const [format, setFormat] = useState({
        precision: 1,
        prefix: '',
        postfix: '',
    });

    useEffect(() => {
        if (location.state?.data) {
            const { columns: cols, data } = location.state.data;
            const processedData = data.map((row, index) => {
                const obj = {};
                cols.forEach((col, colIndex) => {
                    obj[col] = row[colIndex];
                });
                return obj;
            });
            setChartData(processedData);
            setCsvFile(processedData);

            setColumns(cols);
            setFields(prev => ({
                ...prev,
                xAxis: cols[0] || '',
                yAxis: cols[1] || '',
            }));
        }
    }, [location.state]);
    const handleGenerateInsights = async () => {
        if (!csvFile) {
            console.error("No CSV data to send.");
            return;
        }

        setLoading(true);
        setInsights(null); // Reset previous insights

        try {
            const formData = new FormData();
            // Convert data to CSV and append to formData
            const csvContent = convertDataToCSV(csvFile); // function to convert JSON data to CSV
            const blob = new Blob([csvContent], { type: "text/csv" });
            formData.append("file", blob, "data.csv");

            const response = await fetch(`${host}/api/insights/`, {
                method: "POST",
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                setInsights(data.insights);  // Store insights
            } else {
                console.error("Failed to generate insights");
            }
        } catch (error) {
            console.error("Error fetching insights:", error);
        } finally {
            setLoading(false);
        }
    };

    // Function to convert JSON data to CSV format
    const convertDataToCSV = (data) => {
        const headers = Object.keys(data[0]);
        const rows = data.map(row =>
            headers.map(header => row[header]).join(',')
        );
        return [headers.join(','), ...rows].join('\n');
    };


    const formatValue = (value) => {
        if (typeof value !== 'number') return value;
        const formatted = Number(value).toFixed(Math.abs(Math.log10(format.precision)));
        return `${format.prefix}${formatted}${format.postfix}`;
    };

    const handleDownload = () => {
        const svg = document.querySelector('.recharts-wrapper svg');
        if (svg) {
            const svgData = new XMLSerializer().serializeToString(svg);
            const blob = new Blob([svgData], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${options.title || 'chart'}.svg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    };
    const handleSave = async () => {
        if (localStorage.getItem('token') == null) { navigate('/login'); toastWarning("Please login first") }
        const svg = document.querySelector('.recharts-wrapper svg');
        if (!svg) {
            console.error("No SVG found!");
            toastWarning("No chart found to save.");
            return;
        }

        // Convert SVG to a PNG using a Canvas
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const svgData = new XMLSerializer().serializeToString(svg);
        const img = new Image();

        const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(blob);

        img.onload = async () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(url);

            // Convert canvas to a Blob (PNG)
            canvas.toBlob(async (blob) => {
                if (!blob) {
                    console.error("Failed to generate image blob.");
                    toastWarning("Failed to process image.");
                    return;
                }

                const formData = new FormData();
                formData.append("chart", blob, `${chartType} Chart.png`);  // Append PNG image
                // formData.append("dataset", JSON.stringify(options)); // Optional: Attach dataset

                try {
                    const response = await fetch(`${host}/api/save/`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Token ${localStorage.getItem('token')}`,
                        },
                        body: formData,
                    });

                    if (response.ok) {
                        console.log("Image saved successfully");
                        toastSuccess("Saved Successfully");
                    } else {
                        console.error("Failed to save image");
                        toastWarning("Failed to save chart");
                    }
                } catch (error) {
                    console.error("Error saving image:", error);
                    toastWarning("Error occurred while saving.");
                }
            }, "image/png");
        };

        img.onerror = () => {
            console.error("Failed to load image.");
            toastWarning("Error converting chart.");
        };

        img.src = url;  // Set image source to converted SVG URL
    };


    const renderChart = () => {
        const CommonProps = {
            margin: { top: 20, right: 30, left: 20, bottom: 5 },
        };

        switch (chartType) {
            case 'bar':
                return (
                    <BarChart {...CommonProps} data={chartData}>
                        {options.showGrid && <CartesianGrid strokeDasharray="3 3" />}
                        <XAxis
                            dataKey={fields.xAxis}
                            hide={options.hideXAxisLabels}
                            label={{ value: options.xAxisTitle, position: 'bottom' }}
                            scale={options.logarithmicScale ? 'log' : 'auto'}
                        />
                        <YAxis
                            domain={[
                                options.yAxisRange.min || 'auto',
                                options.yAxisRange.max || 'auto'
                            ]}
                            label={{ value: options.yAxisTitle, angle: -90, position: 'left' }}
                        />
                        <Tooltip formatter={formatValue} />
                        {options.showLegend && <Legend />}
                        <Bar
                            dataKey={fields.yAxis}
                            fill={options.barColor}
                            label={options.showValues ? { position: 'top', formatter: formatValue } : false}
                        />
                        {fields.secondaryAxis && (
                            <Bar
                                dataKey={fields.secondaryAxis}
                                fill={COLORS[1]}
                                label={options.showValues ? { position: 'top', formatter: formatValue } : false}
                            />
                        )}
                        {options.trendLine.enabled && (
                            <ReferenceArea x1={0} x2="100%" y1={0} y2="100%" fill="#8884d8" fillOpacity={1} />
                        )}
                    </BarChart>
                );

            case 'pie':
                return (
                    <PieChart {...CommonProps}>
                        <Pie
                            data={chartData}
                            dataKey={fields.yAxis}
                            nameKey={fields.xAxis}
                            cx="50%"
                            cy="50%"
                            outerRadius={250}
                            label
                        >
                            {chartData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip formatter={formatValue} />
                        {options.showLegend && <Legend />}
                    </PieChart>
                );

            case 'area':
                return (
                    <AreaChart {...CommonProps} data={chartData}>
                        {options.showGrid && <CartesianGrid strokeDasharray="3 3" />}
                        <XAxis
                            dataKey={fields.xAxis}
                            hide={options.hideXAxisLabels}
                            label={{ value: options.xAxisTitle, position: 'bottom' }}
                        />
                        <YAxis
                            domain={[
                                options.yAxisRange.min || 'auto',
                                options.yAxisRange.max || 'auto'
                            ]}
                            label={{ value: options.yAxisTitle, angle: -90, position: 'left' }}
                        />
                        <Tooltip formatter={formatValue} />
                        {options.showLegend && <Legend />}
                        <Area
                            type="monotone"
                            dataKey={fields.yAxis}
                            fill={options.barColor}
                            stroke={options.barColor}
                        />
                    </AreaChart>
                );

            case 'line':
                return (
                    <LineChart {...CommonProps} data={chartData}>
                        {options.showGrid && <CartesianGrid strokeDasharray="3 3" />}
                        <XAxis
                            dataKey={fields.xAxis}
                            hide={options.hideXAxisLabels}
                            label={{ value: options.xAxisTitle, position: 'bottom' }}
                        />
                        <YAxis
                            domain={[
                                options.yAxisRange.min || 'auto',
                                options.yAxisRange.max || 'auto'
                            ]}
                            label={{ value: options.yAxisTitle, angle: -90, position: 'left' }}
                        />
                        <Tooltip formatter={formatValue} />
                        {options.showLegend && <Legend />}
                        <Line
                            type="monotone"
                            dataKey={fields.yAxis}
                            stroke={options.barColor}
                        />
                    </LineChart>
                );

            case 'scatter':
                return (
                    <ScatterChart {...CommonProps}>
                        {options.showGrid && <CartesianGrid strokeDasharray="3 3" />}
                        <XAxis
                            dataKey={fields.xAxis}
                            hide={options.hideXAxisLabels}
                            label={{ value: options.xAxisTitle, position: 'bottom' }}
                        />
                        <YAxis
                            dataKey={fields.yAxis}
                            domain={[
                                options.yAxisRange.min || 'auto',
                                options.yAxisRange.max || 'auto'
                            ]}
                            label={{ value: options.yAxisTitle, angle: -90, position: 'left' }}
                        />
                        <Tooltip formatter={formatValue} />
                        {options.showLegend && <Legend />}
                        <Scatter
                            data={chartData}
                            fill={options.barColor}
                        />
                    </ScatterChart>
                );

            case 'radar':
                function aggregateData(groupByColumn, aggregateColumn) {
                    const groupedData = {};
                    chartData.forEach(item => {
                        const key = item[groupByColumn];
                        groupedData[key] = (groupedData[key] || 0) + item[aggregateColumn];
                    });
                    return Object.entries(groupedData).map(([key, value]) => ({ [groupByColumn]: key, [aggregateColumn]: value }));
                }


                return (

                    <RadarChart {...CommonProps} data={aggregateData(fields.xAxis, fields.yAxis)}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey={fields.xAxis} />
                        <PolarRadiusAxis />
                        <Radar dataKey={fields.yAxis} fill={options.barColor} fillOpacity={0.6} />
                        <Tooltip />
                        {options.showLegend && <Legend />}
                    </RadarChart>
                );

            case 'treemap':

                return (
                    <ResponsiveContainer width="100%" height={400}>
                        <Treemap
                            {...CommonProps}
                            data={aggregateData(fields.xAxis, fields.yAxis)}
                            dataKey={fields.yAxis}
                            nameKey={fields.xAxis}
                            fill={options.barColor}
                            content={(props) => {
                                if (!props.children) return null;

                                return props.children.map((child, index) => {
                                    const { x, y, width, height, value, payload } = child;

                                    console.log("Treemap Cell Data:", child);

                                    const name = child[fields.xAxis] || "Unknown";

                                    return width > 30 && height > 20 ? (
                                        <g key={index}>
                                            <rect x={x} y={y} width={width} height={height} fill={options.barColor} stroke="#fff" />
                                            <text x={x + width / 2} y={y + height / 3} textAnchor="middle" fill="white" fontSize="12px">
                                                {name}
                                            </text>
                                            <text x={x + width / 2} y={y + (2 * height) / 3} textAnchor="middle" fill="white" fontSize="12px">
                                                {value}
                                            </text>
                                        </g>
                                    ) : null;
                                });
                            }}
                        />
                        <Tooltip />
                    </ResponsiveContainer>


                );

            default:
                return <div>Select a chart type</div>
        }
    };

    const renderSidebarContent = () => {
        switch (activeMenu) {
            case 'fields':
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">X-Axis</label>
                            <select
                                value={fields.xAxis}
                                onChange={(e) => setFields({ ...fields, xAxis: e.target.value })}
                                className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                            >
                                {columns.map(col => (
                                    <option key={col} value={col}>{col}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Y-Axis</label>
                            <select
                                value={fields.yAxis}
                                onChange={(e) => setFields({ ...fields, yAxis: e.target.value })}
                                className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                            >
                                {columns.map(col => (
                                    <option key={col} value={col}>{col}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Secondary Axis (Optional)</label>
                            <select
                                value={fields.secondaryAxis}
                                onChange={(e) => setFields({ ...fields, secondaryAxis: e.target.value })}
                                className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                            >
                                <option value="">None</option>
                                {columns.map(col => (
                                    <option key={col} value={col}>{col}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                );

            case 'options':
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Title</label>
                            <input
                                type="text"
                                value={options.title}
                                onChange={(e) => setOptions({ ...options, title: e.target.value })}
                                className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">X-Axis Title</label>
                            <input
                                type="text"
                                value={options.xAxisTitle}
                                onChange={(e) => setOptions({ ...options, xAxisTitle: e.target.value })}
                                className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Y-Axis Title</label>
                            <input
                                type="text"
                                value={options.yAxisTitle}
                                onChange={(e) => setOptions({ ...options, yAxisTitle: e.target.value })}
                                className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={options.showLegend}
                                    onChange={(e) => setOptions({ ...options, showLegend: e.target.checked })}
                                    className="mr-2"
                                />
                                Show Legend
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={options.hideXAxisLabels}
                                    onChange={(e) => setOptions({ ...options, hideXAxisLabels: e.target.checked })}
                                    className="mr-2"
                                />
                                Hide X-Axis Labels
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={options.logarithmicScale}
                                    onChange={(e) => setOptions({ ...options, logarithmicScale: e.target.checked })}
                                    className="mr-2"
                                />
                                Logarithmic Graph
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={options.showValues}
                                    onChange={(e) => setOptions({ ...options, showValues: e.target.checked })}
                                    className="mr-2"
                                />
                                Show Values on Graph
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={options.showGrid}
                                    onChange={(e) => setOptions({ ...options, showGrid: e.target.checked })}
                                    className="mr-2"
                                />
                                Show Grid
                            </label>
                        </div>
                        {/* <div>
                            <label className="block text-sm font-medium text-gray-700">Orientation</label>
                            <div className="mt-1 space-x-4">
                                <label className="inline-flex items-center">
                                    <input
                                        type="radio"
                                        checked={options.orientation === 'vertical'}
                                        onChange={() => setOptions({ ...options, orientation: 'vertical' })}
                                        className="mr-2"
                                    />
                                    Vertical
                                </label>
                                <label className="inline-flex items-center">
                                    <input
                                        type="radio"
                                        checked={options.orientation === 'horizontal'}
                                        onChange={() => setOptions({ ...options, orientation: 'horizontal' })}
                                        className="mr-2"
                                    />
                                    Horizontal
                                </label>
                            </div>
                        </div> */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Y-Axis Range</label>
                            <div className="grid grid-cols-2 gap-2 mt-1">
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={options.yAxisRange.min}
                                    onChange={(e) => setOptions({
                                        ...options,
                                        yAxisRange: { ...options.yAxisRange, min: e.target.value }
                                    })}
                                    className="block w-full rounded-md border border-gray-300 p-2"
                                />
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={options.yAxisRange.max}
                                    onChange={(e) => setOptions({
                                        ...options,
                                        yAxisRange: { ...options.yAxisRange, max: e.target.value }
                                    })}
                                    className="block w-full rounded-md border border-gray-300 p-2"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Trend Line</label>
                            <div className="mt-1 space-y-2">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={options.trendLine.enabled}
                                        onChange={(e) => setOptions({
                                            ...options,
                                            trendLine: { ...options.trendLine, enabled: e.target.checked }
                                        })}
                                        className="mr-2"
                                    />
                                    Enable Trend Line
                                </label>
                                <select
                                    value={options.trendLine.type}
                                    onChange={(e) => setOptions({
                                        ...options,
                                        trendLine: { ...options.trendLine, type: e.target.value }
                                    })}
                                    className="block w-full rounded-md border border-gray-300 p-2"
                                    disabled={!options.trendLine.enabled}
                                >
                                    {TREND_LINES.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Color</label>
                            <input
                                type="color"
                                value={options.barColor}
                                onChange={(e) => setOptions({ ...options, barColor: e.target.value })}
                                className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                            />
                        </div>
                    </div>
                );

            case 'format':
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Precision</label>
                            <select
                                value={format.precision}
                                onChange={(e) => setFormat({ ...format, precision: parseFloat(e.target.value) })}
                                className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                            >
                                {PRECISION_OPTIONS.map(precision => (
                                    <option key={precision} value={precision}>{precision}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Prefix</label>
                            <input
                                type="text"
                                value={format.prefix}
                                onChange={(e) => setFormat({ ...format, prefix: e.target.value })}
                                className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                                placeholder="e.g., $"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Postfix</label>
                            <input
                                type="text"
                                value={format.postfix}
                                onChange={(e) => setFormat({ ...format, postfix: e.target.value })}
                                className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                                placeholder="e.g., %"
                            />
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    if (!chartData.length) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-xl text-gray-600">No data available. Please upload a CSV file.</p>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gray-100">
            <div className="w-80 bg-white shadow-lg">
                <div className="flex border-b">
                    {['fields', 'options', 'format'].map((menu) => (
                        <button
                            key={menu}
                            onClick={() => setActiveMenu(menu)}
                            className={`flex-1 px-4 py-3 text-sm font-medium ${activeMenu === menu
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {menu.charAt(0).toUpperCase() + menu.slice(1)}
                        </button>
                    ))}
                </div>

                <div className="p-4">
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Chart Type</label>
                        <select
                            value={chartType}
                            onChange={(e) => setChartType(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                        >
                            <option value="bar">Bar Chart</option>
                            <option value="line">Line Chart</option>
                            <option value="area">Area Chart</option>
                            <option value="pie">Pie Chart</option>
                            <option value="scatter">Scatter Plot</option>
                            <option value="radar">Radar Chart</option>
                            <option value="treemap">Treemap</option>
                        </select>
                    </div>

                    {renderSidebarContent()}
                </div>
            </div>

            <div className="flex-1 p-8">
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold">
                            {options.title || 'Chart Dashboard'}
                        </h1>
                        <div className="flex items-center justify-center">
                            <button
                                onClick={handleSave}
                                className="bg-blue-500 text-white px-4 py-2 mr-2 rounded hover:bg-blue-600 transition-colors"
                            >
                                Save Chart
                            </button>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleDownload}
                                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                                >
                                    Download Chart
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="h-[600px]">
                        <ResponsiveContainer width="100%" height="100%">
                            {renderChart()}
                        </ResponsiveContainer>
                    </div>
                    {/* Insights Section */}

                </div>



                <div className="mt-8 bg-gray-50 rounded-lg p-6">
                    {/* Header Section */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">📊</span>
                            <h2 className="text-2xl font-bold text-gray-800">Important Insights</h2>
                        </div>

                        <button
                            onClick={handleGenerateInsights}
                            disabled={loading}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium 
                   transform transition-all duration-200 
                   hover:bg-indigo-700 active:scale-95 disabled:opacity-50 
                   disabled:cursor-not-allowed disabled:hover:bg-indigo-600
                   flex items-center gap-2 w-full sm:w-auto justify-center"
                        >
                            <span className="text-lg">💡</span>
                            {loading ? "Analyzing Data..." : "Generate Insights"}
                        </button>
                    </div>

                    {/* Content Section */}
                    {insights ? (
                        <div className="mt-6">
                            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                                <div className="max-h-[400px] overflow-y-auto p-6 
                          [&::-webkit-scrollbar]:w-2
                          [&::-webkit-scrollbar-track]:bg-gray-100
                          [&::-webkit-scrollbar-thumb]:bg-gray-300
                          [&::-webkit-scrollbar-thumb]:rounded-full
                          hover:[&::-webkit-scrollbar-thumb]:bg-gray-400">
                                    <pre className="text-gray-700 text-sm whitespace-pre-wrap 
                           font-mono bg-gray-50 rounded-lg p-4">
                                        {insights}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-6 bg-white rounded-lg border border-gray-200 p-8 text-center">
                            <div className="flex flex-col items-center gap-4">
                                <span className="text-4xl">💡</span>
                                <div>
                                    <p className="text-gray-600">
                                        No insights generated yet. Click the button above to analyze your data.
                                    </p>
                                    <p className="text-gray-400 text-sm mt-2">
                                        The analysis will appear here once generated.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>




            </div>
        </div>
    );
};

export default ChartDashboard;