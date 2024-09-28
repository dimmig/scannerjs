import React, { useState } from 'react';
import Dropzone from 'react-dropzone';
import jsPDF from 'jspdf';

function App() {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [isA4Format, setIsA4Format] = useState(false);
  const [isBlackAndWhite, setIsBlackAndWhite] = useState(false);

  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles[0];
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

      if (isA4Format) {
        const a4Width = 595;
        const a4Height = 842;
        canvas.width = a4Width;
        canvas.height = a4Height;
      } else {
        canvas.width = img.width;
        canvas.height = img.height;
      }

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

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

  const downloadPDF = () => {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [595, 842]
    });

    const img = new Image();
    img.src = processedImage;
    img.onload = () => {
      const imgWidth = 595;
      const imgHeight = (img.height * imgWidth) / img.width;

      pdf.addImage(img, 'PNG', 0, 0, imgWidth, imgHeight);
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
            <div>
              <h2>Processed Image</h2>
              <img src={processedImage} alt="Processed" style={{ maxWidth: '500px', marginBottom: '20px' }} />
              <br />
              <button onClick={downloadPDF} style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}>
                Download as PDF
              </button>
            </div>
        )}
      </div>
  );
}

export default App;
