import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-gray-300 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About */}
          <div>
            <h3 className="text-white font-semibold mb-3">SWARM LLC</h3>
            <p className="text-sm text-gray-400">
              Providing reliable transportation services to help you get where you need to go.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-3">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-white transition">
                  Request a Ride
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-white transition">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/service-provider" className="hover:text-white transition">
                  For Drivers
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & SMS */}
          <div>
            <h3 className="text-white font-semibold mb-3">Legal & Privacy</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/terms" className="hover:text-white transition">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="/privacy" className="hover:text-white transition">
                  Privacy Policy
                </a>
              </li>
              <li>
                <Link to="/sms" className="hover:text-white transition">
                  SMS Notifications
                </Link>
              </li>
              <li>
                <Link to="/sms-consent" className="hover:text-white transition">
                  Opt In to SMS
                </Link>
              </li>
              <li>
                <Link to="/sms-opt-out" className="hover:text-white transition">
                  Opt Out of SMS
                </Link>
              </li>
              <li>
                <a href="/sms-terms" className="hover:text-white transition">
                  SMS Terms
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 mt-8 pt-6">
          <div className="text-center space-y-3">
            <p className="text-gray-400 text-sm">
              © {currentYear} SWARM LLC. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
