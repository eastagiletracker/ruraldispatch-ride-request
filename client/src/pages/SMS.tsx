import { Link } from 'react-router-dom';

const SMS = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-12 text-center">
          <div className="text-6xl mb-4">📱</div>
          <h1 className="text-3xl font-bold text-white mb-2">SWARM LLC SMS Consent</h1>
          <p className="text-blue-100 text-lg">Text Message Notifications for Your Rides</p>
        </div>

        {/* Main Content */}
        <div className="px-8 py-10 space-y-6">
          {/* Primary Statement */}
          <div className="bg-blue-50 border-l-4 border-blue-600 p-6">
            <p className="text-lg text-gray-800 leading-relaxed">
              We send text messages <strong>only about your scheduled transportation</strong> —
              including pickup times, driver information, confirmations, and changes to your rides.
            </p>
          </div>

          {/* Key Information */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl">💰</div>
              <div>
                <h3 className="font-semibold text-gray-900">Message & Data Rates</h3>
                <p className="text-gray-700 text-sm">
                  Standard message and data rates may apply from your mobile carrier.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="text-2xl">📊</div>
              <div>
                <h3 className="font-semibold text-gray-900">Message Frequency</h3>
                <p className="text-gray-700 text-sm">
                  Message frequency varies based on your trip activity (typically 1-5 messages per
                  ride).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="text-2xl">⛔</div>
              <div>
                <h3 className="font-semibold text-gray-900">Cancel Anytime</h3>
                <p className="text-gray-700 text-sm">
                  Reply <strong>STOP</strong> to any message to cancel text notifications at any
                  time.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="text-2xl">❓</div>
              <div>
                <h3 className="font-semibold text-gray-900">Need Help?</h3>
                <p className="text-gray-700 text-sm">
                  Reply <strong>HELP</strong> to any message for assistance, or contact us at (866)
                  901-7244.
                </p>
              </div>
            </div>
          </div>

          {/* Critical Consent Statement */}
          <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6">
            <h2 className="text-xl font-bold text-green-900 mb-3 flex items-center gap-2">
              <span>✓</span> Important: SMS is Optional
            </h2>
            <p className="text-gray-800 leading-relaxed">
              <strong>
                Consent to receive text messages is NOT a condition of getting service.
              </strong>{' '}
              Riders can confirm their transportation by phone instead. You will still receive full
              service whether or not you opt in to SMS notifications.
            </p>
          </div>

          {/* Example Messages */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Example Text Messages You'll Receive
            </h2>
            <div className="space-y-3">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Ride Confirmation:</p>
                <p className="text-gray-800 italic">
                  "SWARM LLC: Your ride request #1234 has been accepted. Driver will pick you up at
                  123 Main St on 11/09 at 2:00 PM. Reply STOP to opt-out, HELP for support."
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Driver Info:</p>
                <p className="text-gray-800 italic">
                  "SWARM LLC: Your driver Sarah is on the way. Vehicle: Blue Honda Accord (ABC-123).
                  Phone: (555) 123-4567. Reply STOP to opt-out, HELP for support."
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Arrival Notice:</p>
                <p className="text-gray-800 italic">
                  "SWARM LLC: Driver arriving in 5 minutes. Please be ready at the pickup location.
                  Reply STOP to opt-out, HELP for support."
                </p>
              </div>
            </div>
          </div>

          {/* How to Opt In */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">How to Opt In</h2>
            <p className="text-gray-700 mb-3">
              You can consent to receive SMS notifications in two ways:
            </p>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>
                  <strong>During registration:</strong> Check the SMS consent box when creating your
                  account
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>
                  <strong>Verbal consent:</strong> Dispatch staff will ask: "May we send text
                  messages about your rides to XXX-XXX-XXXX?" If you say "yes," you'll be opted in.
                </span>
              </li>
            </ul>
          </div>

          {/* Links */}
          <div className="pt-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/sms-consent"
                className="flex-1 px-6 py-3 bg-blue-600 text-white text-center font-semibold rounded-lg hover:bg-blue-700 transition"
              >
                Opt In to SMS Notifications
              </Link>
              <Link
                to="/sms-opt-out"
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 text-center font-semibold rounded-lg hover:bg-gray-50 transition"
              >
                Opt Out of SMS
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center mb-3">SWARM LLC</p>
          <p className="text-sm text-center space-x-4">
            <Link to="/terms" className="text-blue-600 hover:underline">
              Terms of Service
            </Link>
            <span className="text-gray-400">|</span>
            <Link to="/privacy" className="text-blue-600 hover:underline">
              Privacy Policy
            </Link>
            <span className="text-gray-400">|</span>
            <Link to="/sms-terms" className="text-blue-600 hover:underline">
              Full SMS Terms
            </Link>
          </p>
          <p className="text-xs text-gray-500 text-center mt-4">
            Questions? Call us at (866) 901-7244
          </p>
        </div>
      </div>
    </div>
  );
};

export default SMS;
