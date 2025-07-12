import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import { User, Question } from '../types';
import { QuestionCard } from '../components/Question/QuestionCard';
import { User as UserIcon, Calendar, Award, HelpCircle } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'questions' | 'answers'>('questions');

  useEffect(() => {
    if (username) {
      fetchUserProfile();
      fetchUserQuestions();
    }
  }, [username]);

  const fetchUserProfile = async () => {
    try {
      const response = await api.get(`/users/${username}`);
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user:', error);
      setUser(null);
    }
  };

  const fetchUserQuestions = async () => {
    try {
      const response = await api.get(`/users/${username}/questions`);
      setQuestions(response.data || []);
    } catch (error) {
      console.error('Error fetching user questions:', error);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <UserIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            User not found
          </h2>
          <p className="text-gray-500">
            The user you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Profile Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-start space-x-6">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-2xl">
              {user.username.charAt(0).toUpperCase()}
            </span>
          </div>

          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{user.username}</h1>
              {user.role === 'admin' && (
                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                  Admin
                </span>
              )}
            </div>

            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>Joined {formatDate(user.created_at)}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{questions.length}</div>
                <div className="text-sm text-gray-600">Questions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">0</div>
                <div className="text-sm text-gray-600">Answers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">0</div>
                <div className="text-sm text-gray-600">Reputation</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('questions')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'questions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <HelpCircle className="w-4 h-4" />
                <span>Questions ({questions.length})</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('answers')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'answers'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Award className="w-4 h-4" />
                <span>Answers (0)</span>
              </div>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'questions' && (
            <div>
              {questions.length === 0 ? (
                <div className="text-center py-8">
                  <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No questions yet
                  </h3>
                  <p className="text-gray-500">
                    {user.username} hasn't asked any questions yet.
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
          )}

          {activeTab === 'answers' && (
            <div className="text-center py-8">
              <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No answers yet
              </h3>
              <p className="text-gray-500">
                {user.username} hasn't answered any questions yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
