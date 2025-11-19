require('dotenv').config({ path: '../.env' });
const express = require('express');
const notificationService = require('../services/notificationService');

// Import route modules
const createRideRequestRoutes = require('./rideRequestRoutes');
const createUserRoutes = require('./userRoutes');
const { createProviderRoutes, createServiceProviderRoutes } = require('./providerRoutes');
const createVehicleRoutes = require('./vehicleRoutes');
const createNotificationRoutes = require('./notificationRoutes');
const createAuthRoutes = require('./authRoutes');

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

module.exports = createRouter;
