import type { APIRoute } from 'astro';
import { defineQuery } from 'groq';
import { sanityClient } from '../../lib/sanity/client';

/**
 * Health Check Endpoint
 *
 * Provides service health status for monitoring and deployment verification.
 * Returns 200 OK if all services are healthy, 503 if any service is degraded.
 */

// Simple query to verify Sanity connection
const HEALTH_CHECK_QUERY = defineQuery(`*[_type == "siteSettings"][0]{
  _id,
  _type
}`);

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  environment: string;
  services: {
    sanity: 'connected' | 'disconnected' | 'error';
    cache: 'operational';
  };
  version: string;
  uptime: number;
}

export const GET: APIRoute = async () => {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  const environment = import.meta.env.MODE || 'unknown';

  // Initialize health status
  const health: HealthStatus = {
    status: 'healthy',
    timestamp,
    environment,
    services: {
      sanity: 'connected',
      cache: 'operational',
    },
    version: '1.0.0', // TODO: Read from package.json or env var
    uptime: process.uptime ? process.uptime() : 0,
  };

  try {
    // Test Sanity connection with simple query
    const result = await sanityClient.fetch(HEALTH_CHECK_QUERY, {}, {
      // Short timeout for health checks
      timeout: 5000,
    });

    if (!result) {
      health.services.sanity = 'disconnected';
      health.status = 'degraded';
    }
  } catch (error) {
    console.error('Health check: Sanity connection failed', error);
    health.services.sanity = 'error';
    health.status = 'unhealthy';
  }

  // Determine HTTP status code
  const statusCode = health.status === 'healthy' ? 200 : 503;

  // Calculate response time
  const responseTime = Date.now() - startTime;

  return new Response(
    JSON.stringify({
      ...health,
      responseTime: `${responseTime}ms`,
    }, null, 2),
    {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Response-Time': `${responseTime}ms`,
      },
    }
  );
};
