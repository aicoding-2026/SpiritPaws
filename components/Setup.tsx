import React, { useState } from 'react';
import { PetProfile } from '../types';
import { Cat, Heart, Sparkles } from 'lucide-react';

interface SetupProps {
  onComplete: (profile: PetProfile) => void;
}

const Setup: React.FC<SetupProps> = ({ onComplete }) => {
  const [profile, setProfile] = useState<PetProfile>({
    name: '',
    breed: 'Chinese Li Hua',
    personality: '',
    favoriteToy: '',
    quirks: '',
    avatarUrl: null
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(profile);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfile(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile(prev => ({ ...prev, avatarUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-lg w-full rounded-2xl shadow-xl p-8 border border-slate-100">
        <div className="text-center mb-8">
          <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="text-amber-600 w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Spirit Paws</h1>
          <p className="text-slate-500 mt-2">Create a digital spirit for your beloved companion.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input
              required
              name="name"
              value={profile.name}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
              placeholder="e.g. Luna"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Breed</label>
              <input
                name="breed"
                value={profile.breed}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Favorite Toy</label>
              <input
                name="favoriteToy"
                value={profile.favoriteToy}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="e.g. Red Laser"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Personality</label>
            <textarea
              required
              name="personality"
              value={profile.personality}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none"
              placeholder="e.g. Playful, affectionate, vocal, hates vacuums..."
            />
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Photo (Optional)</label>
             <div className="flex items-center gap-4">
               <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-lg transition text-sm font-medium">
                 Upload Photo
                 <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
               </label>
               {profile.avatarUrl && (
                 <img src={profile.avatarUrl} alt="Preview" className="w-12 h-12 rounded-full object-cover border-2 border-amber-200" />
               )}
             </div>
          </div>

          <button
            type="submit"
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
          >
            <Heart className="w-5 h-5" />
            Awaken Spirit
          </button>
        </form>
      </div>
    </div>
  );
};

export default Setup;