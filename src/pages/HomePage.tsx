import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from '../api';
import { Question } from '../types';
import { QuestionCard } from '../components/Question/QuestionCard';
import { Search, Filter, TrendingUp } from 'lucide-react';

interface HomePageProps {
  sortBy?: 'recent' | 'popular' | 'featured';
}

export const HomePage: React.FC<HomePageProps> = ({ sortBy = 'recent' }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q');

  useEffect(() => {
    fetchQuestions();
  }, [sortBy, searchQuery]);

  const fetchQuestions = async () => {
    setLoading(true);

    try {
      const response = await axios.get('/questions', {
        params: {
          sortBy,
          q: searchQuery || ''
        }
      });

      setQuestions(response.data || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
      setQuestions([]); // fallback to empty
    } finally {
      setLoading(false);
    }
  };

  const getPageTitle = () => {
    if (searchQuery) return `Search results for "${searchQuery}"`;
    switch (sortBy) {
      case 'popular': return 'Popular Questions';
      case 'featured': return 'Featured Questions';
      default: return 'Recent Questions';
    }
  };

  const getPageIcon = () => {
    switch (sortBy) {
      case 'popular': return <TrendingUp className="w-5 h-5" />;
      case 'featured': return <Filter className="w-5 h-5" />;
      default: return <Search className="w-5 h-5" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          {getPageIcon()}
          <h1 className="text-2xl font-bold text-gray-900">{getPageTitle()}</h1>
        </div>
        {searchQuery && (
          <p className="text-gray-600">
            Found {questions.length} result{questions.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="flex space-x-2">
                <div className="h-6 bg-gray-200 rounded w-16"></div>
                <div className="h-6 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? 'No questions found' : 'No questions yet'}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchQuery
              ? 'Try adjusting your search terms or browse all questions.'
              : 'Be the first to ask a question in our community!'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((question) => (
            <QuestionCard key={question.id} question={question} />
          ))}
        </div>
      )}
    </div>
  );
};
