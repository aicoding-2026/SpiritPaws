import React, { useEffect, useRef, useState } from 'react';
import { PetProfile } from '../types';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Mic, MicOff, PhoneOff, Volume2, Radio } from 'lucide-react';
import { base64ToBytes, createPcmBlob, decodeAudioData } from '../utils/audioUtils';

interface VoiceModeProps {
  profile: PetProfile;
  onHangup: () => void;
}

const VoiceMode: React.FC<VoiceModeProps> = ({ profile, onHangup }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Audio Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sessionPromiseRef = useRef<Promise<any> | null>(null); // Keep track of the session

  useEffect(() => {
    let mounted = true;

    const startSession = async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // Setup Audio Contexts
        const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        
        audioContextRef.current = inputCtx;
        outputAudioContextRef.current = outputCtx;

        const outputNode = outputCtx.createGain();
        outputNode.connect(outputCtx.destination);

        // Get Microphone Stream
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        // Configure Live Connection
        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-09-2025',
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }, // Kore sounds soft/calm
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
              console.log("Live session connected");

              // Setup Input Audio Pipeline (Mic -> Model)
              const source = inputCtx.createMediaStreamSource(stream);
              sourceRef.current = source;
              
              const processor = inputCtx.createScriptProcessor(4096, 1, 1);
              scriptProcessorRef.current = processor;

              processor.onaudioprocess = (e) => {
                 if (isMuted) return; // Simple mute logic
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
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                
                const audioBytes = base64ToBytes(base64Audio);
                const audioBuffer = await decodeAudioData(audioBytes, ctx, 24000, 1);
                
                const bufferSource = ctx.createBufferSource();
                bufferSource.buffer = audioBuffer;
                bufferSource.connect(outputNode);
                
                bufferSource.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
              }

              // Handle Interruptions
              if (message.serverContent?.interrupted) {
                 // In a real app we would stop currently playing nodes here, 
                 // but for simplicity we reset the time cursor
                 nextStartTimeRef.current = outputAudioContextRef.current?.currentTime || 0;
              }
            },
            onclose: () => {
              if (mounted) setIsConnected(false);
              console.log("Live session closed");
            },
            onerror: (e) => {
              console.error("Live session error", e);
              if (mounted) setError("Connection to the spirit world interrupted.");
            }
          }
        });
        
        sessionPromiseRef.current = sessionPromise;

      } catch (err) {
        console.error("Failed to start voice session", err);
        setError("Could not access microphone or connect to AI.");
      }
    };

    startSession();

    return () => {
      mounted = false;
      // Cleanup
      streamRef.current?.getTracks().forEach(t => t.stop());
      sourceRef.current?.disconnect();
      scriptProcessorRef.current?.disconnect();
      audioContextRef.current?.close();
      outputAudioContextRef.current?.close();
      
      // Close session if possible
      sessionPromiseRef.current?.then(session => {
          session.close();
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]); // Re-run only if profile deeply changes (unlikely during call)

  const toggleMute = () => {
      setIsMuted(!isMuted);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center text-white">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-amber-900 opacity-50"></div>
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-md p-8">
        
        <div className="mb-12 relative">
             <div className={`w-40 h-40 rounded-full border-4 ${isConnected ? 'border-amber-400 animate-pulse' : 'border-slate-600'} flex items-center justify-center overflow-hidden shadow-2xl shadow-amber-900/50`}>
                 {profile.avatarUrl ? (
                     <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                 ) : (
                     <div className="bg-slate-700 w-full h-full flex items-center justify-center">
                         <Radio className="w-16 h-16 text-slate-400" />
                     </div>
                 )}
             </div>
             {isConnected && (
                 <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-amber-500/20 backdrop-blur-sm px-4 py-1 rounded-full border border-amber-500/50 text-amber-200 text-sm flex items-center gap-2">
                     <Volume2 className="w-4 h-4 animate-pulse" />
                     Listening
                 </div>
             )}
        </div>

        <h2 className="text-3xl font-light mb-2">{profile.name}</h2>
        <p className="text-slate-400 mb-12 text-center">
          {isConnected ? "Spirit Connection Established" : "Summoning Spirit..."}
          {error && <span className="block text-red-400 mt-2 text-sm">{error}</span>}
        </p>

        {/* Controls */}
        <div className="flex items-center gap-8">
            <button 
                onClick={toggleMute}
                className={`p-6 rounded-full transition-all duration-300 ${isMuted ? 'bg-slate-700 text-slate-400' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
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