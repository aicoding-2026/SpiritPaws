import React, { useState } from 'react';
import { Memory, PetProfile } from '../types';
import { Plus, Image as ImageIcon, Trash2 } from 'lucide-react';

interface MemoryWallProps {
  profile: PetProfile;
}

const MemoryWall: React.FC<MemoryWallProps> = ({ profile }) => {
  const [memories, setMemories] = useState<Memory[]>([
    { id: '1', imageUrl: 'https://picsum.photos/400/400?random=1', description: 'Sunny afternoon naps', date: '2023-05-15' },
    { id: '2', imageUrl: 'https://picsum.photos/400/500?random=2', description: 'Exploring the garden', date: '2023-06-20' },
    { id: '3', imageUrl: 'https://picsum.photos/400/300?random=3', description: 'Looking majestic', date: '2023-08-01' },
  ]);
  const [isAdding, setIsAdding] = useState(false);
  const [newDesc, setNewDesc] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
         const newMemory: Memory = {
             id: Date.now().toString(),
             imageUrl: reader.result as string,
             description: newDesc || 'A precious memory',
             date: new Date().toISOString().split('T')[0]
         };
         setMemories([newMemory, ...memories]);
         setIsAdding(false);
         setNewDesc('');
      };
      reader.readAsDataURL(file);
    }
  };

  const removeMemory = (id: string) => {
    setMemories(memories.filter(m => m.id !== id));
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 min-h-[500px]">
        <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800">Memory Wall</h2>
            <button 
                onClick={() => setIsAdding(!isAdding)}
                className="flex items-center gap-2 text-sm font-medium text-amber-600 hover:text-amber-700 transition"
            >
                <Plus className="w-4 h-4" />
                Add Memory
            </button>
        </div>

        {isAdding && (
            <div className="mb-8 bg-amber-50 p-4 rounded-xl border border-amber-100 animate-fade-in">
                <input 
                    type="text" 
                    placeholder="Describe this memory..." 
                    className="w-full mb-3 px-3 py-2 rounded-lg border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                />
                <label className="block w-full cursor-pointer bg-white border-2 border-dashed border-amber-300 rounded-lg p-6 text-center hover:bg-amber-50 transition">
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                    <ImageIcon className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                    <span className="text-slate-500 text-sm">Click to upload a photo</span>
                </label>
            </div>
        )}

        <div className="columns-1 sm:columns-2 md:columns-3 gap-4 space-y-4">
            {memories.map((memory) => (
                <div key={memory.id} className="break-inside-avoid relative group rounded-xl overflow-hidden shadow-md">
                    <img src={memory.imageUrl} alt={memory.description} className="w-full h-auto object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                        <p className="text-white font-medium text-sm">{memory.description}</p>
                        <p className="text-white/70 text-xs">{memory.date}</p>
                        <button 
                            onClick={() => removeMemory(memory.id)}
                            className="absolute top-2 right-2 p-1.5 bg-red-500/80 rounded-full text-white hover:bg-red-600 transition"
                        >
                            <Trash2 className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            ))}
        </div>

        {memories.length === 0 && (
            <div className="text-center py-20 text-slate-400">
                <p>No memories yet. Add a photo to remember {profile.name}.</p>
            </div>
        )}
    </div>
  );
};

export default MemoryWall;