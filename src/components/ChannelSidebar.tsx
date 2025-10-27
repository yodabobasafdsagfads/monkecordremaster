import { Hash, Plus, Settings, Cog } from 'lucide-react';
import { Channel, Server, Profile } from '../lib/supabase';

interface ChannelSidebarProps {
  server: Server | null;
  channels: Channel[];
  selectedChannelId: string | null;
  onSelectChannel: (channelId: string) => void;
  onCreateChannel: () => void;
  onServerSettings: () => void;
  onUserSettings: () => void;
  canManageChannels: boolean;
  profile: Profile | null;
}

export default function ChannelSidebar({
  server,
  channels,
  selectedChannelId,
  onSelectChannel,
  onCreateChannel,
  onServerSettings,
  onUserSettings,
  canManageChannels,
  profile,
}: ChannelSidebarProps) {
  const textChannels = channels.filter((c) => c.type === 'text').sort((a, b) => a.position - b.position);

  return (
    <div className="w-60 bg-slate-800 flex flex-col">
      <div className="h-12 px-4 flex items-center justify-between border-b border-slate-900 shadow-md">
        <h2 className="font-semibold text-white truncate">
          {server?.name || 'Select a Server'}
        </h2>
        {server && canManageChannels && (
          <button
            onClick={onServerSettings}
            className="text-slate-400 hover:text-white transition-colors"
            title="Server Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {server ? (
          <>
            <div className="flex items-center justify-between px-2 py-2">
              <div className="flex items-center gap-1 text-xs font-semibold text-slate-400 uppercase">
                <Hash className="w-3 h-3" />
                Text Channels
              </div>
              {canManageChannels && (
                <button
                  onClick={onCreateChannel}
                  className="text-slate-400 hover:text-white transition-colors"
                  title="Create Channel"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>

            {textChannels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => onSelectChannel(channel.id)}
                className={`w-full flex items-center gap-2 px-2 py-2 rounded-md transition-colors ${
                  selectedChannelId === channel.id
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-300'
                }`}
              >
                <Hash className="w-4 h-4 flex-shrink-0" />
                <span className="truncate text-sm">{channel.name}</span>
              </button>
            ))}

            {textChannels.length === 0 && (
              <p className="text-slate-500 text-xs px-2 py-4 text-center">
                No channels yet
              </p>
            )}
          </>
        ) : (
          <div className="text-slate-500 text-sm px-2 py-4 text-center">
            Select a server to see channels
          </div>
        )}
      </div>

      <div className="h-14 px-2 border-t border-slate-900 flex items-center justify-between bg-slate-850">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
            {profile?.username?.substring(0, 2).toUpperCase() || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-sm font-semibold truncate">{profile?.display_name || profile?.username}</p>
            <p className="text-slate-400 text-xs truncate">@{profile?.username}</p>
          </div>
        </div>
        <button
          onClick={onUserSettings}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors flex-shrink-0"
          title="User Settings"
        >
          <Cog className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
