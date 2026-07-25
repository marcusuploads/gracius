import React, { useEffect, useState } from 'react';
import api from '../api.js';

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Gallery() {
  const [photos, setPhotos] = useState([]);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const res = await api.get('/gallery');
    setPhotos(res.data.photos);
  };
  useEffect(() => { load(); }, []);

  const upload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const base64 = await fileToBase64(file);
    await api.post('/gallery', { image_data: base64, caption });
    setCaption('');
    e.target.value = '';
    setUploading(false);
    load();
  };

  const remove = async (id) => {
    if (!confirm('Delete this photo?')) return;
    await api.delete(`/gallery/${id}`);
    load();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Private Gallery 👑</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Only visible to you, the owner.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 space-y-3">
        <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Caption (optional)"
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white px-3 py-2 text-sm" />
        <input type="file" accept="image/*" onChange={upload} disabled={uploading}
          className="text-sm text-slate-600 dark:text-slate-300" />
        {uploading && <p className="text-sm text-slate-400">Uploading...</p>}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {photos.map((p) => (
          <div key={p.id} className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <img src={p.image_data} alt={p.caption || ''} className="w-full h-40 object-cover" />
            {p.caption && <p className="text-xs px-2 py-1 text-slate-600 dark:text-slate-300 truncate">{p.caption}</p>}
            <button onClick={() => remove(p.id)}
              className="absolute top-1 right-1 bg-black/60 text-white text-xs rounded-full w-6 h-6 opacity-0 group-hover:opacity-100 transition">✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}
