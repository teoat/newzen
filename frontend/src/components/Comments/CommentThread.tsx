'use client';

import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { CommentItem } from './CommentItem';
import { CommentInput } from './CommentInput';
import type { Comment } from './types';

interface CommentThreadProps {
  comments: Comment[];
  onAddComment: (parentId: string | null, content: string, mentions: string[]) => void;
  onEditComment: (commentId: string, content: string) => void;
  onDeleteComment: (commentId: string) => void;
  onReact: (commentId: string, emoji: string) => void;
  currentUserId?: string;
  currentUserName?: string;
}

export function CommentThread({
  comments,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onReact,
  currentUserId = 'current-user',
  currentUserName = 'You',
}: CommentThreadProps) {
  const rootComments = comments.filter((c) => !c.parentId);
  const getReplies = (parentId: string) => comments.filter((c) => c.parentId === parentId);

  const renderCommentWithReplies = (comment: Comment, depth = 0) => {
    const replies = getReplies(comment.id);

    return (
      <div key={comment.id}>
        <CommentItem
          comment={comment}
          onReply={onAddComment}
          onReact={onReact}
          onEdit={onEditComment}
          onDelete={onDeleteComment}
          depth={depth}
          currentUserId={currentUserId}
        />
        {replies.length > 0 && (
          <div className="mt-2">
            {replies.map((reply) => renderCommentWithReplies(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-slate-900/50 border border-white/10 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-slate-800/30">
        <MessageCircle className="w-4 h-4 text-indigo-400" />
        <span className="font-medium text-white">{comments.length} Comments</span>
      </div>

      <div className="p-4">
        <div className="mb-6">
          <CommentInput
            onSubmit={(content, mentions) => onAddComment(null, content, mentions)}
            placeholder="Add a comment..."
          />
        </div>

        <div className="space-y-2">
          {rootComments.length > 0 ? (
            rootComments.map((comment) => renderCommentWithReplies(comment))
          ) : (
            <div className="text-center py-8 text-slate-500">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No comments yet. Start the discussion!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
