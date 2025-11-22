import { Link } from 'react-router-dom';

const Privacy = () => {
  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last Updated: November 13, 2025</p>

        <div className="prose prose-blue max-w-none space-y-6 text-gray-700">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
            <p>
              SWARM LLC ("we," "our," or "us") operates the Rural Dispatch service and is committed
              to protecting your privacy. This Privacy Policy explains how we collect, use,
              disclose, and safeguard your information when you use our ride-sharing services.
            </p>
            <p>
              By using our services, you agree to the collection and use of information in
              accordance with this policy. If you do not agree with our policies and practices,
              please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-4">
              2.1 Personal Information
            </h3>
            <p>We collect personal information that you provide directly to us, including:</p>
            <ul className="list-disc ml-6 space-y-2">
              <li>
                <strong>Account Information:</strong> Full name, phone number, date of birth
              </li>
              <li>
                <strong>Demographic Information:</strong> Race, marital status, income, residence
                (optional)
              </li>
              <li>
                <strong>Role Information:</strong> User role (rider, caregiver, relative, guardian,
                case manager)
              </li>
              <li>
                <strong>Status Information:</strong> Veteran status, disability status (optional)
              </li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-4">2.2 Ride Information</h3>
            <ul className="list-disc ml-6 space-y-2">
              <li>Pickup and destination addresses</li>
              <li>Ride requests and booking details</li>
              <li>Driver assignments and vehicle information</li>
              <li>Ride status and completion data</li>
              <li>Ride history and timestamps</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-4">
              2.3 Communication Data
            </h3>
            <ul className="list-disc ml-6 space-y-2">
              <li>SMS messages (when you opt-in to notifications)</li>
              <li>Message delivery status and timestamps</li>
              <li>Communication preferences</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-4">
              2.4 Technical Information
            </h3>
            <ul className="list-disc ml-6 space-y-2">
              <li>IP address</li>
              <li>Browser type and version</li>
              <li>Device information</li>
              <li>Access times and usage patterns</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              3. How We Use Your Information
            </h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc ml-6 space-y-2">
              <li>
                <strong>Provide Services:</strong> Facilitate ride requests, match riders with
                drivers, and manage bookings
              </li>
              <li>
                <strong>Communications:</strong> Send ride confirmations, driver updates, and status
                notifications via SMS (with consent)
              </li>
              <li>
                <strong>Improve Services:</strong> Analyze usage patterns to enhance user experience
                and service quality
              </li>
              <li>
                <strong>Safety:</strong> Verify identities, prevent fraud, and ensure platform
                safety
              </li>
              <li>
                <strong>Compliance:</strong> Meet legal and regulatory requirements
              </li>
              <li>
                <strong>Customer Support:</strong> Respond to inquiries and resolve issues
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              4. How We Share Your Information
            </h2>
            <p>We may share your information with:</p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-4">4.1 Service Providers</h3>
            <ul className="list-disc ml-6 space-y-2">
              <li>
                <strong>Drivers:</strong> We share your name, phone number, and ride details with
                assigned drivers
              </li>
              <li>
                <strong>Technology Providers:</strong>
                <ul className="list-circle ml-6 mt-2">
                  <li>Render.com (hosting services)</li>
                  <li>MongoDB (database storage)</li>
                  <li>Twilio (SMS delivery)</li>
                </ul>
              </li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-4">
              4.2 Legal Requirements
            </h3>
            <p>
              We may disclose your information if required by law, court order, or government
              request.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-4">
              4.3 Business Transfers
            </h3>
            <p>
              In the event of a merger, acquisition, or sale of assets, your information may be
              transferred to the acquiring entity.
            </p>

            <p className="mt-4 font-semibold">
              We do NOT sell your personal information to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              5. Data Storage and Security
            </h2>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-4">
              5.1 Where We Store Data
            </h3>
            <p>Your data is stored securely using:</p>
            <ul className="list-disc ml-6 space-y-2">
              <li>
                <strong>Hosting:</strong> Render.com cloud infrastructure
              </li>
              <li>
                <strong>Database:</strong> MongoDB Atlas (encrypted at rest)
              </li>
              <li>
                <strong>Location:</strong> Data centers in the United States
              </li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-4">5.2 Security Measures</h3>
            <p>We implement industry-standard security measures including:</p>
            <ul className="list-disc ml-6 space-y-2">
              <li>TLS/SSL encryption for data in transit</li>
              <li>Encrypted database storage</li>
              <li>Secure authentication and access controls</li>
              <li>Regular security monitoring and updates</li>
            </ul>

            <p className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 text-sm">
              <strong>⚠️ Important:</strong> No method of transmission or storage is 100% secure.
              While we strive to protect your information, we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              6. SMS Communications and Privacy
            </h2>
            <p>When you opt-in to SMS notifications:</p>
            <ul className="list-disc ml-6 space-y-2">
              <li>We collect and store your phone number and consent timestamp</li>
              <li>We send ride-related notifications via Twilio</li>
              <li>Message content includes ride details, driver information, and status updates</li>
              <li>
                You can opt-out anytime by replying STOP or visiting our{' '}
                <Link to="/sms-opt-out" className="text-blue-600 hover:underline">
                  opt-out page
                </Link>
              </li>
              <li>Your phone number is not shared with third parties for marketing</li>
            </ul>
            <p className="mt-3">
              See our{' '}
              <Link to="/sms-terms" className="text-blue-600 hover:underline">
                SMS Terms
              </Link>{' '}
              for complete details.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Your Privacy Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc ml-6 space-y-2">
              <li>
                <strong>Access:</strong> Request a copy of your personal information
              </li>
              <li>
                <strong>Correction:</strong> Update or correct inaccurate information
              </li>
              <li>
                <strong>Deletion:</strong> Request deletion of your account and data
              </li>
              <li>
                <strong>Opt-Out:</strong> Unsubscribe from SMS notifications at any time
              </li>
              <li>
                <strong>Data Portability:</strong> Request your data in a portable format
              </li>
            </ul>

            <p className="mt-4">
              To exercise these rights, contact us at hello@swarmnyc.com or call +1 (831) 325-1472.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Data Retention</h2>
            <p>We retain your personal information for as long as necessary to:</p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Provide our services to you</li>
              <li>Comply with legal obligations</li>
              <li>Resolve disputes and enforce agreements</li>
            </ul>
            <p className="mt-3">
              Ride history and SMS records are retained for 7 years for compliance purposes. You may
              request earlier deletion by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Children's Privacy</h2>
            <p>
              Our services are not intended for users under 18 years of age. We do not knowingly
              collect personal information from children. If you believe we have collected
              information from a child, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Cookies and Tracking</h2>
            <p>
              We may use cookies and similar tracking technologies to enhance your experience. You
              can control cookie settings through your browser preferences.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Third-Party Links</h2>
            <p>
              Our service may contain links to third-party websites. We are not responsible for the
              privacy practices of these sites. We encourage you to review their privacy policies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              12. California Privacy Rights
            </h2>
            <p>
              California residents have additional rights under the California Consumer Privacy Act
              (CCPA), including the right to know what personal information we collect and how it's
              used.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              13. Changes to Privacy Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material
              changes by:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Posting the updated policy on this page</li>
              <li>Updating the "Last Updated" date</li>
              <li>Sending an email or SMS notification (for significant changes)</li>
            </ul>
            <p className="mt-3">
              Your continued use of our services after changes constitutes acceptance of the updated
              policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or our data practices, please contact
              us:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mt-3">
              <p className="font-semibold">SWARM LLC - Privacy Team</p>
              <p>333 Hudson St</p>
              <p>New York, NY 10013</p>
              <p>
                Phone:{' '}
                <a href="tel:+18313251472" className="text-blue-600 hover:underline">
                  +1 (831) 325-1472
                </a>
              </p>
              <p>
                SMS Support:{' '}
                <a href="tel:+18313251472" className="text-blue-600 hover:underline">
                  +1 (831) 325-1472
                </a>
              </p>
            </div>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-200">
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/terms" className="text-blue-600 hover:underline">
              Terms of Service
            </Link>
            <Link to="/sms" className="text-blue-600 hover:underline">
              SMS Notifications
            </Link>
            <Link to="/sms-terms" className="text-blue-600 hover:underline">
              SMS Terms
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
