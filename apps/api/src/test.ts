import Fastify from 'fastify';
import http from 'http';

const fastify = Fastify({ logger: false });

fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

const start = async () => {
  await fastify.listen({ port: 4001, host: '127.0.0.1' });
  console.log('Fastify listening on 4001');

  http.get('http://127.0.0.1:4001/health', (res) => {
    let data = '';
    res.on('data', (c) => data += c);
    res.on('end', () => {
      console.log('Self-test response:', res.statusCode, data);
      fastify.close();
    });
  });
};

start();
