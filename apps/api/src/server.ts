import * as http from 'http';

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
});

server.listen(4000, '127.0.0.1', () => {
  console.log('API listening on 127.0.0.1:4000');
});
