import { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { Server } from '../lib/supabase';

interface ServerSettingsModalProps {
  server: Server;
  onClose: () => void;
  onDelete: () => Promise<void>;
}

export default function ServerSettingsModal({ server, onClose, onDelete }: ServerSettingsModalProps) {
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      await onDelete();
      onClose();
    } catch (error) {
      console.error('Error deleting server:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">Server Settings</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Server Name
            </label>
            <input
              type="text"
              value={server.name}
              disabled
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-700">
            <h3 className="text-sm font-medium text-red-400 mb-3">Danger Zone</h3>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-600/50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete Server
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-slate-300">
                  Are you sure? This will permanently delete the server and all its channels and messages.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
