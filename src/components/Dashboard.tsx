import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Server, Channel, ServerMember } from '../lib/supabase';
import ServerBar from './ServerBar';
import ChannelSidebar from './ChannelSidebar';
import ChatArea from './ChatArea';
import CreateServerModal from './CreateServerModal';
import CreateChannelModal from './CreateChannelModal';
import ServerSettingsModal from './ServerSettingsModal';
import AdminPanel from './AdminPanel';
import FriendsPanel from './FriendsPanel';
import UserSettings from './UserSettings';

export default function Dashboard() {
  const { profile, signOut } = useAuth();
  const [servers, setServers] = useState<Server[]>([]);
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [serverMembership, setServerMembership] = useState<ServerMember | null>(null);

  const [showCreateServer, setShowCreateServer] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showServerSettings, setShowServerSettings] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showUserSettings, setShowUserSettings] = useState(false);

  useEffect(() => {
    loadServers();
  }, [profile]);

  useEffect(() => {
    if (selectedServerId && selectedServerId !== 'friends') {
      loadChannels(selectedServerId);
      loadMembership(selectedServerId);
    } else {
      setChannels([]);
      setSelectedChannelId(null);
      setServerMembership(null);
    }
  }, [selectedServerId]);

  async function loadServers() {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('server_members')
        .select('servers(*)')
        .eq('user_id', profile.id);

      if (error) throw error;

      const serverList = data?.map((sm: any) => sm.servers).filter(Boolean) || [];
      setServers(serverList);
    } catch (error) {
      console.error('Error loading servers:', error);
    }
  }

  async function loadChannels(serverId: string) {
    try {
      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .eq('server_id', serverId)
        .order('position', { ascending: true });

      if (error) throw error;
      setChannels(data || []);

      if (data && data.length > 0 && !selectedChannelId) {
        setSelectedChannelId(data[0].id);
      }
    } catch (error) {
      console.error('Error loading channels:', error);
    }
  }

  async function loadMembership(serverId: string) {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('server_members')
        .select('*')
        .eq('server_id', serverId)
        .eq('user_id', profile.id)
        .maybeSingle();

      if (error) throw error;
      setServerMembership(data);
    } catch (error) {
      console.error('Error loading membership:', error);
    }
  }

  async function handleCreateServer(name: string) {
    if (!profile) return;

    const { data, error } = await supabase
      .from('servers')
      .insert({ name, owner_id: profile.id })
      .select()
      .single();

    if (error) throw error;

    const { error: channelError } = await supabase
      .from('channels')
      .insert({ server_id: data.id, name: 'general', type: 'text', position: 0 });

    if (channelError) throw channelError;

    await loadServers();
    setSelectedServerId(data.id);
  }

  async function handleCreateChannel(name: string) {
    if (!selectedServerId) return;

    const maxPosition = Math.max(...channels.map(c => c.position), -1);

    const { error } = await supabase
      .from('channels')
      .insert({
        server_id: selectedServerId,
        name,
        type: 'text',
        position: maxPosition + 1,
      });

    if (error) throw error;
    await loadChannels(selectedServerId);
  }

  async function handleDeleteServer() {
    if (!selectedServerId) return;

    const { error } = await supabase
      .from('servers')
      .delete()
      .eq('id', selectedServerId);

    if (error) throw error;

    setSelectedServerId(null);
    await loadServers();
  }

  const selectedServer = servers.find(s => s.id === selectedServerId) || null;
  const selectedChannel = channels.find(c => c.id === selectedChannelId) || null;
  const canManageChannels = serverMembership?.role === 'owner' || serverMembership?.role === 'admin';

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      <ServerBar
        servers={servers}
        selectedServerId={selectedServerId}
        onSelectServer={setSelectedServerId}
        onSelectFriends={() => setSelectedServerId('friends')}
        onCreateServer={() => setShowCreateServer(true)}
        onShowAdmin={() => setShowAdminPanel(true)}
        isOwner={profile?.is_owner || false}
      />

      <div className="flex-1 flex overflow-hidden">
        {selectedServerId !== 'friends' && (
          <ChannelSidebar
            server={selectedServer}
            channels={channels}
            selectedChannelId={selectedChannelId}
            onSelectChannel={setSelectedChannelId}
            onCreateChannel={() => setShowCreateChannel(true)}
            onServerSettings={() => setShowServerSettings(true)}
            onUserSettings={() => setShowUserSettings(true)}
            canManageChannels={canManageChannels}
            profile={profile}
          />
        )}

        {selectedServerId === 'friends' ? (
          <FriendsPanel onOpenDM={(friendId) => console.log('Open DM with:', friendId)} />
        ) : (
          <ChatArea channel={selectedChannel} />
        )}
      </div>

      {showCreateServer && (
        <CreateServerModal
          onClose={() => setShowCreateServer(false)}
          onCreate={handleCreateServer}
        />
      )}

      {showCreateChannel && selectedServerId && (
        <CreateChannelModal
          onClose={() => setShowCreateChannel(false)}
          onCreate={handleCreateChannel}
        />
      )}

      {showServerSettings && selectedServer && (
        <ServerSettingsModal
          server={selectedServer}
          onClose={() => setShowServerSettings(false)}
          onDelete={handleDeleteServer}
        />
      )}

      {showAdminPanel && profile?.is_owner && (
        <AdminPanel onClose={() => setShowAdminPanel(false)} />
      )}

      {showUserSettings && (
        <UserSettings onClose={() => setShowUserSettings(false)} />
      )}
    </div>
  );
}
