import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Wand2, LogOut, Sparkles, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdGenerator = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    product: '',
    target_audience: '',
    platform: 'all',
    tone: 'professional',
    key_benefits: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API}/campaigns/generate`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Campaign generated successfully!');
      navigate(`/campaigns/${response.data.id}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to generate campaign');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-zinc-900 text-white p-6">
        <div className="flex items-center gap-2 mb-10">
          <Sparkles className="w-8 h-8 text-indigo-500" />
          <span className="text-xl font-bold font-['Outfit']">AdGenius</span>
        </div>

        <nav className="space-y-2">
          <button
            onClick={() => navigate('/dashboard')}
            data-testid="nav-dashboard-btn"
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 rounded-lg font-medium transition-colors"
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </button>
          <button
            onClick={() => navigate('/generator')}
            data-testid="nav-generator-btn"
            className="w-full flex items-center gap-3 px-4 py-3 bg-indigo-600 rounded-lg font-medium"
          >
            <Wand2 className="w-5 h-5" />
            Ad Generator
          </button>
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <div className="p-4 bg-zinc-800 rounded-lg mb-4">
            <p className="text-sm text-slate-400 mb-1">Logged in as</p>
            <p className="font-medium truncate">{user.email}</p>
          </div>
          <button
            onClick={onLogout}
            data-testid="logout-btn"
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 rounded-lg font-medium transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        <button
          onClick={() => navigate('/dashboard')}
          data-testid="back-to-dashboard-btn"
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        <div className="max-w-4xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Create Ad Campaign</h1>
            <p className="text-slate-600">Fill in the details below and let AI generate your campaign</p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-slate-200 rounded-xl shadow-sm p-8"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Campaign Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Campaign Name
                </label>
                <input
                  type="text"
                  data-testid="campaign-name-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent input-field text-slate-900"
                  placeholder="e.g., Summer Product Launch"
                  required
                />
              </div>

              {/* Product/Service */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Product or Service
                </label>
                <input
                  type="text"
                  data-testid="product-input"
                  value={formData.product}
                  onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent input-field text-slate-900"
                  placeholder="e.g., Premium wireless headphones"
                  required
                />
              </div>

              {/* Target Audience */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Target Audience
                </label>
                <input
                  type="text"
                  data-testid="audience-input"
                  value={formData.target_audience}
                  onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent input-field text-slate-900"
                  placeholder="e.g., Tech-savvy millennials aged 25-40"
                  required
                />
              </div>

              {/* Key Benefits */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Key Benefits
                </label>
                <textarea
                  data-testid="benefits-input"
                  value={formData.key_benefits}
                  onChange={(e) => setFormData({ ...formData, key_benefits: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent input-field text-slate-900"
                  placeholder="e.g., Active noise cancellation, 30-hour battery life, premium sound quality"
                  rows="3"
                  required
                />
              </div>

              {/* Platform Selection */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Target Platform
                </label>
                <select
                  data-testid="platform-select"
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent input-field text-slate-900"
                >
                  <option value="all">All Platforms</option>
                  <option value="google">Google Ads</option>
                  <option value="facebook">Facebook/Instagram</option>
                  <option value="linkedin">LinkedIn</option>
                </select>
              </div>

              {/* Tone */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Tone of Voice
                </label>
                <select
                  data-testid="tone-select"
                  value={formData.tone}
                  onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent input-field text-slate-900"
                >
                  <option value="professional">Professional</option>
                  <option value="casual">Casual & Friendly</option>
                  <option value="urgent">Urgent & Compelling</option>
                  <option value="playful">Playful & Fun</option>
                </select>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  data-testid="generate-campaign-btn"
                  disabled={loading}
                  className="w-full px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Generating Campaign...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-5 h-5" />
                      Generate Campaign with AI
                    </>
                  )}
                </button>
                {loading && (
                  <p className="text-sm text-slate-500 text-center mt-4">
                    This may take up to 60 seconds. Creating AI-powered ads and images...
                  </p>
                )}
              </div>
            </form>
          </motion.div>

          {/* Info Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 p-6 bg-indigo-50 border border-indigo-200 rounded-xl"
          >
            <div className="flex gap-3">
              <Sparkles className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-indigo-900 mb-1">AI-Powered Generation</h3>
                <p className="text-sm text-indigo-700 leading-relaxed">
                  Our AI will create multiple ad variations with compelling copy and custom images optimized for your selected platform(s). Each campaign typically generates 2-6 unique ad variations.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AdGenerator;
