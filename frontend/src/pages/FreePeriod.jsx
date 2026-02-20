/**
 * Free Period - Smart suggestions based on interests/goals
 */
import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const SUGGESTION_TYPES = {
  revise: { bg: 'bg-amber-50', border: 'border-amber-200', icon: '📚' },
  coding: { bg: 'bg-blue-50', border: 'border-blue-200', icon: '💻' },
  micro: { bg: 'bg-purple-50', border: 'border-purple-200', icon: '🎬' },
  career: { bg: 'bg-green-50', border: 'border-green-200', icon: '📈' },
};

export default function FreePeriod() {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState([]);
  const [personalized, setPersonalized] = useState([]);

  useEffect(() => {
    api.get('/suggestions')
      .then(({ data }) => setSuggestions(data))
      .catch(() => {
        setSuggestions([
          { type: 'revise', title: 'Revise weak subjects', icon: '📚', description: 'Spend 30 mins on challenging topics' },
          { type: 'coding', title: 'Practice coding', icon: '💻', description: 'Solve 2-3 problems on LeetCode' },
          { type: 'micro', title: 'Watch micro-lectures', icon: '🎬', description: 'Short 10-15 min videos' },
          { type: 'career', title: 'Career skills', icon: '📈', description: 'Soft skills or certifications' },
        ]);
      });
  }, []);

  useEffect(() => {
    if (!suggestions.length || !user) return;
    const improved = user.improvementAreas?.length
      ? suggestions.map((s) => {
          if (s.type === 'revise')
            return { ...s, title: `Revise: ${user.improvementAreas[0]}`, description: `Focus on ${user.improvementAreas.join(', ')}` };
          return s;
        })
      : suggestions;
    const withGoals = user.goals?.length
      ? improved.map((s) => {
          if (s.type === 'career')
            return { ...s, description: `Work towards: ${user.goals.join(', ')}` };
          return s;
        })
      : improved;
    setPersonalized(withGoals);
  }, [suggestions, user]);

  const list = personalized.length ? personalized : suggestions;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Free Period Suggestions</h1>
      <p className="text-slate-500 mb-6">
        Use your free time productively. Suggestions based on your interests & goals.
      </p>

      {user?.interests?.length > 0 && (
        <div className="mb-6 p-4 bg-primary-50 rounded-xl border border-primary-100">
          <p className="text-sm font-medium text-primary-800">Your interests</p>
          <p className="text-sm text-primary-600">{user.interests.join(', ')}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {list.map((s, i) => (
          <div
            key={i}
            className={`p-6 rounded-xl border-2 ${SUGGESTION_TYPES[s.type]?.bg || 'bg-slate-50'} ${SUGGESTION_TYPES[s.type]?.border || 'border-slate-200'}`}
          >
            <span className="text-3xl mb-3 block">{s.icon}</span>
            <h3 className="font-semibold text-slate-800">{s.title}</h3>
            <p className="text-sm text-slate-600 mt-1">{s.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
