export function getRequestLogInput(req, res) {
    const timestamp = new Date().toLocaleDateString();
    return `[${timestamp}] ${req.method} ${req.originalUrl}`;
  }
  
  export function getResponseLogInput(req, res) {
    const timestamp = new Date().toLocaleDateString();
    return `[${timestamp}] ${req.method} ${req.originalUrl} - Status: ${res.statusCode}`;
  }
  