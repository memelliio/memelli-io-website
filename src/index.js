// Memelli universal shell — minimum viable.
// Reads SCHEMA env, connects to DB, loads _shell_orchestrator from <SCHEMA>.nodes, runs it.
// Everything else (routes, health, refresh, in, out) lives in DB nodes the orchestrator loads.

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
  const helpers = { client, schema: SCHEMA };

  // Load orchestrator from DB
  const r = await client.query(
    'SELECT code_text FROM ' + SCHEMA + '.nodes WHERE name=\'_shell_orchestrator\' AND active=true ORDER BY version DESC LIMIT 1'
  );
  if (r.rowCount === 0) { console.error('[shell] FATAL: no _shell_orchestrator in ' + SCHEMA + '.nodes'); process.exit(1); }
  const mod = { exports: {} };
  new Function('module', 'exports', 'require', 'app', 'helpers', r.rows[0].code_text)(mod, mod.exports, require, app, helpers);
  if (typeof mod.exports.register !== 'function') { console.error('[shell] FATAL: orchestrator missing register'); process.exit(1); }
  await mod.exports.register(app, helpers);

  // Wire app.routeRegistry → Fastify routes (universal pattern)
  if (app.routeRegistry) {
    for (const [key, handler] of app.routeRegistry.entries()) {
      const [method, path] = key.split(' ');
      try { app.route({ method, url: path, handler }); }
      catch (e) { console.error('[shell] route ' + key + ' failed: ' + e.message); }
    }
  }

  await app.listen({ host: '0.0.0.0', port: PORT });
  console.log('[shell] booted, listening on ' + PORT);
})().catch(err => { console.error('[shell] crash:', err && err.stack || err); process.exit(1); });
