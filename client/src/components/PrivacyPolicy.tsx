import React from 'react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
      <p className="mb-2">Effective Date: [Insert Date]</p>
      <p className="mb-4">
        Chum AI (“we”, “us”) respects your privacy. This policy explains how we collect, use, and protect your information when you use our website and services.
      </p>
      <h2 className="text-2xl font-semibold mb-2">1. Information Collection</h2>
      <ul className="list-disc pl-6 mb-4">
        <li><strong>Personal Data:</strong> Information you provide such as your name, email address, and other contact details.</li>
        <li><strong>Usage Data:</strong> Automatically collected details like IP address, browser type, pages visited, and time spent.</li>
        <li><strong>Cookies:</strong> We use cookies to improve your experience. Disabling cookies may affect site functionality.</li>
      </ul>
      <h2 className="text-2xl font-semibold mb-2">2. Use of Information</h2>
      <ul className="list-disc pl-6 mb-4">
        <li>Operate and improve our services.</li>
        <li>Communicate updates and relevant information.</li>
        <li>Enhance security and prevent fraud.</li>
      </ul>
      <h2 className="text-2xl font-semibold mb-2">3. Data Sharing</h2>
      <ul className="list-disc pl-6 mb-4">
        <li><strong>Service Providers:</strong> Trusted partners assisting with our operations.</li>
        <li><strong>Legal Authorities:</strong> As required by law or to protect our rights.</li>
        <li><strong>Business Transactions:</strong> In connection with mergers, acquisitions, or asset transfers.</li>
      </ul>
      <h2 className="text-2xl font-semibold mb-2">4. Data Security</h2>
      <p className="mb-4">
        We employ reasonable measures to protect your information, though no online system is completely secure.
      </p>
      <h2 className="text-2xl font-semibold mb-2">5. Your Rights</h2>
      <p className="mb-4">
        Depending on applicable laws, you may have rights to access, correct, or delete your personal data, among other rights.
      </p>
      <h2 className="text-2xl font-semibold mb-2">6. Third-Party Links</h2>
      <p className="mb-4">
        Our website may include links to external sites not governed by this policy. Please review their privacy policies.
      </p>
      <h2 className="text-2xl font-semibold mb-2">7. Policy Updates</h2>
      <p className="mb-4">
        We may update this policy periodically. Changes will be posted here with a new effective date.
      </p>
      <h2 className="text-2xl font-semibold mb-2">8. Contact Us</h2>
      <p>
        For any questions, please contact us at:
        <br />
        Chum AI
        <br />
        [Your Email Address] | [Your Phone Number] | [Your Physical Address]
      </p>
    </div>
  );
};

export default PrivacyPolicy;
