import { useState, useEffect } from 'react';
import { Users, UserPlus, Check, X, MessageCircle } from 'lucide-react';
import { supabase, Profile, Friendship } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface FriendsPanelProps {
  onOpenDM: (friendId: string) => void;
}

export default function FriendsPanel({ onOpenDM }: FriendsPanelProps) {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'online' | 'all' | 'pending' | 'add'>('all');
  const [friends, setFriends] = useState<(Friendship & { friend_profile?: Profile })[]>([]);
  const [searchUsername, setSearchUsername] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab !== 'add') {
      loadFriends();
    }
  }, [activeTab, profile]);

  async function loadFriends() {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('friendships')
        .select('*, profiles!friendships_friend_id_fkey(*)')
        .or(`user_id.eq.${profile.id},friend_id.eq.${profile.id}`);

      if (error) throw error;

      const friendsData = data?.map(f => ({
        ...f,
        friend_profile: f.user_id === profile.id ? f.profiles : undefined
      })) || [];

      setFriends(friendsData);
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  }

  async function searchUsers() {
    if (!searchUsername.trim() || !profile) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', `%${searchUsername}%`)
        .neq('id', profile.id)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  }

  async function sendFriendRequest(friendId: string) {
    if (!profile) return;

    try {
      const { error } = await supabase.from('friendships').insert({
        user_id: profile.id,
        friend_id: friendId,
        status: 'pending'
      });

      if (error) throw error;
      setSearchResults([]);
      setSearchUsername('');
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  }

  async function acceptFriendRequest(friendshipId: string) {
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', friendshipId);

      if (error) throw error;
      await loadFriends();
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  }

  async function removeFriend(friendshipId: string) {
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);

      if (error) throw error;
      await loadFriends();
    } catch (error) {
      console.error('Error removing friend:', error);
    }
  }

  const pendingRequests = friends.filter(f => f.status === 'pending' && f.friend_id === profile?.id);
  const acceptedFriends = friends.filter(f => f.status === 'accepted');

  return (
    <div className="flex-1 flex flex-col bg-slate-700">
      <div className="h-12 px-4 flex items-center border-b border-slate-600 shadow-md">
        <Users className="w-5 h-5 text-slate-400 mr-2" />
        <h3 className="font-semibold text-white">Friends</h3>
      </div>

      <div className="h-12 px-4 flex items-center gap-4 border-b border-slate-600">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-2 py-1 rounded transition-colors ${
            activeTab === 'all' ? 'bg-slate-600 text-white' : 'text-slate-300 hover:text-white'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-2 py-1 rounded transition-colors ${
            activeTab === 'pending' ? 'bg-slate-600 text-white' : 'text-slate-300 hover:text-white'
          }`}
        >
          Pending {pendingRequests.length > 0 && `(${pendingRequests.length})`}
        </button>
        <button
          onClick={() => setActiveTab('add')}
          className={`px-2 py-1 rounded transition-colors ${
            activeTab === 'add' ? 'bg-green-600 text-white' : 'bg-green-600/80 text-white hover:bg-green-600'
          }`}
        >
          Add Friend
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'add' && (
          <div className="space-y-4">
            <div>
              <h4 className="text-white font-semibold mb-2">Add Friend</h4>
              <p className="text-slate-400 text-sm mb-4">
                You can add friends by their username
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchUsername}
                  onChange={(e) => setSearchUsername(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
                  placeholder="Enter username"
                  className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={searchUsers}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  Search
                </button>
              </div>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center text-white font-semibold">
                        {user.username.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{user.display_name || user.username}</p>
                        <p className="text-sm text-slate-400">@{user.username}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => sendFriendRequest(user.id)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      Add Friend
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'pending' && (
          <div className="space-y-2">
            {pendingRequests.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No pending requests</p>
            ) : (
              pendingRequests.map((friendship) => (
                <div key={friendship.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center text-white font-semibold">
                      {friendship.friend_profile?.username?.substring(0, 2).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="font-semibold text-white">
                        {friendship.friend_profile?.display_name || friendship.friend_profile?.username}
                      </p>
                      <p className="text-sm text-slate-400">Incoming Friend Request</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => acceptFriendRequest(friendship.id)}
                      className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                      title="Accept"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeFriend(friendship.id)}
                      className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                      title="Decline"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'all' && (
          <div className="space-y-2">
            {acceptedFriends.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No friends yet</p>
            ) : (
              acceptedFriends.map((friendship) => {
                const friend = friendship.user_id === profile?.id
                  ? friendship.profiles
                  : friendship.friend_profile;

                return (
                  <div key={friendship.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg hover:bg-slate-750 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center text-white font-semibold">
                        {friend?.username?.substring(0, 2).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{friend?.display_name || friend?.username}</p>
                        <p className="text-sm text-slate-400">@{friend?.username}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => friend && onOpenDM(friend.id)}
                        className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                        title="Message"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeFriend(friendship.id)}
                        className="p-2 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-lg transition-colors"
                        title="Remove Friend"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
