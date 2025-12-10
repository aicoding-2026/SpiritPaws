import React, { useEffect, useRef, useState } from 'react';
import { PetProfile } from '../types';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Mic, MicOff, PhoneOff, Volume2, Radio, Loader2, AlertCircle } from 'lucide-react';
import { base64ToBytes, createPcmBlob, decodeAudioData } from '../utils/audioUtils';

interface VoiceModeProps {
  profile: PetProfile;
  apiKey: string;
  onHangup: () => void;
}

const VoiceMode: React.FC<VoiceModeProps> = ({ profile, apiKey, onHangup }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Initializing...");
  const [error, setError] = useState<string | null>(null);
  
  // Audio Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);

  useEffect(() => {
    let mounted = true;

    const startSession = async () => {
      try {
        // 0. Check API Key
        if (!apiKey) {
            throw new Error("API Key is missing. Please configure API_KEY in your settings.");
        }

        // 1. Request Microphone Access
        setStatusMessage("Requesting microphone access...");
        let stream: MediaStream;
        try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
        } catch (micErr) {
            console.error("Microphone access error:", micErr);
            throw new Error("Could not access microphone. Please check browser permissions.");
        }

        // 2. Initialize Audio Contexts
        if (!mounted) return;
        setStatusMessage("Tuning into spirit frequency...");
        
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const inputCtx = new AudioContextClass({ sampleRate: 16000 });
        const outputCtx = new AudioContextClass({ sampleRate: 24000 });
        
        audioContextRef.current = inputCtx;
        outputAudioContextRef.current = outputCtx;

        // Vital: Resume contexts if they are suspended (browser autoplay policy)
        if (inputCtx.state === 'suspended') await inputCtx.resume();
        if (outputCtx.state === 'suspended') await outputCtx.resume();

        const outputNode = outputCtx.createGain();
        outputNode.connect(outputCtx.destination);

        // 3. Connect to Gemini Live
        if (!mounted) return;
        setStatusMessage("Summoning spirit...");
        
        const ai = new GoogleGenAI({ apiKey });

        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-09-2025',
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
            },
            systemInstruction: `
              You are ${profile.name}, a Chinese Li Hua cat spirit. 
              Personality: ${profile.personality}. 
              You are talking to your owner via a spiritual connection.
              Respond with a mix of realistic cat sounds (meows, purrs) and telepathic speech.
              Keep responses short, warm, and comforting. Do not be robotic.
              If the user sounds sad, comfort them. If they are happy, purr.
            `,
          },
          callbacks: {
            onopen: () => {
              if (!mounted) return;
              setIsConnected(true);
              setStatusMessage("Spirit Connection Established");
              console.log("Live session connected");

              // Connect Microphone Stream to Processor
              const source = inputCtx.createMediaStreamSource(stream);
              sourceRef.current = source;
              
              // Use ScriptProcessor for raw PCM data extraction
              const processor = inputCtx.createScriptProcessor(4096, 1, 1);
              scriptProcessorRef.current = processor;

              processor.onaudioprocess = (e) => {
                 if (isMuted) return;
                 const inputData = e.inputBuffer.getChannelData(0);
                 const pcmBlob = createPcmBlob(inputData);
                 
                 // Send to model
                 sessionPromise.then((session) => {
                    session.sendRealtimeInput({ media: pcmBlob });
                 });
              };

              source.connect(processor);
              processor.connect(inputCtx.destination);
            },
            onmessage: async (message: LiveServerMessage) => {
              if (!mounted) return;
              
              // Handle Audio Output
              const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
              if (base64Audio && outputAudioContextRef.current) {
                const ctx = outputAudioContextRef.current;
                // Schedule audio to play smoothly
                const now = ctx.currentTime;
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, now);
                
                try {
                    const audioBytes = base64ToBytes(base64Audio);
                    const audioBuffer = await decodeAudioData(audioBytes, ctx, 24000, 1);
                    
                    const bufferSource = ctx.createBufferSource();
                    bufferSource.buffer = audioBuffer;
                    bufferSource.connect(outputNode);
                    
                    bufferSource.start(nextStartTimeRef.current);
                    nextStartTimeRef.current += audioBuffer.duration;
                } catch (decodeErr) {
                    console.error("Audio decode error", decodeErr);
                }
              }

              if (message.serverContent?.interrupted) {
                 nextStartTimeRef.current = outputAudioContextRef.current?.currentTime || 0;
              }
            },
            onclose: () => {
              if (mounted) {
                  setIsConnected(false);
                  setStatusMessage("Spirit departed.");
              }
            },
            onerror: (e) => {
              console.error("Live session error", e);
              if (mounted) setError("Connection lost.");
            }
          }
        });
        
        sessionPromiseRef.current = sessionPromise;

      } catch (err: any) {
        console.error("Failed to start voice session", err);
        if (mounted) {
            // Provide more user-friendly error messages based on common failures
            if (err.message.includes("API Key")) {
                setError(err.message);
            } else if (err.message.includes("microphone")) {
                setError(err.message);
            } else {
                setError("Could not connect to the spirit world. Please try again.");
            }
        }
      }
    };

    startSession();

    return () => {
      mounted = false;
      
      // Stop Tracks
      if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
      }
      
      // Disconnect Audio Nodes
      sourceRef.current?.disconnect();
      scriptProcessorRef.current?.disconnect();
      
      // Close Contexts
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close();
      }
      if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
          outputAudioContextRef.current.close();
      }
      
      // Close Session
      sessionPromiseRef.current?.then(session => {
          session.close();
      }).catch(e => console.error("Error closing session", e));
    };
  }, [profile, isMuted, apiKey]);

  const toggleMute = () => {
      setIsMuted(!isMuted);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center text-white">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-amber-950 opacity-80"></div>
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-md p-8 animate-fade-in">
        
        <div className="mb-12 relative">
             <div className={`w-40 h-40 rounded-full border-4 ${isConnected ? 'border-amber-400 animate-pulse' : error ? 'border-red-500' : 'border-slate-600'} flex items-center justify-center overflow-hidden shadow-2xl shadow-amber-900/50 bg-slate-800 transition-colors duration-500`}>
                 {profile.avatarUrl ? (
                     <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                 ) : (
                     <div className="bg-slate-700 w-full h-full flex items-center justify-center">
                         {error ? <AlertCircle className="w-16 h-16 text-red-400" /> : <Radio className="w-16 h-16 text-slate-400" />}
                     </div>
                 )}
             </div>
             
             {/* Status Badge */}
             {!error && (
                 <div className={`absolute -bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-1 rounded-full border backdrop-blur-sm text-sm flex items-center gap-2 transition-all duration-300 whitespace-nowrap ${isConnected ? 'bg-amber-500/20 border-amber-500/50 text-amber-200' : 'bg-slate-700/50 border-slate-600 text-slate-300'}`}>
                     {isConnected ? (
                         <>
                             <Volume2 className="w-3 h-3 animate-pulse" />
                             <span>Live</span>
                         </>
                     ) : (
                         <>
                             <Loader2 className="w-3 h-3 animate-spin" />
                             <span>Connecting...</span>
                         </>
                     )}
                 </div>
             )}
        </div>

        <h2 className="text-3xl font-light mb-2">{profile.name}</h2>
        
        <div className="h-8 mb-12 text-center w-full px-4">
             {error ? (
                 <span className="inline-block text-red-300 text-sm font-medium bg-red-900/40 px-4 py-2 rounded-lg border border-red-500/30 animate-pulse">
                    {error}
                 </span>
             ) : (
                 <p className="text-slate-400 animate-pulse">{statusMessage}</p>
             )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-8">
            <button 
                onClick={toggleMute}
                disabled={!isConnected}
                className={`p-6 rounded-full transition-all duration-300 ${isMuted ? 'bg-slate-700 text-slate-400' : 'bg-slate-700 hover:bg-slate-600 text-white'} ${!isConnected && 'opacity-50 cursor-not-allowed'}`}
            >
                {isMuted ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
            </button>
            
            <button 
                onClick={onHangup}
                className="bg-red-500 hover:bg-red-600 text-white p-6 rounded-full shadow-lg shadow-red-900/30 transform hover:scale-105 transition-all"
            >
                <PhoneOff className="w-8 h-8" />
            </button>
        </div>

      </div>
    </div>
  );
};

export default VoiceMode;