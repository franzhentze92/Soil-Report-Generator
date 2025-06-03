declare module 'pdfjs-dist/build/pdf.worker.js' {
  const workerSrc: string;
  export default workerSrc;
}
declare module 'pdfjs-dist/build/pdf.worker.js?worker&url' {
  const workerUrl: string;
  export default workerUrl;
}
declare module 'pdfjs-dist/build/pdf' {
  export * from 'pdfjs-dist';
}
declare module 'pdfjs-dist/build/pdf.worker.min.js?url' {
  const workerUrl: string;
  export default workerUrl;
} 