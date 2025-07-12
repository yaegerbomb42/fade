import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../AppIcon';

const ReportModal = ({ isOpen, onClose, username }) => {
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const { reportUser } = useAuth();

  if (!isOpen || !username) return null;

  const reportReasons = [
    'Spam or unwanted messages',
    'Harassment or bullying',
    'Inappropriate content',
    'Hate speech',
    'Impersonation',
    'Other'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const finalReason = reason === 'Other' ? customReason : reason;
      await reportUser(username, finalReason);
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setReason('');
        setCustomReason('');
      }, 2000);
    } catch (error) {
      console.error('Error reporting user:', error);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="glass-panel w-full max-w-md mx-auto p-6 text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="check" className="w-8 h-8 text-green-400" />
          </div>
          <h3 className="text-xl font-bold text-text-primary mb-2">Report Submitted</h3>
          <p className="text-text-secondary">
            Thank you for helping keep our community safe. We'll review this report.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-panel w-full max-w-md mx-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-text-primary">Report User</h2>
            <button
              onClick={onClose}
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              <Icon name="x" className="w-6 h-6" />
            </button>
          </div>

          <div className="mb-6">
            <p className="text-text-secondary mb-2">
              Reporting: <span className="font-bold text-text-primary">@{username}</span>
            </p>
            <p className="text-sm text-text-secondary">
              Reports help us maintain a safe and respectful community. False reports may result in restrictions on your account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-3">
                Reason for reporting:
              </label>
              <div className="space-y-2">
                {reportReasons.map((reportReason) => (
                  <label key={reportReason} className="flex items-center glass-panel p-3 hover:bg-glass-surface/60 transition-all cursor-pointer">
                    <input
                      type="radio"
                      value={reportReason}
                      checked={reason === reportReason}
                      onChange={(e) => setReason(e.target.value)}
                      className="mr-3 text-red-400 focus:ring-red-400"
                      required
                    />
                    <span className="text-text-primary">{reportReason}</span>
                  </label>
                ))}
              </div>
            </div>

            {reason === 'Other' && (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Please specify:
                </label>
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="w-full px-4 py-3 glass-panel bg-glass-surface/80 border-glass-border text-text-primary placeholder-text-secondary focus:outline-none focus:border-primary/50 transition-all resize-none rounded-lg"
                  rows={3}
                  placeholder="Describe the issue..."
                  required
                  maxLength={200}
                />
                <p className="text-xs text-text-secondary mt-1">
                  {customReason.length}/200 characters
                </p>
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 glass-button py-3 px-4 hover:bg-glass-surface/60 text-text-primary font-medium transition-all duration-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !reason || (reason === 'Other' && !customReason.trim())}
                className="flex-1 glass-button py-3 px-4 bg-red-500/20 hover:bg-red-500/30 text-red-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                {loading ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
