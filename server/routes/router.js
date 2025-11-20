import dotenv from 'dotenv';
import express from 'express';
import notificationService from '../services/notificationService.js';

// Import route modules
import createRideRequestRoutes from './rideRequestRoutes.js';
import createUserRoutes from './userRoutes.js';
import { createProviderRoutes, createServiceProviderRoutes } from './providerRoutes.js';
import createVehicleRoutes from './vehicleRoutes.js';
import createNotificationRoutes from './notificationRoutes.js';
import createAuthRoutes from './authRoutes.js';

dotenv.config({ path: '../.env' });

/**
 * Main Router Factory
 * Creates and configures all API routes
 *
 * Routes are organized by resource:
 * - /riderequests - Ride request CRUD and business logic
 * - /users - Service users (riders, caregivers)
 * - /providers - Service providers (drivers)
 * - /service-providers - Service provider management with permissions
 * - /vehicles - Fleet vehicles
 * - /notifications - SMS notifications, webhooks, delivery tracking
 * - /auth - Authentication and system user management
 */
function createRouter(api) {
    const router = express.Router();

    // Initialize notification service with database API
    notificationService.setApi(api);
    console.log('✅ Notification service initialized with database API');

    // Mount route modules
    router.use('/riderequests', createRideRequestRoutes(api));
    router.use('/users', createUserRoutes(api));
    router.use('/providers', createProviderRoutes(api));
    router.use('/service-providers', createServiceProviderRoutes(api));
    router.use('/vehicles', createVehicleRoutes(api));
    router.use('/notifications', createNotificationRoutes(api));
    router.use('/auth', createAuthRoutes(api));

    console.log('✅ All routes registered successfully');

    return router;
}

export default createRouter;
