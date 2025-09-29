import * as pdfjsLib from 'pdfjs-dist'

// Configure the worker source
// The worker file is copied from node_modules/pdfjs-dist/build/pdf.worker.min.mjs to public/pdf.worker.min.js
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'

// Export the configured document loader
export const getPdfDocument = pdfjsLib.getDocument

// Export the library in case we need other utilities
export const pdfjs = pdfjsLib