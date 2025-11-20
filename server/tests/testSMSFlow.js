/**
 * SMS Flow Testing Helper
 * Use this script to manually test SMS response handling
 *
 * Usage:
 *   node server/tests/testSMSFlow.js
 */

import { processSMSResponse } from '../services/smsResponseHandler.js';
import { RIDE_STATUSES } from '../constants/rideStatuses.js';
import { RIDE_REQUEST_STATUSES } from '../constants/rideRequestStatuses.js';

// Mock ride objects for testing
const mockRides = {
  confirmedRide: {
    uuid: 123,
    rideStatus: RIDE_STATUSES.RIDE_CONFIRMED,
    requestStatus: RIDE_REQUEST_STATUSES.RIDE_CONFIRMATION_NEEDED.code,
    roundTrip: false,
    pickupLocation: '123 Main St, New York, NY',
    dropoffLocation: '456 Park Ave, New York, NY'
  },

  assignmentPending: {
    uuid: 124,
    rideStatus: RIDE_STATUSES.REQUEST_IN_PROGRESS,
    requestStatus: RIDE_REQUEST_STATUSES.RIDE_CONFIRMATION_NEEDED.code,
    roundTrip: false
  },

  rideStarted: {
    uuid: 125,
    rideStatus: RIDE_STATUSES.RIDE_STARTED,
    requestStatus: RIDE_REQUEST_STATUSES.READY_TO_RIDE.code,
    roundTrip: false
  },

  pickedUp: {
    uuid: 126,
    rideStatus: RIDE_STATUSES.RIDER_PICKED_UP,
    requestStatus: RIDE_REQUEST_STATUSES.READY_TO_RIDE.code,
    roundTrip: false
  },

  droppedOff: {
    uuid: 127,
    rideStatus: RIDE_STATUSES.RIDER_DROPPED_OFF,
    requestStatus: RIDE_REQUEST_STATUSES.READY_TO_RIDE.code,
    roundTrip: true,
    pickupLocation: '123 Main St'
  },

  roundtripReturning: {
    uuid: 128,
    rideStatus: RIDE_STATUSES.ROUNDTRIP_RETURNING,
    requestStatus: RIDE_REQUEST_STATUSES.READY_TO_RIDE.code,
    roundTrip: true
  }
};

// Test scenarios
const testScenarios = [
  {
    name: 'Driver Accepts Assignment',
    ride: mockRides.assignmentPending,
    senderRole: 'driver',
    message: '1',
    expectedStatus: RIDE_STATUSES.RIDE_CONFIRMED,
    expectedNotifications: ['rider', 'case_manager']
  },

  {
    name: 'Driver Declines Assignment',
    ride: mockRides.assignmentPending,
    senderRole: 'driver',
    message: '2',
    expectedRequestStatus: RIDE_REQUEST_STATUSES.DRIVER_NEEDED.code
  },

  {
    name: 'Driver Confirms Arrival',
    ride: mockRides.confirmedRide,
    senderRole: 'driver',
    message: '1',
    expectedNotifications: ['rider', 'case_manager', 'driver']
  },

  {
    name: 'Driver En Route (Not Arrived)',
    ride: mockRides.confirmedRide,
    senderRole: 'driver',
    message: '2',
    expectedNotifications: ['rider', 'case_manager']
  },

  {
    name: 'Driver Confirms Pickup',
    ride: mockRides.rideStarted,
    senderRole: 'driver',
    message: '1',
    expectedStatus: RIDE_STATUSES.RIDER_PICKED_UP,
    expectedScheduledStatus: RIDE_STATUSES.RIDE_STARTED,
    expectedScheduledDelay: 5
  },

  {
    name: 'Driver Waiting for Pickup',
    ride: mockRides.rideStarted,
    senderRole: 'driver',
    message: '2',
    expectedNotifications: ['rider', 'case_manager'],
    expectedScheduledNotification: true
  },

  {
    name: 'Driver Confirms Dropoff',
    ride: mockRides.pickedUp,
    senderRole: 'driver',
    message: '1',
    expectedStatus: RIDE_STATUSES.RIDER_DROPPED_OFF,
    expectedNotifications: ['rider', 'case_manager']
  },

  {
    name: 'Driver Cannot Drop Off',
    ride: mockRides.pickedUp,
    senderRole: 'driver',
    message: '2',
    expectedStatus: RIDE_STATUSES.RIDER_NOT_DROPPED_OFF,
    expectedRequestStatus: RIDE_REQUEST_STATUSES.CLOSED.code
  },

  {
    name: 'Rider Confirms 1 Hour Prior',
    ride: mockRides.confirmedRide,
    senderRole: 'rider',
    message: '1',
    expectedNoStatusChange: true
  },

  {
    name: 'Rider Cancels 1 Hour Prior',
    ride: mockRides.confirmedRide,
    senderRole: 'rider',
    message: '2',
    expectedStatus: RIDE_STATUSES.RIDE_CANCELED_BY_RIDER,
    expectedRequestStatus: RIDE_REQUEST_STATUSES.CLOSED.code
  },

  {
    name: 'Rider Cancels with Code 3',
    ride: mockRides.confirmedRide,
    senderRole: 'rider',
    message: '3',
    expectedStatus: RIDE_STATUSES.RIDE_CANCELED_BY_RIDER,
    expectedRequestStatus: RIDE_REQUEST_STATUSES.CLOSED.code
  },

  {
    name: 'Roundtrip Return Started',
    ride: mockRides.droppedOff,
    senderRole: 'driver',
    message: '1',
    expectedStatus: RIDE_STATUSES.ROUNDTRIP_RETURNING
  },

  {
    name: 'Roundtrip Completed',
    ride: mockRides.roundtripReturning,
    senderRole: 'driver',
    message: '1',
    expectedStatus: RIDE_STATUSES.ROUNDTRIP_COMPLETE,
    expectedRequestStatus: RIDE_REQUEST_STATUSES.CLOSED.code
  },

  {
    name: 'Roundtrip Interrupted',
    ride: mockRides.roundtripReturning,
    senderRole: 'driver',
    message: '2',
    expectedStatus: RIDE_STATUSES.ROUNDTRIP_COMPLETION_INTERRUPTED,
    expectedRequestStatus: RIDE_REQUEST_STATUSES.CLOSED.code
  },

  {
    name: 'Invalid Response',
    ride: mockRides.confirmedRide,
    senderRole: 'driver',
    message: 'hello',
    expectedError: true
  },

  {
    name: 'Text Response - Yes',
    ride: mockRides.assignmentPending,
    senderRole: 'driver',
    message: 'yes',
    expectedStatus: RIDE_STATUSES.RIDE_CONFIRMED
  },

  {
    name: 'Text Response - No',
    ride: mockRides.assignmentPending,
    senderRole: 'driver',
    message: 'no',
    expectedRequestStatus: RIDE_REQUEST_STATUSES.DRIVER_NEEDED.code
  },

  {
    name: 'Text Response - Cancel',
    ride: mockRides.confirmedRide,
    senderRole: 'rider',
    message: 'cancel',
    expectedStatus: RIDE_STATUSES.RIDE_CANCELED_BY_RIDER
  }
];

