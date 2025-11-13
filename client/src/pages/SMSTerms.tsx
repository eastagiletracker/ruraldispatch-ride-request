import { Link } from 'react-router-dom';

const SMSTerms = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">SMS Terms & Conditions</h1>
        <p className="text-sm text-gray-500 mb-8">Last Updated: November 9, 2025</p>

        <div className="prose prose-blue max-w-none space-y-6 text-gray-700">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. SMS Service Overview</h2>
            <p>
              SWARM LLC offers SMS text message notifications to keep you informed about your rides. By 
              opting in, you agree to receive automated text messages about ride confirmations, driver 
              updates, ETAs, and important service notifications.
            </p>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mt-4">
              <p className="text-blue-800">
                <strong>Important:</strong> Consent to receive SMS is NOT required to use SWARM LLC services. 
                You can still request and receive rides without SMS notifications.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Enrollment and Consent</h2>
            <p>
              By providing your phone number and checking the SMS consent box during registration or on our 
              <Link to="/sms-consent" className="text-blue-600 hover:underline"> SMS consent page</Link>, you:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Authorize SWARM LLC to send you SMS text messages</li>
              <li>Provide express written consent under the Telephone Consumer Protection Act (TCPA)</li>
              <li>Agree to receive messages at the phone number you provided</li>
              <li>Acknowledge that your consent is being recorded with a timestamp</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Types of Messages</h2>
            <p>You may receive the following types of SMS messages:</p>
            
            <div className="space-y-4 mt-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Ride Confirmations</h3>
                <p className="text-sm text-gray-600">
                  Example: "✅ Ride #1234 has been accepted! Your driver will pick you up at 123 Main St."
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Driver Updates</h3>
                <p className="text-sm text-gray-600">
                  Example: "🚗 Your driver Sarah is on the way. Vehicle: Blue Honda Accord (ABC-123)"
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">ETA Notifications</h3>
                <p className="text-sm text-gray-600">
                  Example: "Driver arriving in 5 minutes. Please be ready at the pickup location."
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Ride Status Updates</h3>
                <p className="text-sm text-gray-600">
                  Example: "📍 Ride in progress. Estimated arrival at destination: 2:30 PM"
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Service Notifications</h3>
                <p className="text-sm text-gray-600">
                  Example: "⚠️ Weather alert: Please allow extra travel time due to heavy rain."
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Message Frequency</h2>
            <p>
              You may receive approximately <strong>1-5 SMS messages per active ride</strong>, plus occasional 
              service notifications. Actual frequency depends on:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Number of rides you request</li>
              <li>Ride status changes (driver assigned, en route, arrived, completed)</li>
              <li>Important service updates or alerts</li>
            </ul>
            <p className="mt-3 text-sm bg-yellow-50 border border-yellow-200 p-3 rounded">
              <strong>Note:</strong> We will never send unsolicited marketing messages or share your number 
              with third parties for promotional purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Message and Data Rates</h2>
            <p>
              Message and data rates may apply based on your mobile carrier's plan. SWARM LLC does not charge 
              for SMS notifications, but standard rates from your carrier may apply. Contact your mobile 
              carrier for details about your messaging plan.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mt-3">
              <p className="text-sm">
                <strong>Carriers Supported:</strong> AT&T, Verizon, T-Mobile, Sprint, and most major U.S. carriers
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. How to Opt-Out (STOP)</h2>
            <p>
              You can unsubscribe from SMS notifications at any time using any of these methods:
            </p>
            
            <div className="space-y-3 mt-4">
              <div className="flex items-start">
                <span className="text-2xl mr-3">1️⃣</span>
                <div>
                  <p className="font-semibold">Reply STOP</p>
                  <p className="text-sm text-gray-600">
                    Reply with the word <strong>STOP</strong> to any SMS message from SWARM LLC
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <span className="text-2xl mr-3">2️⃣</span>
                <div>
                  <p className="font-semibold">Visit Opt-Out Page</p>
                  <p className="text-sm text-gray-600">
                    Go to <Link to="/sms-opt-out" className="text-blue-600 hover:underline">
                    ruraldispatch.org/sms-opt-out</Link> and follow the instructions
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <span className="text-2xl mr-3">3️⃣</span>
                <div>
                  <p className="font-semibold">Account Settings</p>
                  <p className="text-sm text-gray-600">
                    Manage SMS preferences in your SWARM LLC account dashboard
                  </p>
                </div>
              </div>
            </div>

            <p className="mt-4">
              After opting out, you will receive a confirmation message: 
              <em className="block mt-2 p-3 bg-gray-100 rounded text-sm">
                "You have been unsubscribed from SWARM LLC SMS notifications. You will not receive further 
                messages. Reply START to resubscribe or visit www.swarmnyc.com/sms-consent"
              </em>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. How to Get Help (HELP)</h2>
            <p>
              For assistance with SMS notifications, reply <strong>HELP</strong> to any message or contact us:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mt-3">
              <p className="font-semibold">SWARM LLC</p>
              <p>333 Hudson St, New York, NY 10013</p>
              <p>Phone: <a href="tel:+18313251472" className="text-blue-600 hover:underline">+1 (831) 325-1472</a></p>
              <p>SMS: <a href="tel:+18669017244" className="text-blue-600 hover:underline">+1 (866) 901-7244</a></p>
              <p>Email: <a href="mailto:hello@swarmnyc.com" className="text-blue-600 hover:underline">hello@swarmnyc.com</a></p>
              <p>Web: <a href="https://www.swarmnyc.com" className="text-blue-600 hover:underline">https://www.swarmnyc.com</a></p>
              <p className="text-xs text-gray-500 mt-1">Monday-Friday, 9am-6pm EST</p>
            </div>
            <p className="mt-3 text-sm">
              When you reply HELP, you will receive:
              <em className="block mt-2 p-3 bg-gray-100 rounded text-sm">
                "SWARM LLC SMS Help: Get ride updates via text. Msg&Data rates may apply. Reply STOP to 
                opt-out. Support: +1 (831) 325-1472 or hello@swarmnyc.com. Terms: https://ruraldispatch.org/sms-terms"
              </em>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Opt Back In (START)</h2>
            <p>
              If you previously opted out and want to resume SMS notifications:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Reply <strong>START</strong> to any previous SWARM LLC message</li>
              <li>Visit our <Link to="/sms-consent" className="text-blue-600 hover:underline">SMS consent page</Link></li>
              <li>Enable SMS in your account settings</li>
            </ul>
            <p className="mt-3">
              You will receive a confirmation when you re-subscribe.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Privacy and Data</h2>
            <p>
              Your phone number and SMS preferences are stored securely and used only for SWARM LLC 
              notifications. We:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li><strong>DO NOT</strong> sell your phone number to third parties</li>
              <li><strong>DO NOT</strong> use your number for unsolicited marketing</li>
              <li><strong>DO</strong> encrypt your data in transit and at rest</li>
              <li><strong>DO</strong> record consent with timestamps for compliance</li>
            </ul>
            <p className="mt-3">
              SMS messages are sent via Twilio and Vonage. See our{' '}
              <Link to="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link> for details.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Technical Requirements</h2>
            <p>To receive SMS notifications, you need:</p>
            <ul className="list-disc ml-6 space-y-2">
              <li>A mobile phone with SMS capability</li>
              <li>A U.S. phone number</li>
              <li>Service with a compatible carrier</li>
              <li>An active SWARM LLC account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. SMS Service Providers</h2>
            <p>
              SWARM LLC uses the following third-party SMS providers:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li><strong>Twilio</strong> - Primary SMS delivery (toll-free: +1 (831) 325-1472)</li>
              <li><strong>Vonage</strong> - Backup SMS delivery</li>
            </ul>
            <p className="mt-3 text-sm text-gray-600">
              These providers comply with TCPA regulations and industry best practices for SMS delivery.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Liability</h2>
            <p>
              SWARM LLC is not liable for:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Delayed or undelivered messages due to carrier issues</li>
              <li>Mobile carrier charges for SMS messages</li>
              <li>Actions taken based on SMS content</li>
              <li>Inability to receive messages due to device or network issues</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Changes to SMS Terms</h2>
            <p>
              We may update these SMS Terms from time to time. Material changes will be communicated via:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Email notification to your registered email</li>
              <li>SMS notification (one-time)</li>
              <li>Update on this page with revised "Last Updated" date</li>
            </ul>
            <p className="mt-3">
              Continued use of SMS services after changes constitutes acceptance of updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Compliance</h2>
            <p>
              Our SMS program complies with:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li><strong>TCPA</strong> (Telephone Consumer Protection Act)</li>
              <li><strong>CAN-SPAM Act</strong></li>
              <li><strong>CTIA Guidelines</strong> for SMS messaging</li>
              <li><strong>Mobile carrier requirements</strong></li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Contact Information</h2>
            <p>
              Questions about our SMS service? Contact us:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mt-3">
              <p className="font-semibold">SWARM LLC</p>
              <p>333 Hudson St, New York, NY 10013</p>
              <p>Phone: <a href="tel:+18313251472" className="text-blue-600 hover:underline">+1 (831) 325-1472</a></p>
              <p>SMS: <a href="tel:+18669017244" className="text-blue-600 hover:underline">+1 (866) 901-7244</a></p>
              <p>Email: <a href="mailto:hello@swarmnyc.com" className="text-blue-600 hover:underline">hello@swarmnyc.com</a></p>
              <p>Web: <a href="https://www.swarmnyc.com" className="text-blue-600 hover:underline">https://www.swarmnyc.com</a></p>
            </div>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-200">
          <div className="space-y-4">
            <div className="flex gap-4 justify-center flex-wrap">
              <Link to="/terms" className="text-blue-600 hover:underline">Terms of Service</Link>
              <Link to="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
              <Link to="/sms" className="text-blue-600 hover:underline">SMS Info</Link>
              <Link to="/sms-consent" className="text-blue-600 hover:underline">Opt In</Link>
              <Link to="/sms-opt-out" className="text-blue-600 hover:underline">Opt Out</Link>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-green-800 font-semibold">✓ TCPA Compliant SMS Program</p>
              <p className="text-sm text-green-700 mt-1">
                Our SMS service meets all federal and carrier requirements
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SMSTerms;
