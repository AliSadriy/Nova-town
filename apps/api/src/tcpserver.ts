import * as net from 'net';

const server = net.createServer((socket) => {
  socket.on('data', (data) => {
    const requestStr = data.toString();
    const headers = 'HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\nConnection: close\r\n\r\n';
    const body = JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() });
    socket.write(headers + body);
    socket.end();
  });
});

server.listen(4000, '0.0.0.0', () => {
  console.log('TCP Server listening on port 4000');
});
