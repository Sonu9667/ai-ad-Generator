import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Wand2, Megaphone, LogOut, Plus, TrendingUp, Sparkles, Calendar } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    totalAds: 0,
    platforms: 0
  });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/campaigns`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setCampaigns(response.data);

      // Calculate stats
      const totalAds = response.data.reduce((sum, c) => sum + c.ads.length, 0);
      const platformSet = new Set(response.data.map(c => c.platform));

      setStats({
        totalCampaigns: response.data.length,
        totalAds,
        platforms: platformSet.size
      });
    } catch (error) {
      toast.error('Failed to fetch campaigns');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getPlatformBadge = (platform) => {
    const badges = {
      google: 'platform-google',
      facebook: 'platform-facebook',
      linkedin: 'platform-linkedin',
      all: 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
    };
    return badges[platform] || badges.all;
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
            className="w-full flex items-center gap-3 px-4 py-3 bg-indigo-600 rounded-lg font-medium"
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Welcome back, {user.name}!</h1>
          <p className="text-slate-600">Here's an overview of your ad campaigns</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white border border-slate-200 rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Megaphone className="w-6 h-6 text-indigo-600" />
              </div>
              <span className="text-2xl font-bold font-['Space_Grotesk'] text-slate-900">{stats.totalCampaigns}</span>
            </div>
            <p className="text-sm font-medium text-slate-600">Total Campaigns</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white border border-slate-200 rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-lime-100 rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-lime-600" />
              </div>
              <span className="text-2xl font-bold font-['Space_Grotesk'] text-slate-900">{stats.totalAds}</span>
            </div>
            <p className="text-sm font-medium text-slate-600">Ads Generated</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white border border-slate-200 rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-2xl font-bold font-['Space_Grotesk'] text-slate-900">{stats.platforms}</span>
            </div>
            <p className="text-sm font-medium text-slate-600">Platforms</p>
          </motion.div>
        </div>

        {/* Create New Campaign Button */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/generator')}
            data-testid="create-campaign-btn"
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create New Campaign
          </button>
        </div>

        {/* Campaigns List */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Recent Campaigns</h2>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="loading-spinner"></div>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-12">
              <Wand2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 mb-4">No campaigns yet. Create your first AI-powered campaign!</p>
              <button
                onClick={() => navigate('/generator')}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold btn-primary"
              >
                Get Started
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {campaigns.map((campaign) => (
                <motion.div
                  key={campaign.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => navigate(`/campaigns/${campaign.id}`)}
                  data-testid={`campaign-card-${campaign.id}`}
                  className="border border-slate-200 rounded-lg p-6 hover:border-indigo-500 cursor-pointer ad-card"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-1">{campaign.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Calendar className="w-4 h-4" />
                        {formatDate(campaign.created_at)}
                      </div>
                    </div>
                    <span className={`platform-badge ${getPlatformBadge(campaign.platform)}`}>
                      {campaign.platform}
                    </span>
                  </div>

                  <p className="text-sm text-slate-600 mb-4 line-clamp-2">{campaign.product}</p>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">{campaign.ads.length} ad variations</span>
                    <span className="text-indigo-600 font-medium hover:underline">View Details →</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
