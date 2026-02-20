/**
 * Profile page - Edit interests, goals, improvement areas
 */
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({
    interests: '',
    goals: '',
    improvementAreas: ''
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        interests: (user.interests || []).join(', '),
        goals: (user.goals || []).join(', '),
        improvementAreas: (user.improvementAreas || []).join(', ')
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaved(false);
    await updateProfile({
      interests: form.interests.split(',').map((s) => s.trim()).filter(Boolean),
      goals: form.goals.split(',').map((s) => s.trim()).filter(Boolean),
      improvementAreas: form.improvementAreas.split(',').map((s) => s.trim()).filter(Boolean)
    });
    setSaved(true);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Profile</h1>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 max-w-xl">
        <div className="mb-6">
          <p className="text-slate-500 text-sm">Name</p>
          <p className="font-medium">{user?.name}</p>
        </div>
        <div className="mb-6">
          <p className="text-slate-500 text-sm">Email</p>
          <p className="font-medium">{user?.email}</p>
        </div>
        <div className="mb-6">
          <p className="text-slate-500 text-sm">Role</p>
          <p className="font-medium capitalize">{user?.role}</p>
        </div>

        {user?.role === 'student' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Interests</label>
              <input
                name="interests"
                value={form.interests}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary-500"
                placeholder="Programming, AI, Design"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Goals</label>
              <input
                name="goals"
                value={form.goals}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary-500"
                placeholder="Build projects, Learn web dev"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Improvement Areas</label>
              <input
                name="improvementAreas"
                value={form.improvementAreas}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary-500"
                placeholder="Mathematics, Physics"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg"
            >
              Save
            </button>
            {saved && <span className="ml-3 text-green-600 text-sm">Saved!</span>}
          </form>
        )}
      </div>
    </div>
  );
}
