import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Award, Coins, Trophy, Calendar, Sparkles, TrendingUp, History, ShieldAlert } from 'lucide-react';
import { api } from '../../services/api';

export default function Rewards() {
  const { currentUser } = useOutletContext();

  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [badges, setBadges] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadRewardsData();
  }, []);

  const loadRewardsData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch all rewards endpoint data in parallel
      const [walletRes, txRes, badgesRes, leaderboardRes] = await Promise.all([
        api.getWallet(),
        api.getTransactions(),
        api.getBadges(),
        api.getLeaderboard()
      ]);

      setWallet(walletRes.data?.wallet || { balance: 0 });
      setTransactions(txRes.data?.transactions || []);
      setBadges(badgesRes.data?.badges || []);
      setLeaderboard(leaderboardRes.data?.leaderboard || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load gamification and rewards data.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner"></div>
        <p>Loading achievements and rewards...</p>
      </div>
    );
  }

  return (
    <div className="rewards-container">
      {/* Welcome & Overview Header */}
      <div className="rewards-header-banner">
        <div className="banner-details">
          <h1>Achievements & Rewards</h1>
          <p>Earn XP Coins by completing courses, passing quizzes, and finishing tasks!</p>
        </div>
        <Sparkles className="banner-sparkle" size={48} />
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Top Stats Cards */}
      <div className="rewards-stats-grid">
        {/* Wallet Balance Card */}
        <div className="reward-stat-card card-gold">
          <div className="card-header-icon">
            <Coins size={32} />
          </div>
          <div className="stat-value-group">
            <span className="stat-label">Your Coin Balance</span>
            <h2>{wallet?.balance || 0} Coins</h2>
            <p className="stat-note">10 Coins per lesson, 50 per course</p>
          </div>
        </div>

        {/* Badges Earned Card */}
        <div className="reward-stat-card card-purple">
          <div className="card-header-icon">
            <Award size={32} />
          </div>
          <div className="stat-value-group">
            <span className="stat-label">Badges Collected</span>
            <h2>{badges.length} Badges</h2>
            <p className="stat-note">Earned upon course completions</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Leaderboard & Badges & Transactions */}
      <div className="rewards-content-layout">
        {/* Leaderboard Section */}
        <section className="rewards-left-column">
          <div className="rewards-panel-card">
            <div className="panel-header">
              <Trophy size={20} className="text-gold" />
              <h3>Global Leaderboard</h3>
            </div>
            
            <div className="table-responsive">
              <table className="leaderboard-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>User Email</th>
                    <th>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="table-empty">
                        <Trophy size={24} />
                        <p>No leaderboard records yet.</p>
                      </td>
                    </tr>
                  ) : (
                    leaderboard.map((item, idx) => {
                      const userEmail = item.user_id?.email || 'Unknown User';
                      const isMe = currentUser && userEmail === currentUser.email;
                      const rank = idx + 1;
                      
                      let rankClass = '';
                      if (rank === 1) rankClass = 'rank-gold';
                      else if (rank === 2) rankClass = 'rank-silver';
                      else if (rank === 3) rankClass = 'rank-bronze';

                      return (
                        <tr key={item._id} className={`${isMe ? 'row-highlight' : ''}`}>
                          <td>
                            <span className={`rank-badge ${rankClass}`}>{rank}</span>
                          </td>
                          <td>
                            <strong className="user-name-text">
                              {userEmail.split('@')[0]}
                            </strong>
                            {isMe && <span className="badge badge-accent btn-xs" style={{ marginLeft: '8px' }}>YOU</span>}
                          </td>
                          <td>
                            <span className="coins-value">{item.balance} Coins</span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Badges & History Right Column */}
        <section className="rewards-right-column">
          {/* Earned Badges Showcase */}
          <div className="rewards-panel-card mb-6">
            <div className="panel-header">
              <Award size={20} className="text-purple" />
              <h3>Earned Badges</h3>
            </div>
            <div className="badges-list">
              {badges.length === 0 ? (
                <div className="empty-substate">
                  <ShieldAlert size={28} />
                  <p>Complete a course to earn your first graduation badge!</p>
                </div>
              ) : (
                <div className="badges-grid">
                  {badges.map((badge, idx) => (
                    <div key={idx} className="badge-item-card">
                      <div className="badge-logo-bg">
                        <Award size={24} />
                      </div>
                      <div className="badge-desc">
                        <h4>{badge.badge_name}</h4>
                        <span className="date-badge">
                          <Calendar size={10} />
                          {badge.earned_at ? new Date(badge.earned_at).toLocaleDateString() : 'Earned'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Transactions Log */}
          <div className="rewards-panel-card">
            <div className="panel-header">
              <History size={20} className="text-neutral" />
              <h3>Transaction History</h3>
            </div>
            <div className="transactions-list">
              {transactions.length === 0 ? (
                <div className="empty-substate">
                  <History size={28} />
                  <p>No transaction history recorded yet.</p>
                </div>
              ) : (
                transactions.map((tx) => (
                  <div key={tx._id} className="transaction-log-item">
                    <div className="tx-details">
                      <p className="tx-desc">{tx.description}</p>
                      <span className="tx-date">
                        {tx.earned_at ? new Date(tx.earned_at).toLocaleString() : 'N/A'}
                      </span>
                    </div>
                    <span className="tx-amount positive">
                      +{tx.amount}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
