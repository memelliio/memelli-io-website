import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { pool } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  // 1. Session cookie
  const sessionCookie = cookies().get('memelli_session')?.value;
  if (!sessionCookie) {
    return NextResponse.json(
      { ok: false, error: 'unauthenticated' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  // 2. Lookup user
  const userResult = await pool.query(
    `
    SELECT u.id, u.access_grants
    FROM auth.sessions s
    JOIN auth.users u ON s.user_id = u.id
    WHERE s.token = $1
      AND s.revoked_at IS NULL
      AND s.expires_at > now()
    `,
    [sessionCookie]
  );

  if (userResult.rowCount === 0) {
    return NextResponse.json(
      { ok: false, error: 'unauthenticated' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const user = userResult.rows[0];
  const grants: Array<{ role?: string; app_id?: string }> = user.access_grants || [];

  // 3. Admin check
  const isAdmin = grants.some(
    (g) => g.role === 'admin' || g.app_id === '*'
  );

  if (!isAdmin) {
    return NextResponse.json(
      { ok: false, error: 'admin_only' },
      { status: 403, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  // 4. Railway token
  const railwayToken = process.env.RAILWAY_TOKEN;
  if (!railwayToken) {
    return NextResponse.json(
      { ok: true, services: [], error: 'railway_unreachable' },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }

  // 5. GraphQL request
  const query = `
    query Me {
      me {
        workspaces {
          team {
            projects {
              edges {
                node {
                  id
                  name
                  services {
                    edges {
                      node {
                        id
                        name
                        source {
                          repo
                        }
                        serviceInstances {
                          edges {
                            node {
                              domains {
                                customDomains {
                                  domain
                                }
                                serviceDomains {
                                  domain
                                }
                              }
                            }
                          }
                        }
                        deployments(first: 1) {
                          edges {
                            node {
                              id
                              status
                              meta
                              createdAt
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  let data: any;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const resp = await fetch('https://backboard.railway.com/graphql/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${railwayToken}`,
      },
      body: JSON.stringify({ query }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!resp.ok) {
      throw new Error('Network response not ok');
    }

    const json = await resp.json();
    data = json.data;
  } catch (e) {
    return NextResponse.json(
      { ok: true, services: [], error: 'railway_unreachable' },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }

  // 6. Flatten response
  const services: Array<{
    projectId: string;
    projectName: string;
    serviceId: string;
    serviceName: string;
    sourceRepo: string | null;
    lastDeploymentId: string | null;
    lastDeployStatus: string | null;
    lastCommit: string | null;
    lastDeployedAt: string | null;
    customDomain: string | null;
    productionDomain: string | null;
  }> = [];

  const workspaces = data?.me?.workspaces ?? [];

  for (const ws of workspaces) {
    const projects = ws?.team?.projects?.edges ?? [];
    for (const projEdge of projects) {
      const projNode = projEdge?.node;
      if (!projNode) continue;
      const projectId = projNode.id;
      const projectName = projNode.name;

      const serviceEdges = projNode.services?.edges ?? [];
      for (const svcEdge of serviceEdges) {
        const svcNode = svcEdge?.node;
        if (!svcNode) continue;

        const serviceId = svcNode.id;
        const serviceName = svcNode.name;
        const sourceRepo = svcNode.source?.repo ?? null;

        // Domains (take first if multiple)
        const instanceNode = svcNode.serviceInstances?.edges?.[0]?.node;
        const customDomain =
          instanceNode?.domains?.customDomains?.[0]?.domain ?? null;
        const productionDomain =
          instanceNode?.domains?.serviceDomains?.[0]?.domain ?? null;

        // Deployment
        const deploymentNode = svcNode.deployments?.edges?.[0]?.node;
        const lastDeploymentId = deploymentNode?.id ?? null;
        const lastDeployStatus = deploymentNode?.status ?? null;
        const meta = deploymentNode?.meta ?? {};
        const lastCommit = meta?.commit ?? null;
        const lastDeployedAt = deploymentNode?.createdAt ?? null;

        services.push({
          projectId,
          projectName,
          serviceId,
          serviceName,
          sourceRepo,
          lastDeploymentId,
          lastDeployStatus,
          lastCommit,
          lastDeployedAt,
          customDomain,
          productionDomain,
        });
      }
    }
  }

  // 7. Return response
  return NextResponse.json(
    { ok: true, services, count: services.length },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}