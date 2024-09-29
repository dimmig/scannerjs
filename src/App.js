import React, { useState } from 'react';
import Dropzone from 'react-dropzone';
import jsPDF from 'jspdf';
import bgImage from "./assets/scanned-bg.png"
import * as pdfjsLib from 'pdfjs-dist/webpack'; // Correct import for Webpack builds

function App() {
    const [uploadedImage, setUploadedImage] = useState(null);
    const [processedImage, setProcessedImage] = useState(null);
    const [isA4Format, setIsA4Format] = useState(false);
    const [isBlackAndWhite, setIsBlackAndWhite] = useState(false);

    const onDrop = (acceptedFiles) => {
        const file = acceptedFiles[0];

        if (file.type === 'application/pdf') {
            processPDF(file);
        } else {
            processImageFile(file);
        }
    };

    const processPDF = (file) => {
        const reader = new FileReader();

        reader.onloadend = async () => {
            const typedArray = new Uint8Array(reader.result);
            const pdf = await pdfjsLib.getDocument(typedArray).promise;
            const page = await pdf.getPage(1);

            const viewport = page.getViewport({ scale: 1.3 });
            const canvas = document.createElement('canvas');
            const padding = 10;
            const shadowOffset = 10;

            canvas.width = viewport.width;
            canvas.height = viewport.height;
            canvas.width += 2 * padding;
            canvas.height += 2 * padding + shadowOffset;

            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#e0e0e0';
            ctx.fillRect(padding + shadowOffset, padding + shadowOffset, viewport.width/2, viewport.height/2);

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(padding, padding, viewport.width/2, viewport.height/2);

            await page.render({
                canvasContext: ctx,
                viewport: viewport
            }).promise;

            applyImageProcessing(canvas, ctx);

            setProcessedImage(canvas.toDataURL());
        };

        reader.readAsArrayBuffer(file);
    };

    const processImageFile = (file) => {
        const reader = new FileReader();

        reader.onloadend = () => {
            setUploadedImage(reader.result);
            processImage(reader.result);
        };

        reader.readAsDataURL(file);
    };

    const processImage = (imageData) => {
        const img = new Image();
        img.src = imageData;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            const a4Width = 595;
            const a4Height = 842;

            if (isA4Format) {
                canvas.width = a4Width;
                canvas.height = a4Height;
            } else {
                canvas.width = img.width;
                canvas.height = img.height;
            }

            ctx.drawImage(img, 0, 0, img.width, img.height);

            if (isBlackAndWhite) {
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                for (let i = 0; i < data.length; i += 4) {
                    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
                    data[i] = gray;
                    data[i + 1] = gray;
                    data[i + 2] = gray;
                }
                ctx.putImageData(imageData, 0, 0);
            }

            setProcessedImage(canvas.toDataURL());
        };
    };

    const applyImageProcessing = (canvas, ctx) => {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        if (isBlackAndWhite) {
            const data = imgData.data;
            for (let i = 0; i < data.length; i += 4) {
                const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
                data[i] = gray;
                data[i + 1] = gray;
                data[i + 2] = gray;
            }
            ctx.putImageData(imgData, 0, 0);
        }

    };

    const downloadPDF = () => {
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'px',
            format: [595, 842],
        });

        const img = new Image();
        const background = new Image();
        background.src = bgImage;

        img.src = processedImage;
        img.onload = () => {
            const imgWidth = 595 / 1.2;
            const imgHeight = (img.height * imgWidth) / img.width;

            pdf.addImage(background, 'PNG', 0, 0, 595, 842);

            const xMargin = 30;
            const yTransform = 40;

            const shadowXOffset = xMargin + 1.1;
            const shadowYOffset = yTransform + 1.1;
            pdf.setFillColor(50, 50, 50);
            pdf.setDrawColor(50, 50, 50);
            pdf.setGState(pdf.GState({ opacity: 0.1 }));

            pdf.rect(shadowXOffset, shadowYOffset, imgWidth, imgHeight, 'F');

            pdf.setGState(pdf.GState({ opacity: 1 }));

            pdf.addImage(img, 'PNG', xMargin, yTransform, imgWidth, imgHeight, "", null, -0.5);

            pdf.save('scanned-document.pdf');
        };

    };

    return (
        <div style={{ textAlign: 'center', padding: '50px' }}>
            <h1>Document Scanner</h1>
            <Dropzone onDrop={onDrop} accept="image/*,application/pdf" multiple={false}>
                {({ getRootProps, getInputProps }) => (
                    <div
                        {...getRootProps()}
                        style={{
                            border: '2px dashed #007bff',
                            padding: '20px',
                            cursor: 'pointer',
                            marginBottom: '20px',
                        }}
                    >
                        <input {...getInputProps()} />
                        <p>Upload PDF, JPG, PNG or DOC</p>
                    </div>
                )}
            </Dropzone>

            <div style={{ marginBottom: '20px' }}>
                <label>
                    <input
                        type="checkbox"
                        checked={isA4Format}
                        onChange={(e) => setIsA4Format(e.target.checked)}
                    />
                    {' '}A4 format
                </label>
                <label style={{ marginLeft: '20px' }}>
                    <input
                        type="checkbox"
                        checked={isBlackAndWhite}
                        onChange={(e) => setIsBlackAndWhite(e.target.checked)}
                    />
                    {' '}Make black and white
                </label>
            </div>

            <button
                onClick={() => processImage(uploadedImage)}
                disabled={!uploadedImage}
                style={{
                    padding: '10px 20px',
                    fontSize: '16px',
                    cursor: 'pointer',
                    backgroundColor: '#007bff',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '5px'
                }}
            >
                Produce
            </button>

            {uploadedImage && (
                <div>
                    <h2>Uploaded Image</h2>
                    <img src={uploadedImage} alt="Uploaded" style={{ maxWidth: '500px', marginBottom: '20px' }} />
                </div>
            )}

            {processedImage && (
                <div style={{ textAlign: 'center' }}>
                    <h2>Processed Image</h2>
                    <img src={processedImage} alt="Processed"   style={{
                        boxShadow: '5px 5px 15px rgba(0,0,0,0.3)',
                        borderRadius: '8px'
                    }} />
                    <br />
                    <button onClick={downloadPDF} style={{ marginTop: "5%", padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}>
                        Download as PDF
                    </button>
                </div>
            )}
        </div>
    );
}

export default App;
