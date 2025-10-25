import type { AppProps } from 'next/app';
import { Toaster } from 'react-hot-toast';
import { WalletProvider } from '../components/WalletProvider';
import '../styles/globals.css';
import React from 'react';
import { KycContext } from '../context/KycContext';
import { X } from 'lucide-react';
import { apiService } from '../lib/api';
import { useAccount } from 'wagmi';

export default function App({ Component, pageProps }: AppProps) {
  const [showKycModal, setShowKycModal] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);

  const openKyc = React.useCallback(() => setShowKycModal(true), []);
  const closeKyc = React.useCallback(() => setShowKycModal(false), []);
  const bumpRefreshKey = React.useCallback(() => setRefreshKey(k => k + 1), []);

  return (
    <WalletProvider>
      <KycContext.Provider value={{ openKyc, closeKyc, refreshKey, bumpRefreshKey }}>
        <div className="min-h-screen bg-gray-50">
          <Component {...pageProps} />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                style: {
                  background: '#10B981',
                },
              },
              error: {
                style: {
                  background: '#EF4444',
                },
              },
            }}
          />

          {/* Global KYC modal rendered once for the app */}
          {showKycModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">KYC Application</h2>
                    <button
                      onClick={closeKyc}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  {/* We'll reuse the same form from index.tsx but simpler here: */}
                  <KycForm close={closeKyc} />
                </div>
              </div>
            </div>
          )}
        </div>
      </KycContext.Provider>
    </WalletProvider>
  );
}

function KycForm({ close }: { close: () => void }) {
  const { address, isConnected } = useAccount();
  const [formData, setFormData] = React.useState({ email: '', walletAddress: '' });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState('');
  const { refreshKey: ctxRefreshKey, bumpRefreshKey } = React.useContext(KycContext) as { refreshKey: number; bumpRefreshKey: () => void };

  React.useEffect(() => {
    if (isConnected && address) setFormData(f => ({ ...f, walletAddress: address }));
  }, [isConnected, address]);

  const handleClose = () => {
    setFormData({ email: '', walletAddress: isConnected && address ? address : '' });
    close();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    handleClose();
    setSuccessMessage('KYC submitted');
    try {
      setIsSubmitting(true);
      await apiService.submitKyc(formData.walletAddress, formData.email);
      bumpRefreshKey();
    } catch (err) {
      console.error('KYC submit failed', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Wallet Address</label>
        <input
          type="text"
          value={formData.walletAddress}
          onChange={(e) => setFormData({ ...formData, walletAddress: e.target.value })}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
        />
      </div>
      <div className="flex gap-3 pt-4">
        <button type="button" onClick={handleClose} className="flex-1 px-4 py-2 border rounded-lg">Cancel</button>
        <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg">{isSubmitting ? 'Submitting...' : 'Submit'}</button>
      </div>
    </form>
  );
}
