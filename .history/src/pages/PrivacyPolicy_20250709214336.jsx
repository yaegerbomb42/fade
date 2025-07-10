// src/pages/PrivacyPolicy.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/AppIcon';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-secondary/20"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/5 to-transparent"></div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl privacy-policy-container">
        {/* Header */}
        <div className="glass-panel p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/')}
              className="glass-button px-4 py-2 flex items-center gap-2 text-text-secondary hover:text-text-primary"
            >
              <Icon name="ArrowLeft" size={16} />
              Back to Chat
            </button>
            <div className="text-xs text-text-secondary">
              Last Updated: December 18, 2024
            </div>
          </div>
          <h1 className="text-3xl font-bold text-center text-text-primary mb-2">
            Privacy Policy
          </h1>
          <p className="text-center text-text-secondary">
            How FADE protects and uses your information
          </p>
        </div>

        {/* Content */}
        <div className="glass-panel p-8 space-y-8 privacy-policy-content">
          {/* Introduction */}
          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Icon name="Info" size={20} className="text-accent" />
              Introduction
            </h2>
            <div className="space-y-3 text-text-secondary leading-relaxed">
              <p>
                This Privacy Policy explains how FADE (ourfade.com) collects, uses, and protects your information when you use our ephemeral chat platform.
              </p>
              <p>
                We adhere to applicable privacy laws including GDPR and CCPA, ensuring your data is handled responsibly and transparently.
              </p>
            </div>
          </section>

          {/* Information Collection */}
          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Icon name="Database" size={20} className="text-accent" />
              Information We Collect
            </h2>
            <div className="space-y-3 text-text-secondary leading-relaxed">
              <p>We may collect the following information when you use FADE:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Usernames and display names you choose</li>
                <li>Messages you send in chat channels (temporarily stored)</li>
                <li>IP addresses and device information for security and ad targeting</li>
                <li>Usage analytics and interaction data</li>
                <li>Cookie preferences and settings</li>
                <li>Advertising interaction data (clicks, views, preferences)</li>
                <li>Browser type and settings for ad optimization</li>
              </ul>
              <p className="text-sm italic">
                Note: All chat messages are ephemeral and automatically deleted after a short period.
              </p>
            </div>
          </section>

          {/* Use of Information */}
          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Icon name="Settings" size={20} className="text-accent" />
              How We Use Your Information
            </h2>
            <div className="space-y-3 text-text-secondary leading-relaxed">
              <p>We use collected data to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Operate and maintain the chat platform</li>
                <li>Display real-time messages and user interactions</li>
                <li>Prevent spam and abuse through cooldown systems</li>
                <li>Calculate statistics like "Top Vibes" and "Top Vibers"</li>
                <li>Improve user experience and platform performance</li>
                <li>Serve relevant advertisements through third-party networks</li>
                <li>Personalize advertising content based on your interests</li>
                <li>Measure advertising effectiveness and engagement</li>
              </ul>
              <p className="font-medium text-text-primary">
                We do not sell your personal data to third parties.
              </p>
            </div>
          </section>

          {/* Advertising */}
          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Icon name="Monitor" size={20} className="text-accent" />
              Advertising and Third-Party Services
            </h2>
            <div className="space-y-4 text-text-secondary leading-relaxed">
              <p>
                FADE displays advertisements through trusted third-party advertising networks to support our free service. These ads are contained within designated areas of our platform.
              </p>
              
              <div className="glass-panel p-4 bg-glass-surface/30">
                <h3 className="font-semibold text-text-primary mb-3">Our Advertising Partners:</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-text-primary">Adsterra</h4>
                    <p className="text-sm">Provides native banner advertisements displayed in a contained area below the chat interface.</p>
                    <a href="https://adsterra.com/privacy-policy/" target="_blank" rel="noopener noreferrer" 
                       className="text-accent hover:text-accent/80 underline text-xs">
                      View Adsterra Privacy Policy
                    </a>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-text-primary">Monetag</h4>
                    <p className="text-sm">Provides advertising services and uses a service worker for ad delivery verification.</p>
                    <a href="https://monetag.com/privacy-policy/" target="_blank" rel="noopener noreferrer" 
                       className="text-accent hover:text-accent/80 underline text-xs">
                      View Monetag Privacy Policy
                    </a>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-text-primary">Social Bar</h4>
                    <p className="text-sm">Small social media widgets displayed in the bottom-left corner of the interface.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-text-primary">What These Services May Collect:</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>IP address and approximate location (for geo-targeting)</li>
                  <li>Browser type, version, and settings</li>
                  <li>Device information (screen size, operating system)</li>
                  <li>Advertising interaction data (clicks, views, time spent)</li>
                  <li>Cookies and tracking pixels for ad personalization</li>
                  <li>Referrer information and browsing patterns</li>
                </ul>
              </div>

              <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
                <h3 className="font-semibold text-warning mb-2 flex items-center gap-2">
                  <Icon name="AlertTriangle" size={16} />
                  Important Ad Information:
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>We implement strict ad containment to prevent malicious or inappropriate content</li>
                  <li>Our ads are displayed only in designated areas and cannot overlap chat content</li>
                  <li>We automatically block unauthorized popups and overlays</li>
                  <li>Third-party advertisers may use cookies to track your interests across websites</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-text-primary">Your Advertising Choices:</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>You can opt out of personalized advertising through your browser settings</li>
                  <li>Use ad blockers to prevent ads (though this may affect site functionality)</li>
                  <li>Adjust cookie preferences to limit tracking</li>
                  <li>Visit the Digital Advertising Alliance opt-out page for more options</li>
                </ul>
                <p className="text-sm italic">
                  Note: Opting out of personalized ads does not eliminate all advertising, but makes ads less relevant to your interests.
                </p>
              </div>
            </div>
          </section>

          {/* Data Sharing */}
          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Icon name="Share2" size={20} className="text-accent" />
              Data Sharing
            </h2>
            <div className="space-y-3 text-text-secondary leading-relaxed">
              <p>We may share data with:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Analytics providers to understand platform usage</li>
                <li>Advertising networks (Adsterra, Monetag) for relevant ad delivery</li>
                <li>Third-party social media platforms through embedded widgets</li>
                <li>Security services to prevent abuse and spam</li>
                <li>Legal authorities when required by law</li>
                <li>Service providers who assist in platform operations</li>
              </ul>
              <div className="bg-info/10 border border-info/30 rounded-lg p-4 mt-4">
                <p className="font-medium text-info mb-2">Data Shared with Advertising Partners:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Anonymized usage patterns and demographics</li>
                  <li>Ad performance metrics (views, clicks, engagement)</li>
                  <li>Technical information (browser, device type, screen resolution)</li>
                  <li>Geographic location (country/region level only)</li>
                </ul>
              </div>
              <p>
                You can opt out of personalized advertising through your browser settings, ad network preferences, or by using ad blocking software.
              </p>
            </div>
          </section>

          {/* Cookies and Tracking */}
          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Icon name="Cookie" size={20} className="text-accent" />
              Cookies and Tracking
            </h2>
            <div className="space-y-3 text-text-secondary leading-relaxed">
              <p>
                We use cookies and similar technologies to enhance functionality and track usage, including:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Remembering your nickname and preferences</li>
                <li>Maintaining profanity filter settings</li>
                <li>Analytics and performance monitoring</li>
                <li>Ad performance tracking</li>
              </ul>
              <p>
                You can manage cookies through your browser preferences, though this may affect site functionality.
              </p>
            </div>
          </section>

          {/* Security */}
          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Icon name="Shield" size={20} className="text-accent" />
              Security
            </h2>
            <div className="space-y-3 text-text-secondary leading-relaxed">
              <p>
                We implement appropriate technical and organizational measures to protect your data, including:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Encrypted data transmission (HTTPS)</li>
                <li>Secure database storage</li>
                <li>Regular security assessments</li>
                <li>Access controls and monitoring</li>
              </ul>
              <p className="text-sm italic">
                While we strive to protect your information, no online system is 100% secure.
              </p>
            </div>
          </section>

          {/* User Rights */}
          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Icon name="User" size={20} className="text-accent" />
              Your Rights
            </h2>
            <div className="space-y-3 text-text-secondary leading-relaxed">
              <p>You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Access the personal data we hold about you</li>
                <li>Request correction of inaccurate information</li>
                <li>Request deletion of your data</li>
                <li>Object to processing of your data</li>
                <li>Data portability where applicable</li>
              </ul>
              <p>
                To exercise these rights, contact us at{' '}
                <a 
                  href="mailto:ourfade@outlook.com" 
                  className="text-accent hover:text-accent/80 underline"
                >
                  ourfade@outlook.com
                </a>
              </p>
              <p className="font-medium text-warning">
                Age Requirement: This platform is not intended for users under 13 years old.
              </p>
            </div>
          </section>

          {/* Changes to Policy */}
          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Icon name="FileText" size={20} className="text-accent" />
              Changes to This Policy
            </h2>
            <div className="space-y-3 text-text-secondary leading-relaxed">
              <p>
                We may update this privacy policy from time to time. Changes will be posted on this page with an updated "Last Updated" date.
              </p>
              <p>
                We encourage you to review this policy periodically to stay informed about how we protect your information.
              </p>
            </div>
          </section>

          {/* Contact Information */}
          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Icon name="Mail" size={20} className="text-accent" />
              Contact Us
            </h2>
            <div className="space-y-3 text-text-secondary leading-relaxed">
              <p>
                If you have questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="glass-panel p-4 bg-glass-surface/30">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="Mail" size={16} className="text-accent" />
                  <span className="font-medium">Email:</span>
                </div>
                <a 
                  href="mailto:ourfade@outlook.com" 
                  className="text-accent hover:text-accent/80 underline block"
                >
                  ourfade@outlook.com
                </a>
              </div>
              <p className="text-sm">
                We aim to respond to all privacy-related inquiries within 48 hours.
              </p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-text-secondary">
          <p>© 2025 FADE. All rights reserved.</p>
          <p className="mt-1">
            Made with 💜 by yaeger
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
