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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="check" className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Report Submitted</h3>
          <p className="text-gray-600">
            Thank you for helping keep our community safe. We'll review this report.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Report User</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Icon name="x" className="w-6 h-6" />
            </button>
          </div>

          <div className="mb-6">
            <p className="text-gray-600 mb-2">
              Reporting: <span className="font-bold text-gray-900">@{username}</span>
            </p>
            <p className="text-sm text-gray-500">
              Reports help us maintain a safe and respectful community. False reports may result in restrictions on your account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Reason for reporting:
              </label>
              <div className="space-y-2">
                {reportReasons.map((reportReason) => (
                  <label key={reportReason} className="flex items-center">
                    <input
                      type="radio"
                      value={reportReason}
                      checked={reason === reportReason}
                      onChange={(e) => setReason(e.target.value)}
                      className="mr-3 text-red-600 focus:ring-red-500"
                      required
                    />
                    <span className="text-gray-700">{reportReason}</span>
                  </label>
                ))}
              </div>
            </div>

            {reason === 'Other' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Please specify:
                </label>
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all resize-none"
                  rows={3}
                  placeholder="Describe the issue..."
                  required
                  maxLength={200}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {customReason.length}/200 characters
                </p>
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !reason || (reason === 'Other' && !customReason.trim())}
                className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
