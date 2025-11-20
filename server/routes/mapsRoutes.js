import express from 'express';

/**
 * Google Maps API Routes
 * Handles Distance Matrix and other Google Maps API calls
 */
function createMapsRoutes() {
    const router = express.Router();

    /**
     * POST /api/maps/calculate-travel-time
     * Calculate travel time between two addresses using Distance Matrix API
     */
    router.post('/calculate-travel-time', async (req, res) => {
        try {
            const { origin, destination } = req.body;

            if (!origin || !destination) {
                return res.status(400).json({ 
                    error: 'Origin and destination are required' 
                });
            }

            // Get server-side API key (must not have referrer restrictions)
            const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;

            if (!apiKey) {
                console.error('Google Maps API key not configured');
                return res.status(500).json({ 
                    error: 'Google Maps API is not configured',
                    hint: 'Set GOOGLE_MAPS_SERVER_API_KEY in .env file'
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

            console.log('Calculating travel time:', { origin, destination });

            const response = await fetch(url.toString());

            if (!response.ok) {
                throw new Error(`Distance Matrix API error: ${response.statusText}`);
            }

            const data = await response.json();

            // Check for API errors
            if (data.status !== 'OK') {
                console.error('Distance Matrix API error:', data.status, data.error_message);
                return res.status(400).json({ 
                    error: `Distance Matrix API error: ${data.status}`,
                    details: data.error_message 
                });
            }

            // Get the first result
            const element = data.rows[0]?.elements[0];

            if (!element || element.status !== 'OK') {
                return res.status(400).json({ 
                    error: 'No route found between origin and destination',
                    status: element?.status || 'UNKNOWN'
                });
            }

            // Use duration_in_traffic if available, otherwise fall back to duration
            const duration = element.duration_in_traffic || element.duration;

            const result = {
                durationMinutes: Math.ceil(duration.value / 60), // Convert seconds to minutes, round up
                durationText: duration.text,
                durationSeconds: duration.value,
                distanceText: element.distance.text,
                distanceMeters: element.distance.value,
                origin: data.origin_addresses[0],
                destination: data.destination_addresses[0]
            };

            console.log('Travel time calculated:', result);

            res.json(result);
        } catch (error) {
            console.error('Error calculating travel time:', error);
            res.status(500).json({ 
                error: 'Failed to calculate travel time',
                message: error.message 
            });
        }
    });

    return router;
}

export default createMapsRoutes;
