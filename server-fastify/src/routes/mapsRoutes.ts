import type { FastifyPluginAsync } from 'fastify';
import { env } from '../config/env.js';
import {
  calculateTravelTimeSchema,
  type DistanceMatrixResponse,
  type TravelTimeResult,
  travelTimeResultSchema,
} from '../schemas/maps.schemas.js';

/**
 * Google Maps API Routes Plugin
 * Handles Distance Matrix and other Google Maps API calls
 *
 * Endpoints:
 * - POST /api/maps/calculate-travel-time - Calculate travel time between addresses
 */

const mapsRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /api/maps/calculate-travel-time
   * Calculate travel time between two addresses using Distance Matrix API
   */
  fastify.post<{
    Body: {
      origin: string;
      destination: string;
    };
  }>(
    '/calculate-travel-time',
    {
      schema: {
        body: calculateTravelTimeSchema,
        response: {
          200: travelTimeResultSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const { origin, destination } = request.body;

        // Get server-side API key (must not have referrer restrictions)
        const apiKey = env.GOOGLE_MAPS_SERVER_API_KEY || env.VITE_GOOGLE_MAPS_API_KEY;

        if (!apiKey) {
          fastify.log.error('Google Maps API key not configured');
          return reply.status(500).send({
            error: 'Google Maps API is not configured',
            hint: 'Set GOOGLE_MAPS_SERVER_API_KEY in .env file',
          });
        }

        // Build API URL
        const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json');
        url.searchParams.append('origins', origin);
        url.searchParams.append('destinations', destination);
        url.searchParams.append('mode', 'driving');
        url.searchParams.append('departure_time', 'now');
        url.searchParams.append('traffic_model', 'best_guess');
        url.searchParams.append('key', apiKey);

        fastify.log.info({ origin, destination }, 'Calculating travel time');

        const response = await fetch(url.toString());

        if (!response.ok) {
          throw new Error(`Distance Matrix API error: ${response.statusText}`);
        }

        const data = (await response.json()) as DistanceMatrixResponse;

        // Check for API errors
        if (data.status !== 'OK') {
          fastify.log.error(
            { status: data.status, errorMessage: data.error_message },
            'Distance Matrix API error'
          );
          return reply.status(400).send({
            error: `Distance Matrix API error: ${data.status}`,
            details: data.error_message,
          });
        }

        // Get the first result
        const element = data.rows[0]?.elements[0];

        if (!element || element.status !== 'OK') {
          return reply.status(400).send({
            error: 'No route found between origin and destination',
            status: element?.status || 'UNKNOWN',
          });
        }

        // Use duration_in_traffic if available, otherwise fall back to duration
        const duration = element.duration_in_traffic || element.duration;

        if (!duration) {
          return reply.status(400).send({
            error: 'Duration data not available',
          });
        }

        const result: TravelTimeResult = {
          durationMinutes: Math.ceil(duration.value / 60), // Convert seconds to minutes, round up
          durationText: duration.text,
          durationSeconds: duration.value,
          distanceText: element.distance.text,
          distanceMeters: element.distance.value,
          origin: data.origin_addresses[0] || origin,
          destination: data.destination_addresses[0] || destination,
        };

        fastify.log.info({ result }, 'Travel time calculated');

        return result;
      } catch (error) {
        fastify.log.error(error, 'Error calculating travel time');
        return reply.status(500).send({
          error: 'Failed to calculate travel time',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );
};

export default mapsRoutes;
