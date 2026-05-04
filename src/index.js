// Memelli universal shell — minimum viable.
// Orchestrator-first: load all _node_* nodes (which add Fastify hooks/routes), THEN listen.
// Safe because _node_loader filters by kind='code' (only ~143 nodes per shell, ~5s).

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

  // Run orchestrator BEFORE listening so it can decorate, addHook, addRoute
  try {
    const r = await client.query(
      'SELECT code_text FROM ' + SCHEMA + '.nodes WHERE name=\'_shell_orchestrator\' AND active=true ORDER BY version DESC LIMIT 1'
    );
    if (r.rowCount === 0) {
      console.error('[orchestrator] no _shell_orchestrator node — running shell-only');
    } else {
      const mod = { exports: {} };
      new Function('module', 'exports', 'require', 'app', 'helpers', r.rows[0].code_text)(mod, mod.exports, require, app, helpers);
      if (typeof mod.exports.register === 'function') {
        await mod.exports.register(app, helpers);
        console.log('[orchestrator] complete · routeRegistry=' + app.routeRegistry.size);
      } else {
        console.error('[orchestrator] missing register');
      }
    }
  } catch (e) {
    console.error('[orchestrator] crash:', e && e.message);
  }

  // Default /__health AFTER orchestrator (orchestrator may have already added one — Fastify will throw if dup, so check first)
  if (!app.hasRoute || !app.hasRoute({ method: 'GET', url: '/__health' })) {
    try { app.get('/__health', async () => ({ ok: true, schema: SCHEMA, routes_registered: app.routeRegistry.size, ts: new Date().toISOString() })); }
    catch (e) { /* already registered */ }
  }

  // Catch-all dispatcher — consults routeRegistry per request (so DB-resident routes work)
  try {
    app.all('/*', async (req, reply) => {
      const key = req.method + ' ' + req.url.split('?')[0];
      const handler = app.routeRegistry.get(key);
      if (!handler) { reply.code(404); return { ok: false, error: 'no_route', key }; }
      return handler(req, reply);
    });
  } catch (e) { /* if orchestrator added a catch-all, skip */ }

  // Listen ONLY if no DB node already started the server (avoid double-listen crash)
  if (!app.server || !app.server.listening) {
    try {
      await app.listen({ host: '0.0.0.0', port: PORT });
      console.log('[shell] shell-default listen on ' + PORT);
    } catch (e) {
      if (/already listening/i.test(e.message)) console.log('[shell] DB node already listening — using its server');
      else throw e;
    }
  } else {
    console.log('[shell] DB node already listening — using its server');
  }
})().catch(err => { console.error('[shell] boot crash:', err && err.stack || err); process.exit(1); });
