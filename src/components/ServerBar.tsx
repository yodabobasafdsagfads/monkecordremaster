import { Plus, Home, Settings, Users } from 'lucide-react';
import { Server } from '../lib/supabase';

interface ServerBarProps {
  servers: Server[];
  selectedServerId: string | null;
  onSelectServer: (serverId: string | null) => void;
  onSelectFriends: () => void;
  onCreateServer: () => void;
  onShowAdmin: () => void;
  isOwner: boolean;
}

export default function ServerBar({
  servers,
  selectedServerId,
  onSelectServer,
  onSelectFriends,
  onCreateServer,
  onShowAdmin,
  isOwner
}: ServerBarProps) {
  return (
    <div className="h-16 bg-slate-900 border-b border-slate-800 flex items-center px-4 gap-3 overflow-x-auto">
      <button
        onClick={() => onSelectServer(null)}
        className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
          selectedServerId === null && selectedServerId !== 'friends'
            ? 'bg-blue-600 text-white'
            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white hover:rounded-2xl'
        }`}
        title="Home"
      >
        <Home className="w-6 h-6" />
      </button>

      <button
        onClick={onSelectFriends}
        className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
          selectedServerId === 'friends'
            ? 'bg-blue-600 text-white'
            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white hover:rounded-2xl'
        }`}
        title="Friends"
      >
        <Users className="w-6 h-6" />
      </button>

      <div className="h-8 w-px bg-slate-700" />

      {servers.map((server) => (
        <button
          key={server.id}
          onClick={() => onSelectServer(server.id)}
          className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-semibold text-lg transition-all ${
            selectedServerId === server.id
              ? 'bg-blue-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white hover:rounded-2xl'
          }`}
          title={server.name}
        >
          {server.icon_url ? (
            <img src={server.icon_url} alt={server.name} className="w-full h-full rounded-xl object-cover" />
          ) : (
            server.name.substring(0, 2).toUpperCase()
          )}
        </button>
      ))}

      <button
        onClick={onCreateServer}
        className="flex-shrink-0 w-12 h-12 rounded-xl bg-slate-800 text-green-500 hover:bg-green-600 hover:text-white hover:rounded-2xl flex items-center justify-center transition-all"
        title="Create Server"
      >
        <Plus className="w-6 h-6" />
      </button>

      {isOwner && (
        <>
          <div className="h-8 w-px bg-slate-700" />
          <button
            onClick={onShowAdmin}
            className="flex-shrink-0 w-12 h-12 rounded-xl bg-slate-800 text-amber-500 hover:bg-amber-600 hover:text-white hover:rounded-2xl flex items-center justify-center transition-all ml-auto"
            title="Admin Panel"
          >
            <Settings className="w-6 h-6" />
          </button>
        </>
      )}
    </div>
  );
}
