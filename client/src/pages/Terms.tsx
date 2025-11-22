import { Link } from 'react-router-dom';

const Terms = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-8">Last Updated: November 13, 2025</p>

        <div className="prose prose-blue max-w-none space-y-6 text-gray-700">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p>
              Welcome to SWARM LLC. By accessing or using our ride-sharing services, you agree to be
              bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please
              do not use our services.
            </p>
            <p>
              SWARM LLC operates the Rural Dispatch service from New York City, NY. These Terms
              constitute a legally binding agreement between you and SWARM LLC.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
            <p>
              SWARM LLC provides a platform that connects riders with qualified drivers for
              transportation services. Our services include:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Ride request and booking functionality</li>
              <li>Driver assignment and coordination</li>
              <li>Real-time ride tracking and status updates</li>
              <li>SMS notifications (with user consent)</li>
              <li>Ride history and management</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              3. User Accounts and Registration
            </h2>
            <p>To use our services, you must:</p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Be at least 18 years of age</li>
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Promptly update your account information as needed</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. User Responsibilities</h2>
            <p>As a user of our services, you agree to:</p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Provide accurate pickup and destination information</li>
              <li>Be ready at the designated pickup location at the scheduled time</li>
              <li>Treat drivers, vehicles, and other users with respect</li>
              <li>Comply with all applicable laws and regulations</li>
              <li>Not use the service for any illegal or unauthorized purpose</li>
              <li>Not interfere with or disrupt the service or servers</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Driver Requirements</h2>
            <p>Service providers (drivers) must:</p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Possess a valid driver's license</li>
              <li>Maintain appropriate vehicle insurance</li>
              <li>Keep their vehicle in safe operating condition</li>
              <li>Comply with all traffic laws and regulations</li>
              <li>Provide safe and courteous service to riders</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Payment and Fees</h2>
            <p>
              Payment terms and fee structures are provided at the time of booking. By requesting a
              ride, you agree to pay all applicable fees. SWARM LLC reserves the right to modify
              fees at any time.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Cancellation Policy</h2>
            <p>
              Rides may be cancelled by either riders or drivers. Cancellation fees may apply
              depending on the timing and circumstances. You will be notified of any applicable
              cancellation fees before confirming the cancellation.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. SMS Communications</h2>
            <p>
              By providing your phone number, you may receive SMS notifications about your rides.
              SMS consent is optional and not required to use our services. You can opt-out at any
              time by replying STOP or visiting our{' '}
              <Link to="/sms-opt-out" className="text-blue-600 hover:underline">
                SMS opt-out page
              </Link>
              . See our{' '}
              <Link to="/sms-terms" className="text-blue-600 hover:underline">
                SMS Terms
              </Link>{' '}
              for more details.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Privacy and Data</h2>
            <p>
              Your use of our services is subject to our{' '}
              <Link to="/privacy" className="text-blue-600 hover:underline">
                Privacy Policy
              </Link>
              . We collect and store user data on secure servers hosted by Render.com with MongoDB
              database storage. We are committed to protecting your personal information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              10. Limitation of Liability
            </h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, SWARM LLC SHALL NOT BE LIABLE FOR ANY
              INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF
              PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA,
              USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
            </p>
            <p>
              SWARM LLC acts as a platform connecting riders and drivers. We are not responsible for
              the actions of drivers or riders, and you use the service at your own risk.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless SWARM LLC, its affiliates, officers,
              directors, employees, and agents from any claims, damages, losses, liabilities, and
              expenses (including attorneys' fees) arising from your use of the service or violation
              of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Intellectual Property</h2>
            <p>
              All content, features, and functionality of our services, including but not limited to
              text, graphics, logos, and software, are owned by SWARM LLC and protected by
              copyright, trademark, and other intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              13. Modifications to Service
            </h2>
            <p>
              SWARM LLC reserves the right to modify, suspend, or discontinue any part of the
              service at any time without notice. We are not liable to you or any third party for
              any modification, suspension, or discontinuation of the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Termination</h2>
            <p>
              We may terminate or suspend your access to our services immediately, without prior
              notice or liability, for any reason, including breach of these Terms. Upon
              termination, your right to use the service will immediately cease.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the
              State of New York, without regard to its conflict of law provisions. Any disputes
              arising from these Terms or your use of our services shall be subject to the exclusive
              jurisdiction of the courts located in New York County, New York.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">16. Changes to Terms</h2>
            <p>
              We reserve the right to update or modify these Terms at any time. We will notify you
              of any material changes by posting the new Terms on this page and updating the "Last
              Updated" date. Your continued use of our services after any changes constitutes
              acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">17. Contact Information</h2>
            <p>If you have any questions about these Terms, please contact us at:</p>
            <div className="bg-gray-50 p-4 rounded-lg mt-3">
              <p className="font-semibold">SWARM LLC</p>
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

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">18. Severability</h2>
            <p>
              If any provision of these Terms is found to be unenforceable or invalid, that
              provision will be limited or eliminated to the minimum extent necessary, and the
              remaining provisions will remain in full force and effect.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">19. Entire Agreement</h2>
            <p>
              These Terms, together with our Privacy Policy and SMS Terms, constitute the entire
              agreement between you and SWARM LLC regarding the use of our services and supersede
              all prior agreements.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-200">
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/privacy" className="text-blue-600 hover:underline">
              Privacy Policy
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

export default Terms;
