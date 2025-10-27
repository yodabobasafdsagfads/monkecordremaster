import { useState, useEffect } from 'react';
import { X, Trash2, Shield, Users, MessageSquare, Server as ServerIcon } from 'lucide-react';
import { supabase, Profile, Server } from '../lib/supabase';

interface AdminPanelProps {
  onClose: () => void;
}

interface Stats {
  totalUsers: number;
  totalServers: number;
  totalMessages: number;
}

export default function AdminPanel({ onClose }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'servers'>('overview');
  const [users, setUsers] = useState<Profile[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalServers: 0, totalMessages: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [usersRes, serversRes, messagesRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('servers').select('*').order('created_at', { ascending: false }),
        supabase.from('messages').select('id', { count: 'exact', head: true }),
      ]);

      if (usersRes.data) setUsers(usersRes.data);
      if (serversRes.data) setServers(serversRes.data);

      setStats({
        totalUsers: usersRes.data?.length || 0,
        totalServers: serversRes.data?.length || 0,
        totalMessages: messagesRes.count || 0,
      });
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function deleteUser(userId: string) {
    if (!confirm('Are you sure you want to delete this user? This cannot be undone.')) return;

    try {
      const { error } = await supabase.from('profiles').delete().eq('id', userId);
      if (error) throw error;
      await loadData();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  }

  async function deleteServer(serverId: string) {
    if (!confirm('Are you sure you want to delete this server? This cannot be undone.')) return;

    try {
      const { error } = await supabase.from('servers').delete().eq('id', serverId);
      if (error) throw error;
      await loadData();
    } catch (error) {
      console.error('Error deleting server:', error);
      alert('Failed to delete server');
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-xl w-full max-w-4xl h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-amber-500" />
            <h2 className="text-2xl font-bold text-white">Admin Panel</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-slate-700">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'overview'
                ? 'text-white border-b-2 border-amber-500'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'users'
                ? 'text-white border-b-2 border-amber-500'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab('servers')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'servers'
                ? 'text-white border-b-2 border-amber-500'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Servers
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-slate-400">Loading...</div>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-slate-900 rounded-lg p-6 border border-slate-700">
                    <div className="flex items-center gap-3 mb-2">
                      <Users className="w-8 h-8 text-blue-500" />
                      <h3 className="text-lg font-semibold text-white">Total Users</h3>
                    </div>
                    <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
                  </div>

                  <div className="bg-slate-900 rounded-lg p-6 border border-slate-700">
                    <div className="flex items-center gap-3 mb-2">
                      <ServerIcon className="w-8 h-8 text-green-500" />
                      <h3 className="text-lg font-semibold text-white">Total Servers</h3>
                    </div>
                    <p className="text-3xl font-bold text-white">{stats.totalServers}</p>
                  </div>

                  <div className="bg-slate-900 rounded-lg p-6 border border-slate-700">
                    <div className="flex items-center gap-3 mb-2">
                      <MessageSquare className="w-8 h-8 text-purple-500" />
                      <h3 className="text-lg font-semibold text-white">Total Messages</h3>
                    </div>
                    <p className="text-3xl font-bold text-white">{stats.totalMessages}</p>
                  </div>
                </div>
              )}

              {activeTab === 'users' && (
                <div className="space-y-3">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="bg-slate-900 rounded-lg p-4 border border-slate-700 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-white font-semibold">
                          {user.username.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-white">{user.display_name || user.username}</h4>
                            {user.is_owner && (
                              <span className="text-xs bg-amber-600 text-white px-2 py-1 rounded">
                                OWNER
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-400">@{user.username}</p>
                          <p className="text-xs text-slate-500">
                            Joined {new Date(user.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {!user.is_owner && (
                        <button
                          onClick={() => deleteUser(user.id)}
                          className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {users.length === 0 && (
                    <p className="text-slate-400 text-center py-8">No users found</p>
                  )}
                </div>
              )}

              {activeTab === 'servers' && (
                <div className="space-y-3">
                  {servers.map((server) => (
                    <div
                      key={server.id}
                      className="bg-slate-900 rounded-lg p-4 border border-slate-700 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center text-white font-semibold">
                          {server.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-semibold text-white">{server.name}</h4>
                          <p className="text-xs text-slate-500">
                            Created {new Date(server.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteServer(server.id)}
                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete Server"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {servers.length === 0 && (
                    <p className="text-slate-400 text-center py-8">No servers found</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
