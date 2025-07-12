import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Question, Answer } from '../types';
import { RichTextEditor } from '../components/Editor/RichTextEditor';
import { ArrowUp, ArrowDown, Check, MessageCircle, Edit, Flag } from 'lucide-react';

export const QuestionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [question, setQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [answerContent, setAnswerContent] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);

  useEffect(() => {
    if (id) {
      fetchQuestion();
      fetchAnswers();
    }
  }, [id]);

  const fetchQuestion = async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from('questions')
      .select(`
        *,
        author:users(id, username, email, role)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching question:', error);
      navigate('/');
    } else {
      setQuestion(data);
    }
  };

  const fetchAnswers = async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from('answers')
      .select(`
        *,
        author:users(id, username, email, role)
      `)
      .eq('question_id', id)
      .order('is_accepted', { ascending: false })
      .order('vote_count', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching answers:', error);
    } else {
      setAnswers(data || []);
    }
    
    setLoading(false);
  };

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !question || !answerContent.trim()) return;

    setSubmittingAnswer(true);

    try {
      const { data, error } = await supabase
        .from('answers')
        .insert([
          {
            content: answerContent,
            question_id: question.id,
            author_id: user.id
          }
        ])
        .select(`
          *,
          author:users(id, username, email, role)
        `)
        .single();

      if (error) throw error;

      setAnswers([...answers, data]);
      setAnswerContent('');

      // Create notification for question author
      if (question.author_id !== user.id) {
        await supabase.from('notifications').insert([
          {
            user_id: question.author_id,
            type: 'answer',
            title: 'New answer to your question',
            message: `${user.email} answered your question: ${question.title}`,
            related_id: question.id
          }
        ]);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const handleAcceptAnswer = async (answerId: string) => {
    if (!user || !question || question.author_id !== user.id) return;

    try {
      // Update the question to set accepted answer
      await supabase
        .from('questions')
        .update({ accepted_answer_id: answerId })
        .eq('id', question.id);

      // Update local state
      setQuestion({ ...question, accepted_answer_id: answerId });
      setAnswers(answers.map(answer => ({
        ...answer,
        is_accepted: answer.id === answerId
      })));
    } catch (error) {
      console.error('Error accepting answer:', error);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded mb-6 w-3/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Question not found
          </h2>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Question */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex space-x-4">
          {/* Voting */}
          <div className="flex flex-col items-center space-y-2">
            <button className="p-2 text-gray-400 hover:text-green-600 transition-colors">
              <ArrowUp className="w-6 h-6" />
            </button>
            <span className="text-xl font-semibold text-gray-700">
              {question.vote_count || 0}
            </span>
            <button className="p-2 text-gray-400 hover:text-red-600 transition-colors">
              <ArrowDown className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {question.title}
            </h1>

            <div 
              className="prose prose-sm max-w-none mb-6"
              dangerouslySetInnerHTML={{ __html: question.description }}
            />

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {question.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Meta Info */}
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center space-x-4">
                <span>Asked {formatDate(question.created_at)}</span>
                <span>{answers.length} answer{answers.length !== 1 ? 's' : ''}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium">
                    {question.author.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span>{question.author.username}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Answers */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {answers.length} Answer{answers.length !== 1 ? 's' : ''}
        </h2>

        <div className="space-y-6">
          {answers.map((answer) => (
            <div
              key={answer.id}
              className={`bg-white rounded-lg border p-6 ${
                answer.is_accepted ? 'border-green-200 bg-green-50' : 'border-gray-200'
              }`}
            >
              <div className="flex space-x-4">
                {/* Voting */}
                <div className="flex flex-col items-center space-y-2">
                  <button className="p-2 text-gray-400 hover:text-green-600 transition-colors">
                    <ArrowUp className="w-5 h-5" />
                  </button>
                  <span className="text-lg font-semibold text-gray-700">
                    {answer.vote_count || 0}
                  </span>
                  <button className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                    <ArrowDown className="w-5 h-5" />
                  </button>
                  
                  {/* Accept Answer Button */}
                  {user?.id === question.author_id && !answer.is_accepted && (
                    <button
                      onClick={() => handleAcceptAnswer(answer.id)}
                      className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                      title="Accept this answer"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                  )}
                  
                  {answer.is_accepted && (
                    <div className="p-2 text-green-600" title="Accepted answer">
                      <Check className="w-5 h-5 fill-current" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div 
                    className="prose prose-sm max-w-none mb-4"
                    dangerouslySetInnerHTML={{ __html: answer.content }}
                  />

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Answered {formatDate(answer.created_at)}</span>
                    
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium">
                          {answer.author.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span>{answer.author.username}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Answer Form */}
      {user ? (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Your Answer
          </h3>
          
          <form onSubmit={handleSubmitAnswer}>
            <RichTextEditor
              content={answerContent}
              onChange={setAnswerContent}
              placeholder="Share your knowledge and help the community..."
              className="mb-4"
            />
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submittingAnswer || !answerContent.trim()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingAnswer ? 'Submitting...' : 'Post Answer'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 text-center">
          <p className="text-gray-600 mb-4">
            Sign in to post an answer and help the community.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In
          </button>
        </div>
      )}
    </div>
  );
};