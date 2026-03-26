const http = require('http');
const server = http.createServer((req, res) => {
  res.end('Hello from Azure DevOps Training!');
});
server.listen(3000, () => console.log('Server running on port 3000'));