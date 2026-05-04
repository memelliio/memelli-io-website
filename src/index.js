// Memelli universal shell — minimum viable.
// Boot → listen immediately → run orchestrator in background.
// Healthcheck passes the moment listener is up, regardless of node loading state.

const fastify = require('fastify');
const { Client } = require('pg');

(async () => {
  const SCHEMA = process.env.SCHEMA || 'kernel';
  const PORT = parseInt(process.env.PORT, 10) || 3000;
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) { console.error('[shell] FATAL: DATABASE_URL missing'); process.exit(1); }

  const client = new Client({ connectionString: dbUrl });
  await client.connect();
  console.log('[shell] schema=' + SCHEMA + ' port=' + PORT);

  const app = fastify({ logger: false });
  app.__ready = false;
  app.routeRegistry = new Map();

  const helpers = {
    client,
    schema: SCHEMA,
    async markStatus(name, status, errorText = '') {
      try {
        await client.query(
          'UPDATE ' + SCHEMA + '.nodes SET status=$1, last_loaded_at=now(), error_text=$2, load_count=COALESCE(load_count,0)+1 WHERE name=$3',
          [status, errorText, name]
        );
      } catch (e) { /* swallow */ }
    },
  };

  // Default /__health — always responds, includes orchestrator readiness
  app.get('/__health', async () => ({
    ok: true,
    schema: SCHEMA,
    orchestrator_ready: app.__ready,
    routes_registered: app.routeRegistry.size,
    ts: new Date().toISOString()
  }));

  // Catch-all dispatcher — checks routeRegistry per request
  app.all('/*', async (req, reply) => {
    const key = req.method + ' ' + req.url.split('?')[0];
    const handler = app.routeRegistry.get(key);
    if (!handler) { reply.code(404); return { ok: false, error: 'no_route', key, ready: app.__ready }; }
    return handler(req, reply);
  });

  // Listen FIRST so healthcheck passes
  await app.listen({ host: '0.0.0.0', port: PORT });
  console.log('[shell] listening on ' + PORT + ' — orchestrator starting in background');

  // Orchestrator runs async — failures here don't kill the listener
  (async () => {
    try {
      const r = await client.query(
        'SELECT code_text FROM ' + SCHEMA + '.nodes WHERE name=\'_shell_orchestrator\' AND active=true ORDER BY version DESC LIMIT 1'
      );
      if (r.rowCount === 0) { console.error('[orchestrator] no _shell_orchestrator node — running shell-only'); return; }
      const mod = { exports: {} };
      new Function('module', 'exports', 'require', 'app', 'helpers', r.rows[0].code_text)(mod, mod.exports, require, app, helpers);
      if (typeof mod.exports.register !== 'function') { console.error('[orchestrator] missing register'); return; }
      await mod.exports.register(app, helpers);
      app.__ready = true;
      console.log('[orchestrator] complete · routes=' + app.routeRegistry.size);
    } catch (e) {
      console.error('[orchestrator] crash:', e && e.message);
    }
  })();
})().catch(err => { console.error('[shell] boot crash:', err && err.stack || err); process.exit(1); });