// Run tests
console.log('🧪 SMS Flow Testing Helper');
console.log('==========================\n');

let passed = 0;
let failed = 0;

testScenarios.forEach((scenario, index) => {
  console.log(`Test ${index + 1}/${testScenarios.length}: ${scenario.name}`);
  console.log(`  Ride Status: ${scenario.ride.rideStatus}`);
  console.log(`  Sender: ${scenario.senderRole}`);
  console.log(`  Message: "${scenario.message}"`);

  try {
    const result = processSMSResponse(
      scenario.ride,
      scenario.senderRole,
      scenario.message
    );

    // Check for expected error
    if (scenario.expectedError) {
      if (!result.success) {
        console.log(`  ✅ PASS - Error handled correctly`);
        console.log(`     Error: ${result.error}\n`);
        passed++;
        return;
      } else {
        console.log(`  ❌ FAIL - Expected error but got success\n`);
        failed++;
        return;
      }
    }

    // Check success
    if (!result.success) {
      console.log(`  ❌ FAIL - Processing failed: ${result.error}\n`);
      failed++;
      return;
    }

    // Validate expected status change
    if (scenario.expectedStatus !== undefined) {
      if (result.newRideStatus === scenario.expectedStatus) {
        console.log(`  ✅ Status changed to ${scenario.expectedStatus}`);
      } else {
        console.log(`  ❌ FAIL - Expected status ${scenario.expectedStatus}, got ${result.newRideStatus}`);
        failed++;
        return;
      }
    }

    // Validate expected request status change
    if (scenario.expectedRequestStatus !== undefined) {
      if (result.newRequestStatus === scenario.expectedRequestStatus) {
        console.log(`  ✅ Request status changed to ${scenario.expectedRequestStatus}`);
      } else {
        console.log(`  ❌ FAIL - Expected request status ${scenario.expectedRequestStatus}, got ${result.newRequestStatus}`);
        failed++;
        return;
      }
    }

    // Validate notifications
    if (scenario.expectedNotifications) {
      const notificationRecipients = result.notifications?.map(n => n.recipient) || [];
      const allFound = scenario.expectedNotifications.every(r =>
        notificationRecipients.includes(r)
      );

      if (allFound) {
        console.log(`  ✅ Notifications: ${notificationRecipients.join(', ')}`);
      } else {
        console.log(`  ❌ FAIL - Expected notifications to: ${scenario.expectedNotifications.join(', ')}`);
        console.log(`     Got: ${notificationRecipients.join(', ')}`);
        failed++;
        return;
      }
    }

    // Validate scheduled status change
    if (scenario.expectedScheduledStatus) {
      if (result.scheduleStatusChange?.status === scenario.expectedScheduledStatus) {
        console.log(`  ✅ Scheduled status change to ${scenario.expectedScheduledStatus} in ${result.scheduleStatusChange.delayMinutes} min`);
      } else {
        console.log(`  ❌ FAIL - Expected scheduled status change`);
        failed++;
        return;
      }
    }

    // Validate scheduled notification
    if (scenario.expectedScheduledNotification) {
      if (result.scheduleNotification) {
        console.log(`  ✅ Scheduled notification: ${result.scheduleNotification.template}`);
      } else {
        console.log(`  ❌ FAIL - Expected scheduled notification`);
        failed++;
        return;
      }
    }

    // Validate no status change
    if (scenario.expectedNoStatusChange) {
      if (!result.newRideStatus && !result.newRequestStatus) {
        console.log(`  ✅ No status change (as expected)`);
      } else {
        console.log(`  ❌ FAIL - Expected no status change but got one`);
        failed++;
        return;
      }
    }

    console.log(`  ✅ PASS\n`);
    passed++;

  } catch (error) {
    console.log(`  ❌ FAIL - Exception: ${error.message}\n`);
    failed++;
  }
});

// Summary
console.log('==========================');
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`Success rate: ${Math.round((passed / testScenarios.length) * 100)}%`);

if (failed === 0) {
  console.log('\n✅ All tests passed!');
  process.exit(0);
} else {
  console.log(`\n❌ ${failed} test(s) failed`);
  process.exit(1);
}
