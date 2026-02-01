export interface Comment {
  id: string;
  investigationId: string;
  parentId: string | null;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  createdAt: string;
  updatedAt?: string;
  reactions: Record<string, string[]>;
  attachments: Attachment[];
  mentions: string[];
  isResolved?: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'document' | 'other';
  size: number;
}

export interface CreateCommentRequest {
  investigationId: string;
  parentId?: string;
  content: string;
  mentions?: string[];
  attachments?: File[];
}

export interface CommentThread {
  id: string;
  comments: Comment[];
  title?: string;
  contextType: 'finding' | 'evidence' | 'general';
  contextId: string;
}
