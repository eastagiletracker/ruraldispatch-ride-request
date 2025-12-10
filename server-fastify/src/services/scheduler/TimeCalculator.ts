import type { Ride, RideWithSchedulingFields } from '../../types/database.types.js';

/**
 * Time Calculator
 * Handles all time-related calculations for ride scheduling
 *
 * Responsibilities:
 * - Calculate notification times (1 hour prior, pickup, dropoff, return)
 * - Validate if times are in the future
 * - Calculate delays for setTimeout
 */

interface TimeCalculation {
  targetTime: Date;
  delay: number;
  isPast: boolean;
}

interface OneHourPriorCalculation extends TimeCalculation {
  pickupTime: Date;
}

interface DropoffTimeCalculation extends TimeCalculation {
  travelTimeMinutes: number;
}

interface RoundtripReturnCalculation extends TimeCalculation {
  travelTimeMinutes: number;
  waitingTimeMinutes: number;
}

interface DelayCalculation {
  targetTime: Date;
  delay: number;
  delayMinutes: number;
}

interface TimeFormatInfo {
  timeString: string;
  delayMinutes: number;
}

class TimeCalculator {
  /**
   * Calculate 1 hour prior to pickup time
   */
  calculateOneHourPrior(ride: Ride): OneHourPriorCalculation {
    const pickupTime = new Date(ride.pickupRequestedTime);
    const targetTime = new Date(pickupTime.getTime() - 60 * 60 * 1000);
    const now = new Date();
    const delay = targetTime.getTime() - now.getTime();

    return {
      targetTime,
      delay,
      isPast: delay <= 0,
      pickupTime,
    };
  }

  /**
   * Calculate pickup time
   */
  calculatePickupTime(ride: Ride): TimeCalculation {
    const targetTime = new Date(ride.pickupRequestedTime);
    const now = new Date();
    const delay = targetTime.getTime() - now.getTime();

    return {
      targetTime,
      delay,
      isPast: delay <= 0,
    };
  }

  /**
   * Calculate estimated dropoff time
   * NOTE: This calculates from NOW (when rider is picked up), not from pickupRequestedTime
   * This is because the actual pickup may happen at a different time than requested
   */
  calculateDropoffTime(ride: RideWithSchedulingFields): DropoffTimeCalculation {
    const now = new Date();
    const travelTimeMinutes = ride.estimatedTravelTime || 30; // Default 30 min if not set
    const targetTime = new Date(now.getTime() + travelTimeMinutes * 60 * 1000);
    const delay = travelTimeMinutes * 60 * 1000; // delay is the travel time from now

    console.log(`📍 Dropoff time calculation:`);
    console.log(`   Current time: ${now.toISOString()}`);
    console.log(`   Estimated travel time: ${travelTimeMinutes} minutes`);
    console.log(`   Target dropoff time: ${targetTime.toISOString()}`);

    return {
      targetTime,
      delay,
      isPast: false, // Never past since we calculate from now
      travelTimeMinutes,
    };
  }

  /**
   * Calculate roundtrip return pickup time
   */
  calculateRoundtripReturnTime(ride: RideWithSchedulingFields): RoundtripReturnCalculation {
    const pickupTime = new Date(ride.pickupRequestedTime);
    const travelTimeMinutes = ride.estimatedTravelTime || 30;
    const waitingTimeMinutes = ride.estimatedWaitingTime || 60; // Default 60 min wait

    const targetTime = new Date(
      pickupTime.getTime() + (travelTimeMinutes + waitingTimeMinutes) * 60 * 1000
    );

    const now = new Date();
    const delay = targetTime.getTime() - now.getTime();

    return {
      targetTime,
      delay,
      isPast: delay <= 0,
      travelTimeMinutes,
      waitingTimeMinutes,
    };
  }

  /**
   * Calculate delay for a custom number of minutes from now
   */
  calculateDelayFromNow(delayMinutes: number): DelayCalculation {
    const delay = delayMinutes * 60 * 1000;
    const targetTime = new Date(Date.now() + delay);

    return {
      targetTime,
      delay,
      delayMinutes,
    };
  }

  /**
   * Format time information for logging
   */
  formatTimeInfo(time: Date, delayMs: number): TimeFormatInfo {
    return {
      timeString: time.toLocaleString(),
      delayMinutes: Math.round(delayMs / 1000 / 60),
    };
  }
}

export default new TimeCalculator();
