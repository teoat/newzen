'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, Reply, MoreHorizontal, Smile, Paperclip } from 'lucide-react';
import type { Comment } from './types';
import { CommentInput } from './CommentInput';

interface CommentItemProps {
  comment: Comment;
  onReply: (parentId: string, content: string, mentions: string[]) => void;
  onReact: (commentId: string, emoji: string) => void;
  onEdit: (commentId: string, content: string) => void;
  onDelete: (commentId: string) => void;
  depth?: number;
  currentUserId?: string;
}

const reactionEmojis = ['👍', '👎', '❤️', '🎉', '🤔', '👀'];

export function CommentItem({
  comment,
  onReply,
  onReact,
  onEdit,
  onDelete,
  depth = 0,
  currentUserId,
}: CommentItemProps) {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const handleEdit = () => {
    onEdit(comment.id, editContent);
    setIsEditing(false);
  };

  const isOwnComment = comment.authorId === currentUserId;

  return (
    <div className={`${depth > 0 ? 'ml-8 border-l-2 border-white/10 pl-4' : ''} py-3`}>
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-sm font-medium text-indigo-400">
            {comment.authorName.charAt(0).toUpperCase()}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-white text-sm">{comment.authorName}</span>
            <span className="text-xs text-slate-500">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </span>
            {comment.isResolved && (
              <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full">
                Resolved
              </span>
            )}
          </div>

          {isEditing ? (
            <div className="mt-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-2 bg-slate-800 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 resize-none"
                rows={3}
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleEdit}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 text-slate-400 hover:text-white text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-300 whitespace-pre-wrap">{comment.content}</div>
          )}

          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={() => setShowReplyInput(!showReplyInput)}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-white transition-colors"
            >
              <Reply className="w-3 h-3" />
              Reply
            </button>

            <div className="relative">
              <button
                onClick={() => setShowReactions(!showReactions)}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-white transition-colors"
              >
                <Smile className="w-3 h-3" />
                React
              </button>
              {showReactions && (
                <div className="absolute top-full mt-1 flex gap-1 p-1 bg-slate-800 border border-white/10 rounded-lg shadow-xl z-10">
                  {reactionEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        onReact(comment.id, emoji);
                        setShowReactions(false);
                      }}
                      className="p-1 hover:bg-slate-700 rounded transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {Object.entries(comment.reactions).length > 0 && (
              <div className="flex gap-1">
                {Object.entries(comment.reactions).map(([emoji, users]) =>
                  (users as string[]).length > 0 ? (
                    <button
                      key={emoji}
                      onClick={() => onReact(comment.id, emoji)}
                      className="flex items-center gap-1 px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded-full text-xs transition-colors"
                    >
                      <span>{emoji}</span>
                      <span className="text-slate-400">{users.length}</span>
                    </button>
                  ) : null
                )}
              </div>
            )}

            {comment.attachments.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Paperclip className="w-3 h-3" />
                <span>{comment.attachments.length} attachment(s)</span>
              </div>
            )}

            <div className="relative ml-auto">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 text-slate-500 hover:text-white transition-colors"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-32 py-1 bg-slate-800 border border-white/10 rounded-lg shadow-xl z-10">
                  {isOwnComment && (
                    <>
                      <button
                        onClick={() => {
                          setIsEditing(true);
                          setShowMenu(false);
                        }}
                        className="w-full px-3 py-2 text-left text-xs text-slate-300 hover:bg-slate-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          onDelete(comment.id);
                          setShowMenu(false);
                        }}
                        className="w-full px-3 py-2 text-left text-xs text-red-400 hover:bg-slate-700"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {showReplyInput && (
            <div className="mt-3">
              <CommentInput
                onSubmit={(content: string, mentions: string[]) => {
                  onReply(comment.id, content, mentions);
                  setShowReplyInput(false);
                }}
                onCancel={() => setShowReplyInput(false)}
                placeholder="Write a reply..."
                autoFocus
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
