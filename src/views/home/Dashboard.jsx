import React, { useEffect, useState, useRef } from "react";
import { useAuth } from '../other/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button, Spinner } from "flowbite-react"; // Removed TextInput and Label
import { Stage, Layer, Image as KonvaImage, Transformer, Rect, Group } from 'react-konva';
import { ToastContainer, toast } from 'react-toastify';
import { Crop, ZoomIn, ZoomOut, RotateCcw, Move, Maximize2, Download } from 'lucide-react'; // Added Download icon
import 'react-toastify/dist/ReactToastify.css';

const Dashboard = () => {
    const navigate = useNavigate();
    const [charts, setCharts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { host } = useAuth();
    const [images, setImages] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [cropRect, setCropRect] = useState({ x: 0, y: 0, width: 0, height: 0 });
    const [stageScale, setStageScale] = useState(1);
    const [stageX, setStageX] = useState(0);
    const [stageY, setStageY] = useState(0);
    const trRef = useRef(null);
    const cropTrRef = useRef(null);
    const stageRef = useRef(null);
    const [canvasWidth, setCanvasWidth] = useState(window.innerWidth * 0.8);
    const [canvasHeight, setCanvasHeight] = useState(window.innerHeight * 0.8);
    const [backgroundColor, setBackgroundColor] = useState("#ffffff");
    const [cropMode, setCropMode] = useState({
        active: false,
        imageId: null,
        aspectRatio: null,
        originalImage: null
    });
    const [overlay, setOverlay] = useState({
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
    });
    const imageRef = useRef(null);
    const [zoom, setZoom] = useState(1);
    const [tool, setTool] = useState('move');



    useEffect(() => {
        if (localStorage.getItem('token') == null) {
            navigate('/login');
            toast.warning("Please login first");
        }
    }, []);

    useEffect(() => {
        fetchDashboardCharts();
    }, []);


    useEffect(() => {
        // Regular Transformer for image resize/rotate
        if (selectedId && trRef.current && !cropMode.active) {
            const node = images.find((img) => img.id === selectedId);
            if (node) {
                const konvaNode = stageRef.current.findOne(`#${node.id}`);
                if (konvaNode) {
                    trRef.current.nodes([konvaNode]);
                    trRef.current.getLayer().batchDraw();
                }
            }
        }
        // Crop Transformer
        if (cropMode.active && cropTrRef.current) {
            const cropRectNode = stageRef.current.findOne(`#${cropMode.imageId}-cropRect`);
            if (cropRectNode) {
                cropTrRef.current.nodes([cropRectNode]);
                cropTrRef.current.getLayer().batchDraw();
            }
        }
    }, [selectedId, images, cropMode.active, cropRect]);


    const fetchDashboardCharts = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${host}/api/save/`, {
                method: "GET",
                headers: { Authorization: `Token ${localStorage.getItem('token')}` },
            });
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
            const dashboardCharts = data.filter(chart => chart.is_in_dashboard);
            setCharts(dashboardCharts);

            const loadedImages = await Promise.all(
                dashboardCharts.map(async (chart) => {
                    return new Promise((resolve) => {
                        const img = new window.Image();
                        img.src = chart.chart;
                        img.crossOrigin = "Anonymous";
                        img.onload = () => {
                            resolve({
                                id: `image-${chart.id}`,
                                x: Math.random() * 200,
                                y: Math.random() * 200,
                                width: img.width,
                                height: img.height,
                                rotation: 0,
                                image: img,
                                crop: { x: 0, y: 0, width: img.width, height: img.height },
                                originalWidth: img.width,
                                originalHeight: img.height,
                            });
                        };
                        img.onerror = () => {
                            toast.error(`Failed to load image: ${chart.chart}`);
                            resolve(null);
                        }
                    });
                })
            );
            setImages(loadedImages.filter((img) => img !== null));

        } catch (error) {
            console.error("Error fetching charts:", error);
            toast.error("Error fetching charts");
        } finally {
            setLoading(false);
        }
    };
    const handleStageClick = (e) => {
        const clickedOnEmpty = e.target === e.target.getStage();
        const clickedOnImage = e.target instanceof window.Konva.Image;
        const clickedOnCropRect = e.target instanceof window.Konva.Rect;

        if (clickedOnEmpty) {
            setSelectedId(null);
            if (!clickedOnCropRect) {
                //setCroppingId(null);  // Old cropping ID state
            }
        } else if (clickedOnImage && !cropMode.active) { // Check cropMode.active
            setSelectedId(e.target.id());
        }
    };
    const handleImageClick = (imageId) => {
        if (!cropMode.active) { // Check cropMode.active
            setSelectedId(imageId);
        }
    };

    const handleWheel = (e) => {
        e.evt.preventDefault();
        const scaleBy = 1.1;
        const stage = e.target.getStage();
        const oldScale = stage.scaleX();
        const pointer = stage.getPointerPosition();
        const mousePointTo = {
            x: (pointer.x - stage.x()) / oldScale,
            y: (pointer.y - stage.y()) / oldScale,
        };
        const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
        setStageScale(newScale); // Keep track of stage scaling.
        setStageX(pointer.x - mousePointTo.x * newScale);
        setStageY(pointer.y - mousePointTo.y * newScale);
    };

    const handleDragEnd = (e) => {
        if (cropMode.active) return;  // Prevent dragging in crop mode

        const id = e.target.id();
        setImages(prevImages =>
            prevImages.map(image =>
                image.id === id ? { ...image, x: e.target.x(), y: e.target.y() } : image
            )
        );
    };

    const handleTransformEnd = (e) => {
        if (cropMode.active) return; //Prevent transform in crop mode
        const node = e.target;
        const id = node.id();
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();

        // Reset scale on transform end
        node.scaleX(1);
        node.scaleY(1);

        setImages((prevImages) =>
            prevImages.map((image) => {
                if (image.id === id) {
                    return {
                        ...image,
                        x: node.x(),
                        y: node.y(),
                        rotation: node.rotation(),
                        width: image.width * scaleX,
                        height: image.height * scaleY,
                    };
                }
                return image;
            })
        );
    };

    // Crop rectangle drag
    const handleCropRectDragMove = (e) => {
        if (!cropMode.active) return;

        const newX = e.target.x();
        const newY = e.target.y();

        // Get the current image
        const image = images.find(img => img.id === cropMode.imageId);
        if (!image) return;

        // Constrain the crop rectangle within the image bounds
        const constrainedX = Math.max(image.x, Math.min(newX, image.x + image.width - cropRect.width));
        const constrainedY = Math.max(image.y, Math.min(newY, image.y + image.height - cropRect.height));

        setCropRect({
            ...cropRect,
            x: constrainedX,
            y: constrainedY
        });
        updateOverlay(image, { ...cropRect, x: constrainedX, y: constrainedY }); // Update overlay
    };

    const handleCropRectDragEnd = (e) => {
        if (!cropMode.active) return;

        const image = images.find(img => img.id === cropMode.imageId);
        if (!image) return;
        updateOverlay(image, cropRect);
    };
    const handleCropResize = (e) => {
        if (!cropMode.active) return;
        const node = e.target;

        setCropRect({
            x: node.x(),
            y: node.y(),
            width: node.width() * node.scaleX(),
            height: node.height() * node.scaleY()
        });
        const image = images.find(img => img.id === cropMode.imageId);
        if (!image) return;
        updateOverlay(image, {
            x: node.x(),
            y: node.y(),
            width: node.width() * node.scaleX(),
            height: node.height() * node.scaleY()
        });
    };

    const handleDownload = () => {
        // Use a high, fixed pixelRatio for maximum quality (e.g., 3)
        const pixelRatio = 3;

        stageRef.current.toImage({
            x: 0,
            y: 0,
            width: canvasWidth,
            height: canvasHeight,
            pixelRatio: pixelRatio, // High pixel ratio
            callback: (img) => {
                // Create a temporary canvas to draw with the background
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = canvasWidth * pixelRatio;  // Scale canvas by pixelRatio
                tempCanvas.height = canvasHeight * pixelRatio; // Scale canvas by pixelRatio
                const tempContext = tempCanvas.getContext('2d');

                // Scale the context to match the pixelRatio
                tempContext.scale(pixelRatio, pixelRatio);

                // Fill with background color *before* drawing the image
                tempContext.fillStyle = backgroundColor;
                tempContext.fillRect(0, 0, canvasWidth, canvasHeight); // Use original dimensions

                // Draw the image onto the temporary canvas (already scaled)
                tempContext.drawImage(img, 0, 0, canvasWidth, canvasHeight); // Use original dimensions

                // Get the data URL from the temporary canvas
                const dataURL = tempCanvas.toDataURL('image/png');

                // Download
                const link = document.createElement('a');
                link.download = 'chart.png';
                link.href = dataURL;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        });
    };

    const handleCanvasWidthChange = (e) => {
        setCanvasWidth(parseInt(e.target.value, 10) || 0);
    };

    const handleCanvasHeightChange = (e) => {
        setCanvasHeight(parseInt(e.target.value, 10) || 0);
    };

    const handleBackgroundColorChange = (e) => {
        setBackgroundColor(e.target.value);
    };


    // --- Cropping Logic ---

    const startCropping = (imageId) => {
        const image = images.find(img => img.id === imageId);
        if (!image) return;

        // Store original image data
        setCropMode({
            active: true,
            imageId,
            aspectRatio: null, // Start with freeform crop
            originalImage: { ...image }  // Crucial: store original dimensions
        });

        // Initialize crop area to 80% of image
        const width = image.width * 0.8;
        const height = image.height * 0.8;
        const x = image.x + (image.width - width) / 2;
        const y = image.y + (image.height - height) / 2;

        setCropRect({ x, y, width, height });
        setTool('crop');  // Switch to crop tool
        updateOverlay(image, { x, y, width, height });

    };
    const updateOverlay = (image, rect) => {
        setOverlay({
            top: rect.y - image.y,
            right: (image.x + image.width) - (rect.x + rect.width),
            bottom: (image.y + image.height) - (rect.y + rect.height),
            left: rect.x - image.x
        });
    };


    const handleCropComplete = () => {
        if (!cropMode.active) return;

        const image = images.find(img => img.id === cropMode.imageId);
        if (!image) return;

        // Calculate crop coordinates relative to *original* image
        const scaleX = image.width / image.originalWidth;
        const scaleY = image.height / image.originalHeight;

        const relativeCrop = {
            x: (cropRect.x - image.x) / scaleX,
            y: (cropRect.y - image.y) / scaleY,
            width: cropRect.width / scaleX,
            height: cropRect.height / scaleY
        };


        // Apply crop
        setImages(prevImages =>
            prevImages.map(img => {
                if (img.id === cropMode.imageId) {
                    return {
                        ...img,
                        crop: relativeCrop,       // Store relative crop
                        width: cropRect.width,  // Displayed width/height
                        height: cropRect.height,
                        x: cropRect.x, //set image x and y to cropRect x,y
                        y: cropRect.y
                    };
                }
                return img;
            })
        );

        // Reset crop mode
        exitCropMode();
    };

    const exitCropMode = () => {
        setCropMode({
            active: false,
            imageId: null,
            aspectRatio: null,
            originalImage: null
        });
        setCropRect({ x: 0, y: 0, width: 0, height: 0 });
        setTool('move'); // Switch back to move tool
        setOverlay({ top: 0, right: 0, bottom: 0, left: 0 });  // Reset overlay

        // Clear transformers
        if (cropTrRef.current) {
            cropTrRef.current.nodes([]);
            cropTrRef.current.getLayer().batchDraw();
        }
        if (trRef.current) {
            trRef.current.nodes([]);
            trRef.current.getLayer().batchDraw();
        }
    };

    const handleZoom = (direction) => {
        const newZoom = direction === 'in' ? zoom * 1.1 : zoom / 1.1;
        setZoom(Math.min(Math.max(0.1, newZoom), 3)); // Limit zoom
    };

    const handleToolChange = (newTool) => {
        setTool(newTool);
        if (newTool === 'crop' && selectedId) {
            startCropping(selectedId);
        }
    };
    // --- UI Component for Toolbar Buttons ---
    const ToolbarButton = ({ icon: Icon, active, onClick, tooltip }) => (
        <button
            className={`p-2 rounded-lg transition-all ${active
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            onClick={onClick}
            title={tooltip} // Add tooltip for accessibility
        >
            <Icon size={20} />
        </button>
    );

    // --- Loading and Empty States ---
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Spinner size="xl" />
            </div>
        );
    }

    if (charts.length === 0) {
        return (
            <div className="max-w-6xl mx-auto p-6 text-center">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Dashboard</h2>
                <p className="text-gray-500">No charts added to the dashboard yet.</p><Button
                    onClick={() => navigate('/saved-charts')}
                    className="mt-4 bg-blue-600"
                >
                    Add Charts to Dashboard
                </Button>
                <ToastContainer position="bottom-right" />
            </div>
        );
    }

    return (
        <div className="bg-gray-100 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="py-6">
                    <h2 className="text-3xl font-bold text-gray-800 mb-4">Dashboard</h2>

                    {/* Top Toolbar */}

                    <div className="bg-gray-100 p-4 rounded-b-lg shadow-md border-t border-gray-200 flex items-center justify-between">
                        <div className="flex items-center space-x-8">

                            {/* Width Input Group */}
                            <div className="flex flex-col">
                                <label htmlFor="canvasWidth" className="block text-sm font-medium text-gray-700">
                                    Width
                                </label>
                                <div className="relative mt-1">
                                    <input
                                        type="number"
                                        id="canvasWidth"
                                        value={canvasWidth}
                                        onChange={handleCanvasWidthChange}
                                        min="100"
                                        className="block w-32 pl-3 pr-10 py-2 text-base border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        placeholder="Enter width"
                                    />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <span className="text-gray-500 sm:text-sm">px</span>
                                    </div>
                                </div>
                            </div>

                            {/* Height Input Group */}
                            <div className="flex flex-col">
                                <label htmlFor="canvasHeight" className="block text-sm font-medium text-gray-700">
                                    Height
                                </label>
                                <div className="relative mt-1">
                                    <input
                                        type="number"
                                        id="canvasHeight"
                                        value={canvasHeight}
                                        onChange={handleCanvasHeightChange}
                                        min="100"
                                        className="block w-32 pl-3 pr-10 py-2 text-base border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        placeholder="Enter height"
                                    />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <span className="text-gray-500 sm:text-sm">px</span>
                                    </div>
                                </div>
                            </div>

                            {/* Background Color Input Group */}
                            <div className="flex flex-col">
                                <label htmlFor="backgroundColor" className="block text-sm font-medium text-gray-700">
                                    Background
                                </label>
                                <div className="mt-1">
                                    <input
                                        type="color"
                                        id="backgroundColor"
                                        value={backgroundColor}
                                        onChange={handleBackgroundColorChange}
                                        className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer appearance-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Download Button with Icon and Text */}
                        <button
                            onClick={handleDownload}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-150 ease-in-out"
                        >
                            {/* Assuming Download is an SVG icon component */}
                            <Download className="h-5 w-5 mr-2" /> {/* Adjust size as needed */}
                            <span>Download Chart</span>
                        </button>
                    </div>

                    {/* Stage (Canvas) */}
                    <div className="bg-white rounded-b-lg shadow-md overflow-hidden">
                        <Stage
                            width={canvasWidth}
                            height={canvasHeight}
                            onClick={handleStageClick}
                            onWheel={handleWheel}
                            scaleX={stageScale * zoom}
                            scaleY={stageScale * zoom}
                            x={stageX}
                            y={stageY}
                            ref={stageRef}
                            style={{ backgroundColor: backgroundColor, border: '1px solid #ddd' }}
                        >
                            <Layer>
                                {/* Background */}
                                <Rect
                                    x={0}
                                    y={0}
                                    width={canvasWidth}
                                    height={canvasHeight}
                                    fill={backgroundColor}
                                />

                                {/* Images */}
                                {images.map((img) => (
                                    <KonvaImage
                                        key={img.id}
                                        image={img.image}
                                        x={img.x}
                                        y={img.y}
                                        width={img.width}
                                        height={img.height}
                                        id={img.id}
                                        rotation={img.rotation}
                                        draggable={!cropMode.active || img.id !== cropMode.imageId}
                                        onDragEnd={handleDragEnd}
                                        onTransformEnd={handleTransformEnd}
                                        crop={img.crop}
                                        onClick={() => handleImageClick(img.id)}
                                        onTap={() => handleImageClick(img.id)}
                                        ref={img.id === cropMode.imageId ? imageRef : null}
                                    />
                                ))}

                                {/* Crop Overlay and Rectangle */}
                                {cropMode.active && (
                                    <Group>
                                        {/* Dark overlay, now using calculated values */}
                                        <Rect
                                            x={cropMode.originalImage.x}
                                            y={cropMode.originalImage.y}
                                            width={cropMode.originalImage.width}
                                            height={cropMode.originalImage.height}
                                            fill="rgba(0,0,0,0.5)"
                                        />
                                        {/* Cutout rectangle - creates the "transparent" effect */}
                                        <Rect
                                            x={cropRect.x}
                                            y={cropRect.y}
                                            width={cropRect.width}
                                            height={cropRect.height}
                                            fill="rgba(0,0,0,0)" // Fully transparent
                                        />


                                        {/* Crop Rectangle */}
                                        <Rect
                                            {...cropRect}
                                            stroke="#fff"
                                            strokeWidth={2}
                                            dash={[5, 5]}
                                            fill="transparent"
                                            draggable
                                            onDragMove={handleCropRectDragMove}
                                            onDragEnd={handleCropRectDragEnd}
                                            onTransform={handleCropResize}
                                            id={`${cropMode.imageId}-cropRect`}
                                        />


                                        {/* Grid lines */}
                                        {Array(2).fill(0).map((_, i) => (
                                            <React.Fragment key={i}>
                                                <Rect
                                                    x={cropRect.x + (cropRect.width * (i + 1)) / 3}
                                                    y={cropRect.y}
                                                    width={1}
                                                    height={cropRect.height}
                                                    fill="#fff"
                                                    opacity={0.5}
                                                />
                                                <Rect
                                                    x={cropRect.x}
                                                    y={cropRect.y + (cropRect.height * (i + 1)) / 3}
                                                    width={cropRect.width}
                                                    height={1}
                                                    fill="#fff"
                                                    opacity={0.5}
                                                />
                                            </React.Fragment>
                                        ))}
                                    </Group>
                                )}

                                {/* Regular Transformer */}
                                {selectedId && !cropMode.active && (
                                    <Transformer
                                        ref={trRef}
                                        rotateEnabled={true}
                                        keepRatio={false}
                                    />
                                )}

                                {/* Crop Transformer */}
                                {cropMode.active && (
                                    <Transformer
                                        ref={cropTrRef}
                                        rotateEnabled={false}
                                        keepRatio={cropMode.aspectRatio !== null}
                                        boundBoxFunc={(oldBox, newBox) => {
                                            const image = images.find(img => img.id === cropMode.imageId);
                                            if (!image) return oldBox;

                                            // Maintain aspect ratio if set
                                            if (cropMode.aspectRatio !== null) {
                                                newBox.height = newBox.width / cropMode.aspectRatio;
                                            }

                                            // Keep within image bounds
                                            return {
                                                x: Math.max(image.x, Math.min(newBox.x, image.x + image.width - newBox.width)),
                                                y: Math.max(image.y, Math.min(newBox.y, image.y + image.height - newBox.height)),
                                                width: Math.min(newBox.width, image.x + image.width - newBox.x),
                                                height: Math.min(newBox.height, image.y + image.height - newBox.y)
                                            };
                                        }}
                                    />
                                )}
                            </Layer>
                        </Stage>
                    </div>

                    {/* Bottom Toolbar (Canvas Settings) */}

                </div>
            </div>
            <ToastContainer position="bottom-right" />
        </div>
    );
};

export default Dashboard;