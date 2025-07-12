import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { RichTextEditor } from '../components/Editor/RichTextEditor';
import { X, Plus } from 'lucide-react';

export const AskQuestionPage: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = currentTag.trim().toLowerCase();
      if (tag && !tags.includes(tag) && tags.length < 5) {
        setTags([...tags, tag]);
        setCurrentTag('');
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to ask a question');
      return;
    }

    if (!title.trim() || !description.trim() || tags.length === 0) {
      setError('Please fill in all fields and add at least one tag');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase
        .from('questions')
        .insert([
          {
            title: title.trim(),
            description,
            tags,
            author_id: user.id
          }
        ])
        .select()
        .single();

      if (error) throw error;

      navigate(`/questions/${data.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create question');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Sign in required
          </h2>
          <p className="text-gray-600 mb-6">
            You need to be signed in to ask a question.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Ask a Question</h1>
        <p className="text-gray-600">
          Get help from our community by asking a clear, detailed question.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Question Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., How do I center a div in CSS?"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength={200}
          />
          <p className="text-sm text-gray-500 mt-1">
            Be specific and concise. {title.length}/200 characters
          </p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Question Description
          </label>
          <RichTextEditor
            content={description}
            onChange={setDescription}
            placeholder="Provide more details about your question. Include what you've tried and what specific help you need..."
            className="min-h-[300px]"
          />
          <p className="text-sm text-gray-500 mt-1">
            Include relevant code, error messages, and what you've already tried.
          </p>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags
          </label>
          <div className="border border-gray-300 rounded-lg p-3 min-h-[3rem] flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {tags.length < 5 && (
              <input
                type="text"
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="Add a tag (press Enter)"
                className="flex-1 min-w-[150px] outline-none text-sm"
              />
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Add up to 5 relevant tags. Press Enter or comma to add a tag.
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Publishing...' : 'Publish Question'}
          </button>
        </div>
      </form>
    </div>
  );
};