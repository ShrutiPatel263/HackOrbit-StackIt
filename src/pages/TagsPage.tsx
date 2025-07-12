import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Tag as TagIcon, Search } from 'lucide-react';

interface Tag {
  name: string;
  count: number;
}

export const TagsPage: React.FC = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      // Get all questions and extract tags
      const { data: questions, error } = await supabase
        .from('questions')
        .select('tags');

      if (error) throw error;

      // Count tag frequencies
      const tagCounts: { [key: string]: number } = {};
      
      questions?.forEach(question => {
        question.tags.forEach((tag: string) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      });

      // Convert to array and sort by count
      const tagsArray = Object.entries(tagCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      setTags(tagsArray);
    } catch (error) {
      console.error('Error fetching tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <TagIcon className="w-6 h-6 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Tags</h1>
        </div>
        <p className="text-gray-600 mb-6">
          Browse questions by topic and find exactly what you're looking for.
        </p>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredTags.length === 0 ? (
        <div className="text-center py-12">
          <TagIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? 'No tags found' : 'No tags yet'}
          </h3>
          <p className="text-gray-500">
            {searchQuery 
              ? 'Try adjusting your search terms.'
              : 'Tags will appear as questions are posted with relevant topics.'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTags.map((tag) => (
            <Link
              key={tag.name}
              to={`/tags/${tag.name}`}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md hover:border-blue-300 transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full group-hover:bg-blue-200 transition-colors">
                  {tag.name}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {tag.count} question{tag.count !== 1 ? 's' : ''}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};