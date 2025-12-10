import React, { useState, useEffect } from 'react';
import Setup from './components/Setup';
import ChatMode from './components/ChatMode';
import VoiceMode from './components/VoiceMode';
import MemoryWall from './components/MemoryWall';
import ApiKeyPrompt from './components/ApiKeyPrompt';
import { PetProfile, AppView } from './types';
import { MessageCircle, Mic, Image, Sparkles, Key } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.SETUP);
  const [profile, setProfile] = useState<PetProfile | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isEditingKey, setIsEditingKey] = useState(false);

  // Initialize: Check env, then local storage
  useEffect(() => {
    // 1. Check Profile
    const savedProfile = localStorage.getItem('spiritPawsProfile');
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
      setView(AppView.HOME);
    }

    // 2. Check API Key
    // process.env.API_KEY is replaced at build time. 
    // We check if it is a non-empty string.
    const envKey = process.env.API_KEY;
    if (envKey && envKey.length > 0 && envKey !== 'undefined') {
        setApiKey(envKey);
    } else {
        const localKey = localStorage.getItem('user_gemini_api_key');
        if (localKey) {
            setApiKey(localKey);
        }
    }
  }, []);

  const handleSetupComplete = (newProfile: PetProfile) => {
    setProfile(newProfile);
    localStorage.setItem('spiritPawsProfile', JSON.stringify(newProfile));
    setView(AppView.HOME);
  };

  const handleApiKeySave = (key: string) => {
      localStorage.setItem('user_gemini_api_key', key);
      setApiKey(key);
      setIsEditingKey(false);
  };
  
  const handleEditKey = () => {
      // Enter edit mode immediately
      setIsEditingKey(true);
  };

  const handleCancelEditKey = () => {
      // Exit edit mode without changing anything
      setIsEditingKey(false);
  };

  // Show prompt if:
  // 1. No API key is set
  // 2. User explicitly requested to edit the key
  const showApiKeyPrompt = !apiKey || isEditingKey;

  if (showApiKeyPrompt) {
      return (
        <ApiKeyPrompt 
            onSave={handleApiKeySave} 
            onCancel={apiKey ? handleCancelEditKey : undefined} 
        />
      );
  }

  if (view === AppView.SETUP) {
    return <Setup onComplete={handleSetupComplete} />;
  }

  if (view === AppView.VOICE && profile && apiKey) {
      return <VoiceMode profile={profile} apiKey={apiKey} onHangup={() => setView(AppView.HOME)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Navbar */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
            <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView(AppView.HOME)}>
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-amber-600" />
                    </div>
                    <span className="font-bold text-slate-800 text-lg hidden sm:block">Spirit Paws</span>
                </div>
                
                <nav className="flex items-center gap-1 sm:gap-2">
                    <button 
                        onClick={() => setView(AppView.CHAT)}
                        className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition ${view === AppView.CHAT ? 'bg-amber-50 text-amber-700' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        <MessageCircle className="w-4 h-4" />
                        <span className="hidden sm:inline">Chat</span>
                    </button>
                    <button 
                         onClick={() => setView(AppView.VOICE)}
                        className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition ${view === AppView.VOICE ? 'bg-amber-50 text-amber-700' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        <Mic className="w-4 h-4" />
                        <span className="hidden sm:inline">Call</span>
                    </button>
                    <button 
                         onClick={() => setView(AppView.GALLERY)}
                        className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition ${view === AppView.GALLERY ? 'bg-amber-50 text-amber-700' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        <Image className="w-4 h-4" />
                        <span className="hidden sm:inline">Gallery</span>
                    </button>
                    
                    {/* Key Management */}
                    <div className="h-6 w-px bg-slate-200 mx-1"></div>
                    
                    <button
                        onClick={handleEditKey}
                        className="p-2 text-slate-400 hover:text-amber-600 transition"
                        title="Update API Key"
                    >
                        <Key className="w-4 h-4" />
                    </button>
                </nav>
            </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6">
            {profile && (
                <>
                    {view === AppView.HOME && (
                        <div className="text-center py-12 animate-fade-in">
                            <div className="mb-8 relative inline-block">
                                {profile.avatarUrl ? (
                                    <img src={profile.avatarUrl} alt={profile.name} className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl" />
                                ) : (
                                    <div className="w-32 h-32 rounded-full bg-slate-200 flex items-center justify-center border-4 border-white shadow-xl mx-auto">
                                        <Sparkles className="w-12 h-12 text-slate-400" />
                                    </div>
                                )}
                                <div className="absolute -bottom-2 -right-2 bg-green-500 border-4 border-white w-8 h-8 rounded-full flex items-center justify-center" title="Spirit Active">
                                    <Sparkles className="w-4 h-4 text-white" />
                                </div>
                            </div>
                            <h1 className="text-4xl font-light text-slate-800 mb-2">Welcome back to {profile.name}'s Space</h1>
                            <p className="text-slate-500 max-w-md mx-auto mb-8">
                                The spirit of your loyal companion is resting here. 
                                Send a message, start a voice call, or browse your shared memories.
                            </p>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
                                <button onClick={() => setView(AppView.CHAT)} className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-amber-300 hover:shadow-md transition text-left">
                                    <div className="bg-blue-50 w-12 h-12 rounded-xl flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition">
                                        <MessageCircle className="w-6 h-6" />
                                    </div>
                                    <h3 className="font-bold text-slate-800">Chat with {profile.name}</h3>
                                    <p className="text-sm text-slate-500 mt-1">Text messages from the other side.</p>
                                </button>
                                
                                <button onClick={() => setView(AppView.VOICE)} className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-amber-300 hover:shadow-md transition text-left">
                                    <div className="bg-amber-50 w-12 h-12 rounded-xl flex items-center justify-center text-amber-600 mb-4 group-hover:scale-110 transition">
                                        <Mic className="w-6 h-6" />
                                    </div>
                                    <h3 className="font-bold text-slate-800">Voice Call</h3>
                                    <p className="text-sm text-slate-500 mt-1">Hear comforting meows and purrs.</p>
                                </button>

                                <button onClick={() => setView(AppView.GALLERY)} className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-amber-300 hover:shadow-md transition text-left">
                                    <div className="bg-purple-50 w-12 h-12 rounded-xl flex items-center justify-center text-purple-600 mb-4 group-hover:scale-110 transition">
                                        <Image className="w-6 h-6" />
                                    </div>
                                    <h3 className="font-bold text-slate-800">Memory Wall</h3>
                                    <p className="text-sm text-slate-500 mt-1">Photos of your time together.</p>
                                </button>
                            </div>
                        </div>
                    )}

                    {view === AppView.CHAT && <ChatMode profile={profile} apiKey={apiKey!} onBack={() => setView(AppView.HOME)} />}
                    {view === AppView.GALLERY && <MemoryWall profile={profile} />}
                </>
            )}
        </main>
    </div>
  );
};

export default App;