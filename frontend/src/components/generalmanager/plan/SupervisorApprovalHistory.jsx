import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Alert } from '../../ui/alert';
import ApprovalHistory from '../../staff/plan/ApprovalHistory';
import '../../staff/plan/ApprovalHistory.css';
import './SupervisorApprovalHistory.css';

const SupervisorApprovalHistory = () => {
  const [pendingPlans, setPendingPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchPlanId, setSearchPlanId] = useState('');

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchPendingPlans();
  }, []);

  const fetchPendingPlans = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        'http://localhost:5000/api/supervisor/plans',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setPendingPlans(response.data.plans);
        setError(null);
      } else {
        setError(response.data.message || 'Failed to fetch pending plans');
      }
    } catch (error) {
      console.error('Error fetching pending plans:', error);
      setError(error.response?.data?.message || 'Failed to fetch pending plans');
    } finally {
      setLoading(false);
    }
  };

  const handleViewHistory = (planId) => {
    setSelectedPlanId(planId);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchPlanId.trim()) {
      setSelectedPlanId(parseInt(searchPlanId));
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="supervisor-approval-loading">
        <div className="loading-spinner"></div>
        <p>Loading pending plans...</p>
      </div>
    );
  }

  return (
    <div className="supervisor-approval-history">
      <div className="page-header">
        <h1>Plan Approval Management</h1>
        <p>Review pending plans and track approval history</p>
      </div>

      {error && (
        <Alert variant="destructive" className="error-alert">
          <h4>Error</h4>
          <p>{error}</p>
        </Alert>
      )}

      {/* Search for specific plan */}
      <Card className="search-card">
        <CardHeader>
          <CardTitle>Search Plan History</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearchSubmit} className="search-form">
            <div className="search-group">
              <input
                type="number"
                value={searchPlanId}
                onChange={(e) => setSearchPlanId(e.target.value)}
                placeholder="Enter Plan ID to view history"
                min="1"
                required
              />
              <button type="submit" className="search-btn">
                View History
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Pending Plans for Approval */}
      <Card className="pending-plans-card">
        <CardHeader>
          <CardTitle>Plans Pending Your Approval ({pendingPlans.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingPlans.length === 0 ? (
            <p className="no-pending">No plans pending your approval.</p>
          ) : (
            <div className="pending-plans-grid">
              {pendingPlans.map((plan) => (
                <div key={plan.plan_id} className="pending-plan-card">
                  <div className="plan-header">
                    <h3>Plan #{plan.plan_id}</h3>
                    <span className="plan-status pending">Pending</span>
                  </div>
                  
                  <div className="plan-details">
                    <div className="detail-row">
                      <strong>Goal:</strong> {plan.goal_name}
                    </div>
                    <div className="detail-row">
                      <strong>Objective:</strong> {plan.objective_name}
                    </div>
                    <div className="detail-row">
                      <strong>Specific Objective:</strong> {plan.specific_objective_name}
                    </div>
                    <div className="detail-row">
                      <strong>Department:</strong> {plan.department_name}
                    </div>
                    <div className="detail-row">
                      <strong>Created:</strong> {formatDate(plan.created_at)}
                    </div>
                    {plan.specific_objective_detailname && (
                      <div className="detail-row">
                        <strong>Detail:</strong> {plan.specific_objective_detailname}
                      </div>
                    )}
                  </div>

                  <div className="plan-actions">
                    <button
                      className="view-history-btn"
                      onClick={() => handleViewHistory(plan.plan_id)}
                    >
                      View Approval History
                    </button>
                    <button
                      className="approve-btn"
                      onClick={() => {
                        // This would typically open an approval modal
                        // For now, just show the history
                        handleViewHistory(plan.plan_id);
                      }}
                    >
                      Review & Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval History Modal/Section */}
      {selectedPlanId && (
        <Card className="history-modal">
          <CardHeader>
            <CardTitle>Approval History - Plan #{selectedPlanId}</CardTitle>
            <button
              className="close-btn"
              onClick={() => setSelectedPlanId(null)}
            >
              ✕
            </button>
          </CardHeader>
          <CardContent>
            <ApprovalHistory planId={selectedPlanId} showFullHistory={false} />
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="quick-stats">
        <Card>
          <CardHeader>
            <CardTitle>Quick Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-number">{pendingPlans.length}</div>
                <div className="stat-label">Pending Approval</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">
                  {pendingPlans.filter(plan => 
                    new Date(plan.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                  ).length}
                </div>
                <div className="stat-label">This Week</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">
                  {pendingPlans.filter(plan => 
                    new Date(plan.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
                  ).length}
                </div>
                <div className="stat-label">Today</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Help Section */}
      <Card className="help-section">
        <CardHeader>
          <CardTitle>Approval Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="guidelines">
            <h4>Review Process:</h4>
            <ol>
              <li>Review the plan details and objectives</li>
              <li>Check the approval history to see previous feedback</li>
              <li>Provide constructive comments when declining</li>
              <li>Ensure plans align with organizational goals</li>
            </ol>
            
            <h4>Best Practices:</h4>
            <ul>
              <li>Review plans within 2-3 business days</li>
              <li>Provide specific, actionable feedback</li>
              <li>Consider resource availability and feasibility</li>
              <li>Communicate with plan creators when needed</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupervisorApprovalHistory;
