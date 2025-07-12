export interface User {
  id: string;
  email: string;
  username: string;
  role: 'user' | 'admin';
  avatar_url?: string;
  created_at: string;
}

export interface Question {
  id: string;
  title: string;
  description: string;
  tags: string[];
  author_id: string;
  author: User;
  created_at: string;
  updated_at: string;
  vote_count: number;
  answer_count: number;
  accepted_answer_id?: string;
}

export interface Answer {
  id: string;
  content: string;
  question_id: string;
  author_id: string;
  author: User;
  created_at: string;
  updated_at: string;
  vote_count: number;
  is_accepted: boolean;
}

export interface Vote {
  id: string;
  user_id: string;
  target_id: string;
  target_type: 'question' | 'answer';
  vote_type: 'up' | 'down';
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'answer' | 'comment' | 'mention';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  related_id?: string;
}

export interface Tag {
  id: string;
  name: string;
  description?: string;
  question_count: number;
  created_at: string;
}