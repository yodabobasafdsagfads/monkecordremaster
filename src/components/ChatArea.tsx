import { useState, useEffect, useRef } from 'react';
import { Send, Hash } from 'lucide-react';
import { supabase, Message, Channel } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface ChatAreaProps {
  channel: Channel | null;
}

export default function ChatArea({ channel }: ChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Load initial messages + set up realtime listener
  useEffect(() => {
    if (!channel) {
      setMessages([]);
      return;
    }

    loadMessages();

    const subscription = supabase
      .channel(`channel-${channel.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channel.id}`,
        },
        async (payload) => {
          const newMessage = payload.new as Message;

          // fetch sender's profile for display
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', newMessage.user_id)
            .single();

          setMessages((prev) => [
            ...prev,
            { ...newMessage, profiles: profileData },
          ]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [channel]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  async function loadMessages() {
    if (!channel) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*, profiles(*)')
        .eq('channel_id', channel.id)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !channel || !user) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('messages').insert({
        channel_id: channel.id,
        user_id: user.id,
        content: newMessage.trim(),
      });

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  }

  if (!channel) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-700">
        <div className="text-center">
          <Hash className="w-16 h-16 text-slate-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-300 mb-2">
            No Channel Selected
          </h2>
          <p className="text-slate-400">
            Select a channel from the sidebar to start chatting
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-700">
      {/* Header */}
      <div className="h-12 px-4 flex items-center border-b border-slate-600 shadow-md">
        <Hash className="w-5 h-5 text-slate-400 mr-2" />
        <h3 className="font-semibold text-white">{channel.name}</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
              {message.profiles?.username?.substring(0, 2).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-semibold text-white">
                  {message.profiles?.display_name ||
                    message.profiles?.username ||
                    'Unknown'}
                </span>
                {message.profiles?.is_owner && (
                  <span className="text-xs bg-amber-600 text-white px-2 py-0.5 rounded">
                    OWNER
                  </span>
                )}
                <span className="text-xs text-slate-400">
                  {new Date(message.created_at).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-slate-200 break-words">{message.content}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-600">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Message #${channel.name}`}
            className="flex-1 px-4 py-3 bg-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !newMessage.trim()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
