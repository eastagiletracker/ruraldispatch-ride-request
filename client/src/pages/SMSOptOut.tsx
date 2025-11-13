import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const SMSOptOut = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [timestamp] = useState(new Date().toLocaleString());

  useEffect(() => {
    // Get phone number from URL params
    const phone = searchParams.get('phone') || '';
    setPhoneNumber(phone);
  }, [searchParams]);

  const handleOptOut = async () => {
    setLoading(true);
    try {
      // Record opt-out in database
      await axios.post('/api/users/sms-consent', {
        phoneNumber,
        consentGiven: false,
        timestamp: new Date().toISOString(),
        ipAddress: window.location.hostname
      });

      setSuccess(true);
    } catch (error) {
      console.error('Error recording opt-out:', error);
      alert('There was an error. Please try again or reply STOP to any message.');
    } finally {
      setLoading(false);
    }
  };

  const handleOptBackIn = () => {
    navigate(`/sms-consent?phone=${phoneNumber}`);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Success Header */}
          <div className="bg-gradient-to-r from-gray-600 to-gray-700 px-8 py-12 text-center">
            <div className="text-6xl mb-4">✓</div>
            <h1 className="text-3xl font-bold text-white mb-2">
              You've Been Unsubscribed
            </h1>
            <p className="text-gray-200 text-lg">
              You will no longer receive SMS notifications from SWARM LLC
            </p>
          </div>

          {/* Content */}
          <div className="px-8 py-8 space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <p className="text-green-800 text-center">
                <strong>Success!</strong> Your phone number has been removed from our SMS list.
              </p>
            </div>

            <div className="space-y-3 text-gray-700">
              <p>
                <strong>What this means:</strong>
              </p>
              <ul className="ml-6 space-y-2 list-disc">
                <li>You will NOT receive ride confirmation messages</li>
              <li>You will NOT receive driver update notifications</li>
              <li>You will NOT receive ETA or status updates via SMS</li>
              <li>You can still use SWARM LLC services normally</li>
              <li>You'll need to check the app/website for ride updates</li>
            </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <p className="text-blue-800 text-center font-semibold mb-3">
                Want to opt back in?
              </p>
              <p className="text-sm text-gray-700 text-center mb-4">
                You can re-enable SMS notifications at any time by replying <strong>START</strong> to 
                any previous message, or by clicking the button below.
              </p>
              <button
                onClick={handleOptBackIn}
                className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
              >
                Re-enable SMS Notifications
              </button>
            </div>

            <div className="text-center pt-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 hover:text-gray-800 underline"
              >
                Return to Dashboard
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Unsubscribed on: {timestamp}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-orange-600 px-8 py-12 text-center">
          <div className="text-6xl mb-4">🛑</div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Unsubscribe from SMS Notifications
          </h1>
          <p className="text-red-100 text-lg">
            We're sorry to see you go
          </p>
        </div>

        {/* Content */}
        <div className="px-8 py-8 space-y-6">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <p className="text-yellow-800">
              <strong>⚠️ Important:</strong> If you unsubscribe, you will no longer receive SMS 
              notifications about your rides, including driver updates and arrival notifications.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              What You'll Miss
            </h2>
            <ul className="space-y-2">
              {[
                'Real-time ride confirmations',
                'Driver assignment notifications',
                'ETA and arrival updates',
                'Ride status changes',
                'Important service announcements'
              ].map((item, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="text-red-500 mr-2">✗</span>
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mt-4">
              <p className="text-blue-800">
                <strong>Note:</strong> You can still use SWARM LLC services. You'll just need to check 
                the app or website for ride updates instead of receiving SMS notifications.
              </p>
            </div>          {phoneNumber && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-700 text-center">
                Phone number: <strong>{phoneNumber}</strong>
              </p>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="px-8 pb-8">
          <div className="space-y-3">
            <button
              onClick={handleOptOut}
              disabled={loading}
              className={`w-full px-6 py-3 font-semibold rounded-lg transition ${
                loading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              {loading ? 'Processing...' : 'Yes, Unsubscribe Me'}
            </button>

            <button
              onClick={() => navigate('/dashboard')}
              className="w-full px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
            >
              Cancel, Keep Notifications
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              You can also unsubscribe by replying <strong>STOP</strong> to any SMS message
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
          <p className="text-sm text-center space-x-4">
            <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a>
            <span className="text-gray-400">|</span>
            <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>
            <span className="text-gray-400">|</span>
            <a href="/sms" className="text-blue-600 hover:underline">SMS Info</a>
            <span className="text-gray-400">|</span>
            <a href="/sms-terms" className="text-blue-600 hover:underline">SMS Terms</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SMSOptOut;
