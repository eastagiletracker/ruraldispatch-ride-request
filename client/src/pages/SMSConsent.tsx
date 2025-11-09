import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const SMSConsent = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isChecked, setIsChecked] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [timestamp] = useState(new Date().toLocaleString());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Get phone number from URL params or user context
    const phone = searchParams.get('phone') || '';
    setPhoneNumber(phone);
  }, [searchParams]);

  const handleAgree = async () => {
    if (!isChecked) return;

    setLoading(true);
    try {
      // Record consent in database
      await axios.post('/api/users/sms-consent', {
        phoneNumber,
        consentGiven: true,
        timestamp: new Date().toISOString(),
        ipAddress: window.location.hostname
      });

      alert('✅ Thank you! SMS notifications have been enabled for your account.');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error recording consent:', error);
      alert('There was an error saving your preference. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = () => {
    if (confirm('You can enable SMS notifications anytime in your account settings.')) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-12 text-center">
          <div className="text-6xl mb-4">🚗</div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Stay Connected with Your Rides
          </h1>
          <p className="text-blue-100 text-lg">
            We'd like to send you important ride updates via SMS
          </p>
          <p className="text-blue-200 text-sm mt-2">
            Rural Dispatch by SWARM LLC
          </p>
        </div>

        {/* Content */}
        <div className="px-8 py-8 space-y-8">
          {/* Why We Need Consent */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              SMS Notifications Are Optional
            </h2>
            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
              <p className="text-green-900 font-semibold">
                ✓ You can use Rural Dispatch services with or without SMS notifications.
              </p>
              <p className="text-green-800 text-sm mt-2">
                Consent to receive text messages is NOT a condition of getting service. Riders can 
                confirm their transportation by phone instead.
              </p>
            </div>
            <p className="text-gray-700 leading-relaxed">
              Rural Dispatch uses SMS to keep you informed about your ride status. This helps us 
              provide you with real-time updates and ensure a smooth ride experience. However, this 
              is completely optional.
            </p>
          </div>

          {/* What You'll Receive */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              What You'll Receive
            </h2>
            <ul className="space-y-3">
              {[
                { title: 'Ride Confirmations', desc: '"Your ride has been accepted"' },
                { title: 'Driver Updates', desc: 'Driver details and pickup location' },
                { title: 'ETA Notifications', desc: 'Estimated arrival times' },
                { title: 'Ride Status', desc: 'Driver arriving, ride in progress, etc.' },
                { title: 'Service Updates', desc: 'Important account and service notifications' }
              ].map((item, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-gray-700">
                    <strong>{item.title}:</strong> {item.desc}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Consent Box */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Your Consent
            </h2>
            
            <div className="flex items-start space-x-3 mb-4">
              <input
                type="checkbox"
                id="consent-sms"
                checked={isChecked}
                onChange={(e) => setIsChecked(e.target.checked)}
                className="mt-1 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
              />
              <label htmlFor="consent-sms" className="text-gray-800 cursor-pointer">
                <strong className="block mb-2">
                  I consent to receive SMS text messages from Rural Dispatch
                </strong>
                <span className="text-sm">
                  at the phone number <strong>{phoneNumber || 'provided in my account'}</strong>. I understand that:
                </span>
                <ul className="mt-2 ml-5 space-y-1 text-sm text-gray-700">
                  <li>• Messages help me track my rides and receive important updates</li>
                  <li>• I can opt-out anytime by replying <strong>STOP</strong></li>
                  <li>• I can get help by replying <strong>HELP</strong></li>
                  <li>• Message & data rates may apply</li>
                  <li>• Consent is not required to use Rural Dispatch services</li>
                </ul>
              </label>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm">
              <span className="font-semibold">📱 Message Frequency:</span> You may receive 1-5 SMS 
              messages per active ride, plus occasional service notifications. Frequency depends on 
              ride activity.
            </div>
          </div>

          {/* Screenshot Info (for verification) */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-600 text-center">
              📸 This opt-in page screenshot is used for SMS carrier verification and compliance with TCPA regulations
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="px-8 pb-8">
          <div className="flex gap-4">
            <button
              onClick={handleDecline}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
            >
              No, thanks
            </button>
            <button
              onClick={handleAgree}
              disabled={!isChecked || loading}
              className={`flex-1 px-6 py-3 font-semibold rounded-lg transition ${
                isChecked && !loading
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {loading ? 'Processing...' : 'I Agree'}
            </button>
          </div>

          <div className="mt-4 text-center">
            <span className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              ✓ TCPA Compliant
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center mb-2">
            By clicking "I Agree," you are providing express written consent to receive SMS messages from Rural Dispatch.
          </p>
          <p className="text-sm text-center space-x-4">
            <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a>
            <span className="text-gray-400">|</span>
            <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>
            <span className="text-gray-400">|</span>
            <a href="/sms" className="text-blue-600 hover:underline">SMS Info</a>
            <span className="text-gray-400">|</span>
            <a href="/sms-terms" className="text-blue-600 hover:underline">SMS Terms</a>
          </p>
          <p className="text-xs text-gray-500 text-center mt-3">
            Timestamp: {timestamp}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SMSConsent;
