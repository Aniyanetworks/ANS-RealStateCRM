// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import React, { useState } from "react";
import { Document, Page } from "react-pdf";

const PdfViewer = ({ file }) => {
  const [numPages, setNumPages] = useState(null); // State to hold the number of pages
  const [pageNumber, setPageNumber] = useState(1); // State to hold the current page number

  // Function to handle successful document load
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages); // Set the number of pages
  };

  return (
    <div>
      <Document
        file={file} // The PDF file to be displayed
        onLoadSuccess={onDocumentLoadSuccess} // Callback when the document is loaded
      >
        <Page pageNumber={pageNumber} /> {/* Render the current page */}
      </Document>

      {/* Navigation controls */}
      <div>
        <p>
          Page {pageNumber} of {numPages}
        </p>
        <button
          disabled={pageNumber <= 1}
          onClick={() => setPageNumber(pageNumber - 1)}
        >
          Previous
        </button>
        <button
          disabled={pageNumber >= numPages}
          onClick={() => setPageNumber(pageNumber + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default PdfViewer;
