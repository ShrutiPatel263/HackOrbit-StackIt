import React from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ArrowUp, ArrowDown, MessageCircle, Check } from 'lucide-react';
import { Question } from '../../types';

interface QuestionCardProps {
  question: Question;
  showVoting?: boolean;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({ question, showVoting = true }) => {
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex space-x-4">
        {/* Voting Section */}
        {showVoting && (
          <div className="flex flex-col items-center space-y-2 min-w-[3rem]">
            <button className="p-1 text-gray-400 hover:text-green-600 transition-colors">
              <ArrowUp className="w-5 h-5" />
            </button>
            <span className="text-lg font-semibold text-gray-700">
              {question.vote_count || 0}
            </span>
            <button className="p-1 text-gray-400 hover:text-red-600 transition-colors">
              <ArrowDown className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="flex flex-col items-center space-y-2 min-w-[3rem] text-center">
          <div className={`flex items-center space-x-1 ${
            question.accepted_answer_id ? 'text-green-600' : 'text-gray-500'
          }`}>
            {question.accepted_answer_id && <Check className="w-4 h-4" />}
            <span className="text-sm font-medium">
              {question.answer_count || 0}
            </span>
          </div>
          <span className="text-xs text-gray-400">answers</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <Link
            to={`/questions/${question.id}`}
            className="block hover:text-blue-600 transition-colors"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
              {question.title}
            </h3>
          </Link>

          {/* Description Preview */}
          <div 
            className="text-gray-600 text-sm mb-3 line-clamp-2"
            dangerouslySetInnerHTML={{ 
              __html: question.description.replace(/<[^>]*>/g, '').substring(0, 150) + '...'
            }}
          />

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-3">
            {question.tags.map((tag) => (
              <Link
                key={tag}
                to={`/tags/${tag}`}
                className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded hover:bg-blue-200 transition-colors"
              >
                {tag}
              </Link>
            ))}
          </div>

          {/* Meta Info */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <Link
              to={`/profile/${question.author.username}`}
              className="flex items-center space-x-2 hover:text-blue-600 transition-colors"
            >
              <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium">
                  {question.author.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <span>{question.author.username}</span>
            </Link>
            
            <span>{formatDate(question.created_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};