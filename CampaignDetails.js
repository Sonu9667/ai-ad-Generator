import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Wand2, LogOut, Sparkles, ArrowLeft, Download, Trash2, Copy, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CampaignDetails = ({ user, onLogout }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    fetchCampaign();
  }, [id]);

  const fetchCampaign = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/campaigns/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCampaign(response.data);
    } catch (error) {
      toast.error('Failed to fetch campaign');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this campaign?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/campaigns/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Campaign deleted successfully');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Failed to delete campaign');
    }
  };

  const copyToClipboard = (text, adId) => {
    navigator.clipboard.writeText(text);
    setCopiedId(adId);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getPlatformBadge = (platform) => {
    const badges = {
      google: 'platform-google',
      facebook: 'platform-facebook',
      linkedin: 'platform-linkedin'
    };
    return badges[platform] || 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading-spinner"></div>
      </div>
    );
  }

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
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 rounded-lg font-medium transition-colors"
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

        {campaign && (
          <div>
            {/* Campaign Header */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8 mb-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-4xl font-bold text-slate-900 mb-2">{campaign.name}</h1>
                  <p className="text-slate-600">{campaign.product}</p>
                </div>
                <button
                  onClick={handleDelete}
                  data-testid="delete-campaign-btn"
                  className="px-4 py-2 text-red-600 hover:bg-red-50 border border-red-200 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Target Audience</p>
                  <p className="font-medium text-slate-900">{campaign.target_audience}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Platform</p>
                  <span className={`platform-badge ${getPlatformBadge(campaign.platform)}`}>
                    {campaign.platform}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Tone</p>
                  <p className="font-medium text-slate-900 capitalize">{campaign.tone}</p>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-sm text-slate-500 mb-1">Key Benefits</p>
                <p className="text-slate-900">{campaign.key_benefits}</p>
              </div>
            </div>

            {/* Generated Ads */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                Generated Ads ({campaign.ads.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {campaign.ads.map((ad, index) => (
                <motion.div
                  key={ad.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  data-testid={`ad-card-${ad.id}`}
                  className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden ad-card"
                >
                  {/* Ad Image */}
                  {ad.image_base64 ? (
                    <div className="w-full h-64 bg-slate-100 overflow-hidden">
                      <img
                        src={`data:image/png;base64,${ad.image_base64}`}
                        alt={ad.headline}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-64 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                      <Sparkles className="w-16 h-16 text-white/50" />
                    </div>
                  )}

                  {/* Ad Content */}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className={`platform-badge ${getPlatformBadge(ad.platform)}`}>
                        {ad.platform}
                      </span>
                      <button
                        onClick={() => copyToClipboard(`${ad.headline}\n${ad.description}\n${ad.cta}`, ad.id)}
                        data-testid={`copy-ad-${ad.id}`}
                        className="text-slate-400 hover:text-indigo-600 transition-colors"
                      >
                        {copiedId === ad.id ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <Copy className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">
                          Headline
                        </label>
                        <p className="text-lg font-bold text-slate-900">{ad.headline}</p>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">
                          Description
                        </label>
                        <p className="text-slate-700 leading-relaxed">{ad.description}</p>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">
                          Call to Action
                        </label>
                        <p className="text-indigo-600 font-semibold">{ad.cta}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignDetails;
