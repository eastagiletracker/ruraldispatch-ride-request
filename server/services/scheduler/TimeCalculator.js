/**
 * Time Calculator
 * Handles all time-related calculations for ride scheduling
 *
 * Responsibilities:
 * - Calculate notification times (1 hour prior, pickup, dropoff, return)
 * - Validate if times are in the future
 * - Calculate delays for setTimeout
 */
class TimeCalculator {
  /**
   * Calculate 1 hour prior to pickup time
   * @param {object} ride - The ride object
   * @returns {object} { targetTime: Date, delay: number (ms), isPast: boolean }
   */
  calculateOneHourPrior(ride) {
    const pickupTime = new Date(ride.pickupRequestedTime);
    const targetTime = new Date(pickupTime.getTime() - 60 * 60 * 1000);
    const now = new Date();
    const delay = targetTime.getTime() - now.getTime();

    return {
      targetTime,
      delay,
      isPast: delay <= 0,
      pickupTime
    };
  }

  /**
   * Calculate pickup time
   * @param {object} ride - The ride object
   * @returns {object} { targetTime: Date, delay: number (ms), isPast: boolean }
   */
  calculatePickupTime(ride) {
    const targetTime = new Date(ride.pickupRequestedTime);
    const now = new Date();
    const delay = targetTime.getTime() - now.getTime();

    return {
      targetTime,
      delay,
      isPast: delay <= 0
    };
  }

  /**
   * Calculate estimated dropoff time
   * @param {object} ride - The ride object
   * @returns {object} { targetTime: Date, delay: number (ms), isPast: boolean }
   */
  calculateDropoffTime(ride) {
    const pickupTime = new Date(ride.pickupRequestedTime);
    const travelTimeMinutes = ride.estimatedTravelTime || 30; // Default 30 min if not set
    const targetTime = new Date(pickupTime.getTime() + travelTimeMinutes * 60 * 1000);
    const now = new Date();
    const delay = targetTime.getTime() - now.getTime();

    return {
      targetTime,
      delay,
      isPast: delay <= 0,
      travelTimeMinutes
    };
  }

  /**
   * Calculate roundtrip return pickup time
   * @param {object} ride - The ride object
   * @returns {object} { targetTime: Date, delay: number (ms), isPast: boolean }
   */
  calculateRoundtripReturnTime(ride) {
    const pickupTime = new Date(ride.pickupRequestedTime);
    const travelTimeMinutes = ride.estimatedTravelTime || 30;
    const waitingTimeMinutes = ride.estimatedWaitingTime || 60; // Default 60 min wait

    const targetTime = new Date(
      pickupTime.getTime() +
      (travelTimeMinutes + waitingTimeMinutes) * 60 * 1000
    );

    const now = new Date();
    const delay = targetTime.getTime() - now.getTime();

    return {
      targetTime,
      delay,
      isPast: delay <= 0,
      travelTimeMinutes,
      waitingTimeMinutes
    };
  }

  /**
   * Calculate delay for a custom number of minutes from now
   * @param {number} delayMinutes - Delay in minutes
   * @returns {object} { delay: number (ms) }
   */
  calculateDelayFromNow(delayMinutes) {
    const delay = delayMinutes * 60 * 1000;
    const targetTime = new Date(Date.now() + delay);

    return {
      targetTime,
      delay,
      delayMinutes
    };
  }

  /**
   * Format time information for logging
   * @param {Date} time - The time to format
   * @param {number} delayMs - Delay in milliseconds
   * @returns {object} { timeString: string, delayMinutes: number }
   */
  formatTimeInfo(time, delayMs) {
    return {
      timeString: time.toLocaleString(),
      delayMinutes: Math.round(delayMs / 1000 / 60)
    };
  }
}

export default new TimeCalculator();
