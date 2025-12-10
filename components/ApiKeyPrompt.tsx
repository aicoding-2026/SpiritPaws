import React, { useState } from 'react';
import { Key, Sparkles, ExternalLink, ArrowLeft } from 'lucide-react';

interface ApiKeyPromptProps {
  onSave: (key: string) => void;
  onCancel?: () => void;
}

const ApiKeyPrompt: React.FC<ApiKeyPromptProps> = ({ onSave, onCancel }) => {
  const [inputKey, setInputKey] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputKey.trim()) {
      setError('Please enter a valid API Key');
      return;
    }
    if (!inputKey.startsWith('AIza')) {
      setError('That does not look like a valid Google API Key (usually starts with AIza)');
      return;
    }
    onSave(inputKey.trim());
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-xl p-8 border border-slate-100 animate-fade-in relative">
        {onCancel && (
            <button 
                onClick={onCancel}
                className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition"
                title="Cancel"
            >
                <ArrowLeft className="w-5 h-5" />
            </button>
        )}

        <div className="text-center mb-8">
          <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Key className="text-amber-600 w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Spirit Link Required</h1>
          <p className="text-slate-500 mt-2">
            To establish a connection with the spirit world, a Gemini API Key is required.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm text-blue-800">
            <p className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                This key is stored <strong>locally on your device</strong> and is never sent to our servers. It communicates directly with Google's Gemini API.
              </span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Google Gemini API Key</label>
            <input
              type="password"
              value={inputKey}
              onChange={(e) => {
                setInputKey(e.target.value);
                setError('');
              }}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
              placeholder="AIza..."
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>

          <div className="flex gap-3">
             {onCancel && (
                 <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition"
                 >
                    Cancel
                 </button>
             )}
             <button
                type="submit"
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
            >
                Connect
            </button>
          </div>

          <div className="text-center pt-2">
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700 hover:underline"
            >
              Get a free key from Google AI Studio <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApiKeyPrompt;