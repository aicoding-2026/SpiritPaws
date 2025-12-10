import React, { useState, useRef, useEffect } from 'react';
import { PetProfile, ChatMessage } from '../types';
import { GoogleGenAI } from '@google/genai';
import { Send, Cat, Loader2, ArrowLeft } from 'lucide-react';

interface ChatModeProps {
  profile: PetProfile;
  onBack: () => void;
}

const ChatMode: React.FC<ChatModeProps> = ({ profile, onBack }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      role: 'model',
      text: `*Purrs softly* I am here, ${profile.name} is listening...`,
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const systemInstruction = `
        You are acting as the spirit of a deceased pet cat named ${profile.name}.
        Breed: ${profile.breed}.
        Personality: ${profile.personality}.
        Favorite Toy: ${profile.favoriteToy}.
        Quirks: ${profile.quirks}.

        Your owner is talking to you. Respond as the cat would.
        - Use simple language mixed with *actions* in asterisks (e.g., *purrs*, *headbutts*).
        - You can "speak" telepathically in short sentences, comforting them.
        - Be warm, slightly mysterious, but very affectionate.
        - Do not be overly tragic; be a comforting presence.
      `;

      // Build chat history
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: { systemInstruction },
        history: history
      });

      const result = await chat.sendMessage({ message: userMsg.text });
      
      const responseText = result.text;
      
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText || "*Purrs silently*",
        timestamp: Date.now()
      }]);

    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "*Hisses at a connection shadow* (Something went wrong, please try again)",
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] md:h-[600px] w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
      {/* Header */}
      <div className="bg-amber-50 p-4 border-b border-amber-100 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 hover:bg-amber-100 rounded-full transition text-amber-700 md:hidden">
                <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="relative">
                {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.name} className="w-10 h-10 rounded-full object-cover border-2 border-amber-300" />
                ) : (
                <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center text-amber-700">
                    <Cat className="w-6 h-6" />
                </div>
                )}
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></span>
            </div>
            <div>
                <h3 className="font-bold text-slate-800">{profile.name}</h3>
                <p className="text-xs text-slate-500">Spirit Connection Active</p>
            </div>
         </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                msg.role === 'user'
                  ? 'bg-amber-600 text-white rounded-tr-none'
                  : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex justify-start">
                 <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                    <span className="text-xs text-slate-400">Listening...</span>
                 </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-slate-100">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Send a message to ${profile.name}...`}
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white p-3 rounded-xl transition shadow-md"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatMode;