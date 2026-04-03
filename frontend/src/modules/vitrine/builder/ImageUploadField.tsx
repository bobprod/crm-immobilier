import React, { useCallback, useState } from 'react';
import { builderApi } from './api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface ImageUploadFieldProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({ value, onChange, label }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Le fichier dépasse 5 Mo');
      return;
    }

    setUploading(true);
    setError('');
    try {
      const result = await builderApi.uploadImage(file);
      // Build full URL for serving
      const fullUrl = result.url.startsWith('http') ? result.url : `${API_BASE.replace('/api', '')}${result.url}`;
      onChange(fullUrl);
    } catch (err: any) {
      setError(err.message || 'Erreur upload');
    } finally {
      setUploading(false);
    }
  }, [onChange]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {label && <label style={{ fontSize: 13, fontWeight: 500, color: '#333' }}>{label}</label>}
      {value && (
        <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: '1px solid #ddd' }}>
          <img src={value} alt="Aperçu" style={{ width: '100%', maxHeight: 120, objectFit: 'cover', display: 'block' }} />
          <button onClick={() => onChange('')} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: 4, padding: '2px 6px', fontSize: 11, cursor: 'pointer' }}>✕</button>
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <label style={{ padding: '6px 12px', background: uploading ? '#999' : '#1E40AF', color: '#fff', borderRadius: 6, fontSize: 12, cursor: uploading ? 'not-allowed' : 'pointer', fontWeight: 500 }}>
          {uploading ? '⏳ Upload...' : '📷 Choisir image'}
          <input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} style={{ display: 'none' }} />
        </label>
      </div>
      <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder="Ou coller une URL d'image"
        style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 12 }} />
      {error && <span style={{ color: '#DC2626', fontSize: 11 }}>{error}</span>}
    </div>
  );
};
