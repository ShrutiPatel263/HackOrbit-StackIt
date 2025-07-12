import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import axios from 'axios';
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
    try {
      const response = await axios.get(`/api/questions/${id}`);
      setQuestion(response.data);
    } catch (error) {
      console.error('Error fetching question:', error);
      navigate('/');
    }
  };

  const fetchAnswers = async () => {
    try {
      const response = await axios.get(`/api/questions/${id}/answers`);
      setAnswers(response.data);
    } catch (error) {
      console.error('Error fetching answers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !question || !answerContent.trim()) return;

    setSubmittingAnswer(true);

    try {
      const response = await axios.post('/api/answers', {
        content: answerContent,
        question_id: question.id,
        author_id: user.id
      });

      setAnswers([...answers, response.data]);
      setAnswerContent('');

      if (question.author_id !== user.id) {
        await axios.post('/api/notifications', {
          user_id: question.author_id,
          type: 'answer',
          title: 'New answer to your question',
          message: `${user.email} answered your question: ${question.title}`,
          related_id: question.id
        });
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
      await axios.patch(`/api/questions/${question.id}/accept`, {
        answerId
      });

      setQuestion({ ...question, accepted_answer_id: answerId });
      setAnswers(
        answers.map((answer) => ({
          ...answer,
          is_accepted: answer.id === answerId
        }))
      );
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
      {/* Question Display */}
      {/* ... same JSX ... */}
    </div>
  );
};
