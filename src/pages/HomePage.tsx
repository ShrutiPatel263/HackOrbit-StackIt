import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
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
      // Check if Supabase is properly configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || 
          supabaseUrl === 'https://placeholder.supabase.co' || 
          supabaseKey === 'placeholder-key' ||
          supabaseUrl === 'https://your-project-id.supabase.co' ||
          supabaseKey === 'your-anon-key-here' ||
          supabaseUrl === 'https://xyzcompany.supabase.co' ||
          supabaseKey === 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5emNvbXBhbnkiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0MjU0MjQwMCwiZXhwIjoxOTU4MTE4NDAwfQ.example') {
        // Use mock data when Supabase is not configured
        const mockQuestions: Question[] = [
          {
            id: '1',
            title: 'How to center a div in CSS?',
            description: '<p>I\'m trying to center a div both horizontally and vertically. What\'s the best modern approach?</p>',
            tags: ['css', 'html', 'flexbox'],
            author_id: 'user1',
            author: {
              id: 'user1',
              username: 'webdev_pro',
              email: 'webdev@example.com',
              role: 'user',
              created_at: '2024-01-15T10:00:00Z'
            },
            created_at: '2024-01-20T14:30:00Z',
            updated_at: '2024-01-20T14:30:00Z',
            vote_count: 15,
            answer_count: 3,
            accepted_answer_id: 'answer1'
          },
          {
            id: '2',
            title: 'React useState vs useReducer - when to use which?',
            description: '<p>I\'m confused about when to use useState vs useReducer in React. Can someone explain the differences and use cases?</p>',
            tags: ['react', 'javascript', 'hooks'],
            author_id: 'user2',
            author: {
              id: 'user2',
              username: 'react_learner',
              email: 'learner@example.com',
              role: 'user',
              created_at: '2024-01-10T08:00:00Z'
            },
            created_at: '2024-01-19T16:45:00Z',
            updated_at: '2024-01-19T16:45:00Z',
            vote_count: 8,
            answer_count: 2
          },
          {
            id: '3',
            title: 'Best practices for API error handling in TypeScript',
            description: '<p>What are the recommended patterns for handling API errors in a TypeScript application? Should I use try-catch or error boundaries?</p>',
            tags: ['typescript', 'api', 'error-handling'],
            author_id: 'user3',
            author: {
              id: 'user3',
              username: 'ts_developer',
              email: 'tsdev@example.com',
              role: 'user',
              created_at: '2024-01-05T12:00:00Z'
            },
            created_at: '2024-01-18T09:15:00Z',
            updated_at: '2024-01-18T09:15:00Z',
            vote_count: 12,
            answer_count: 5,
            accepted_answer_id: 'answer3'
          }
        ];
        
        // Apply search filter to mock data
        let filteredQuestions = mockQuestions;
        if (searchQuery) {
          filteredQuestions = mockQuestions.filter(q => 
            q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            q.description.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
        
        // Apply sorting to mock data
        switch (sortBy) {
          case 'popular':
            filteredQuestions.sort((a, b) => b.vote_count - a.vote_count);
            break;
          case 'featured':
            filteredQuestions = filteredQuestions.filter(q => q.accepted_answer_id);
            break;
          default:
            filteredQuestions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        }
        
        setQuestions(filteredQuestions);
      } else {
        // Use real Supabase data
        let query = supabase
          .from('questions')
          .select(`
            *,
            author:users(id, username, email, role),
            answers(count)
          `);

        // Apply search filter
        if (searchQuery) {
          query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
        }

        // Apply sorting
        switch (sortBy) {
          case 'popular':
            query = query.order('vote_count', { ascending: false });
            break;
          case 'featured':
            query = query.not('accepted_answer_id', 'is', null);
            break;
          default:
            query = query.order('created_at', { ascending: false });
        }

        const { data, error } = await query.limit(20);

        if (error) {
          throw error;
        }

        // Transform the data to match our Question interface
        const transformedQuestions = data?.map(q => ({
          ...q,
          answer_count: q.answers?.[0]?.count || 0
        })) || [];
        
        setQuestions(transformedQuestions);
      }
    } catch (error) {
      console.warn('Unable to connect to Supabase, using mock data:', error);
      // Fallback to mock data on any network error
      const mockQuestions: Question[] = [
        {
          id: '1',
          title: 'How to center a div in CSS?',
          description: '<p>I\'m trying to center a div both horizontally and vertically. What\'s the best modern approach?</p>',
          tags: ['css', 'html', 'flexbox'],
          author_id: 'user1',
          author: {
            id: 'user1',
            username: 'webdev_pro',
            email: 'webdev@example.com',
            role: 'user',
            created_at: '2024-01-15T10:00:00Z'
          },
          created_at: '2024-01-20T14:30:00Z',
          updated_at: '2024-01-20T14:30:00Z',
          vote_count: 15,
          answer_count: 3,
          accepted_answer_id: 'answer1'
        },
        {
          id: '2',
          title: 'React useState vs useReducer - when to use which?',
          description: '<p>I\'m confused about when to use useState vs useReducer in React. Can someone explain the differences and use cases?</p>',
          tags: ['react', 'javascript', 'hooks'],
          author_id: 'user2',
          author: {
            id: 'user2',
            username: 'react_learner',
            email: 'learner@example.com',
            role: 'user',
            created_at: '2024-01-10T08:00:00Z'
          },
          created_at: '2024-01-19T16:45:00Z',
          updated_at: '2024-01-19T16:45:00Z',
          vote_count: 8,
          answer_count: 2
        },
        {
          id: '3',
          title: 'Best practices for API error handling in TypeScript',
          description: '<p>What are the recommended patterns for handling API errors in a TypeScript application? Should I use try-catch or error boundaries?</p>',
          tags: ['typescript', 'api', 'error-handling'],
          author_id: 'user3',
          author: {
            id: 'user3',
            username: 'ts_developer',
            email: 'tsdev@example.com',
            role: 'user',
            created_at: '2024-01-05T12:00:00Z'
          },
          created_at: '2024-01-18T09:15:00Z',
          updated_at: '2024-01-18T09:15:00Z',
          vote_count: 12,
          answer_count: 5,
          accepted_answer_id: 'answer3'
        }
      ];
      
      // Apply search filter to mock data
      let filteredQuestions = mockQuestions;
      if (searchQuery) {
        filteredQuestions = mockQuestions.filter(q => 
          q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      // Apply sorting to mock data
      switch (sortBy) {
        case 'popular':
          filteredQuestions.sort((a, b) => b.vote_count - a.vote_count);
          break;
        case 'featured':
          filteredQuestions = filteredQuestions.filter(q => q.accepted_answer_id);
          break;
        default:
          filteredQuestions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }
      
      setQuestions(filteredQuestions);
    }
    
    setLoading(false);
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
      {/* Header */}
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

      {/* Questions List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="flex space-x-2">
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                </div>
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
              : 'Be the first to ask a question in our community!'
            }
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