import { useState, KeyboardEvent } from 'react';
import { X } from 'lucide-react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
}

export function TagInput({ tags, onChange, placeholder = 'Add hashtag...', maxTags = 10 }: TagInputProps) {
  const [input, setInput] = useState('');

  const addTag = (raw: string) => {
    const tag = raw.replace(/^#+/, '').trim().toLowerCase();
    if (!tag || tags.includes(tag) || tags.length >= maxTags) return;
    onChange([...tags, tag]);
    setInput('');
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag));
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === ',') {
      e.preventDefault();
      addTag(input);
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
        padding: '8px 12px',
        border: '1px solid var(--border)',
        backgroundColor: 'var(--bg-subtle)',
        minHeight: 44,
        alignItems: 'center',
      }}
    >
      {tags.map((tag) => (
        <span
          key={tag}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            backgroundColor: 'var(--bg-subtle)',
            border: '1px solid var(--border)',
            color: 'var(--green)',
            fontFamily: 'var(--app-font-mono)',
            fontSize: 11,
            padding: '2px 8px',
            borderRadius: 2,
          }}
        >
          #{tag}
          <button
            onClick={() => removeTag(tag)}
            style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
          >
            <X size={10} />
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKey}
        onBlur={() => input && addTag(input)}
        placeholder={tags.length === 0 ? placeholder : ''}
        style={{
          flex: 1,
          minWidth: 100,
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: 'var(--text-primary)',
          fontFamily: 'var(--app-font-mono)',
          fontSize: 12,
          padding: 0,
        }}
      />
    </div>
  );
}
