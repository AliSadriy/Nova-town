import Fastify from 'fastify';
import cors from '@fastify/cors';
const fastify = Fastify({ logger: true });
await fastify.register(cors, {
    origin: true
});
fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString(), service: 'NovaTown Fastify API' };
});
fastify.post('/api/v1/auth/telegram', async (request, reply) => {
    const { initData, userId, username } = request.body || {};
    if (!userId) {
        return reply.status(400).send({ error: 'Missing userId for Telegram authentication' });
    }
    return {
        success: true,
        token: `token_${userId}_${Date.now()}`,
        user: { id: userId, username: username || 'Player' }
    };
});
fastify.get('/api/v1/city/:cityId', async (request, reply) => {
    const { cityId } = request.params;
    return {
        city: {
            id: cityId,
            name: 'Nova Capital',
            gold: 5000,
            population: 200,
            level: 1
        },
        buildings: []
    };
});
fastify.post('/api/v1/city/sync', async (request, reply) => {
    const { cityId, operations } = request.body || {};
    return {
        success: true,
        cityId,
        processedOperations: operations ? operations.length : 0,
        timestamp: new Date().toISOString()
    };
});
const start = async () => {
    try {
        await fastify.listen({ port: 4000, host: '0.0.0.0' });
        console.log('Fastify API server started on port 4000');
    }
    catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};
start();
export default fastify;
