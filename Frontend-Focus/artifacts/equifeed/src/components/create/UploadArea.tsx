import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';

interface UploadAreaProps {
  onFileSelect: (file: File, url: string, type: 'VIDEO' | 'IMAGE') => void;
}

export function UploadArea({ onFileSelect }: UploadAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<{ url: string; type: 'VIDEO' | 'IMAGE' } | null>(null);

  const handleFile = (file: File) => {
    const type: 'VIDEO' | 'IMAGE' = file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE';
    const url = URL.createObjectURL(file);
    setPreview({ url, type });
    onFileSelect(file, url, type);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      style={{
        width: '100%',
        aspectRatio: '1 / 1',
        border: '2px dashed var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: 'var(--bg-subtle)',
        transition: 'border-color 0.2s',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="video/*,image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {preview ? (
        <>
          {preview.type === 'VIDEO' ? (
            <video
              src={preview.url}
              playsInline
              muted
              autoPlay
              loop
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <img
              src={preview.url}
              alt="Preview"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}
          <div style={{
            position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: 0, transition: 'opacity 0.2s',
          }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
          >
            <span style={{ fontFamily: 'var(--app-font-mono)', fontSize: 11, color: 'white', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Tap to change
            </span>
          </div>
        </>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <Upload size={32} color="var(--text-muted)" strokeWidth={1} />
          <span style={{ fontFamily: 'var(--app-font-mono)', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center', padding: '0 16px' }}>
            Tap to select video or image
          </span>
        </div>
      )}
    </div>
  );
}
