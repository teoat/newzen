'use client';

import { useState, useCallback, useRef } from 'react';
import { Send, Image, Paperclip, X } from 'lucide-react';

interface CommentInputProps {
  onSubmit: (content: string, mentions: string[]) => void;
  onCancel?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  initialContent?: string;
}

export function CommentInput({
  onSubmit,
  onCancel,
  placeholder = 'Write a comment...',
  autoFocus = false,
  initialContent = '',
}: CommentInputProps) {
  const [content, setContent] = useState(initialContent);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const teamMembers = ['@john', '@jane', '@mike', '@sarah', '@alex'];

  const filteredMembers = teamMembers.filter((member) =>
    member.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const position = e.target.selectionStart;
    setContent(value);
    setCursorPosition(position);

    const beforeCursor = value.slice(0, position);
    const atMention = beforeCursor.match(/@(\w*)$/);
    if (atMention) {
      setMentionSearch(atMention[1]);
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      setShowMentions(false);
      onCancel?.();
    }
  };

  const handleSubmit = () => {
    if (!content.trim()) return;

    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;
    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1]);
    }

    onSubmit(content, mentions);
    setContent('');
  };

  const insertMention = (member: string) => {
    const beforeMention = content.slice(0, cursorPosition).replace(/@\w*$/, '');
    const afterMention = content.slice(cursorPosition);
    setContent(beforeMention + member + afterMention);
    setShowMentions(false);
    textareaRef.current?.focus();
  };

  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1]);
    }
    return mentions;
  };

  return (
    <div className="relative">
      <div className="flex items-start gap-2 p-3 bg-slate-800/50 border border-white/10 rounded-xl">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-slate-500 resize-none min-h-[60px]"
          rows={2}
        />

        <div className="flex items-center gap-1">
          <button
            type="button"
            className="p-2 text-slate-500 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            title="Attach image"
          >
            <Image className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="p-2 text-slate-500 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            title="Attach file"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!content.trim()}
            className="p-2 text-indigo-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Send comment"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showMentions && filteredMembers.length > 0 && (
        <div className="absolute bottom-full left-0 mb-1 w-40 py-1 bg-slate-800 border border-white/10 rounded-lg shadow-xl z-20">
          {filteredMembers.map((member) => (
            <button
              key={member}
              onClick={() => insertMention(member)}
              className="w-full px-3 py-2 text-left text-sm text-white hover:bg-slate-700 transition-colors"
            >
              {member}
            </button>
          ))}
        </div>
      )}

      {onCancel && (
        <div className="flex justify-end mt-2">
          <button
            onClick={onCancel}
            className="px-3 py-1 text-xs text-slate-500 hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
