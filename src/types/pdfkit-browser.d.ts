declare module 'pdfkit/js/pdfkit.standalone.js' {
  import PDFDocument from 'pdfkit';
  export default PDFDocument;
}

declare module 'wawoff2/build/decompress_binding.js' {
  const Module: {
    calledRun?: boolean;
    onRuntimeInitialized?: () => void;
    decompress: (data: Uint8Array) => Uint8Array | false;
  };
  export default Module;
}

