import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Alert } from '../../ui/alert';
import './ApprovalHistory.css';

const ApprovalHistory = ({ planId, showFullHistory = false }) => {
  const [approvalHistory, setApprovalHistory] = useState([]);
  const [userPlans, setUserPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState(planId);

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (showFullHistory) {
      fetchUserPlansWithHistory();
    } else if (selectedPlanId) {
      fetchApprovalHistory(selectedPlanId);
    }
  }, [selectedPlanId, showFullHistory]);

  const fetchApprovalHistory = async (planId) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:5000/api/approval-history/${planId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setApprovalHistory(response.data.approval_history);
        setError(null);
      } else {
        setError(response.data.message || 'Failed to fetch approval history');
      }
    } catch (error) {
      console.error('Error fetching approval history:', error);
      setError(error.response?.data?.message || 'Failed to fetch approval history');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPlansWithHistory = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        'http://localhost:5000/api/my-plans-history',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setUserPlans(response.data.plans);
        setError(null);
      } else {
        setError(response.data.message || 'Failed to fetch plans');
      }
    } catch (error) {
      console.error('Error fetching user plans:', error);
      setError(error.response?.data?.message || 'Failed to fetch plans');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Approved':
        return <span className="status-icon approved">✓</span>;
      case 'Declined':
        return <span className="status-icon declined">✗</span>;
      case 'Pending':
        return <span className="status-icon pending">⏳</span>;
      default:
        return <span className="status-icon">?</span>;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Approved':
        return 'status-approved';
      case 'Declined':
        return 'status-declined';
      case 'Pending':
        return 'status-pending';
      default:
        return 'status-unknown';
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
      <div className="approval-history-loading">
        <div className="loading-spinner"></div>
        <p>Loading approval history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="approval-history-error">
        <h4>Error</h4>
        <p>{error}</p>
      </Alert>
    );
  }

  if (showFullHistory) {
    return (
      <div className="approval-history-container">
        <Card>
          <CardHeader>
            <CardTitle>My Plans - Approval History</CardTitle>
          </CardHeader>
          <CardContent>
            {userPlans.length === 0 ? (
              <p className="no-plans">No plans found.</p>
            ) : (
              <div className="plans-grid">
                {userPlans.map((plan) => (
                  <Card key={plan.plan_id} className="plan-card">
                    <CardHeader>
                      <CardTitle className="plan-title">
                        Plan #{plan.plan_id}
                      </CardTitle>
                      <p className="plan-date">
                        Created: {formatDate(plan.plan_created_at)}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="plan-details">
                        <p><strong>Goal:</strong> {plan.plan_details.goal_name}</p>
                        <p><strong>Objective:</strong> {plan.plan_details.objective_name}</p>
                        <p><strong>Department:</strong> {plan.plan_details.department_name}</p>
                      </div>
                      <div className="approval-summary">
                        <h4>Approval Summary</h4>
                        <div className="summary-stats">
                          <span className="stat">
                            Total Steps: {plan.approval_summary.total_steps}
                          </span>
                          <span className="stat approved">
                            Approved: {plan.approval_summary.approved_steps}
                          </span>
                          <span className="stat declined">
                            Declined: {plan.approval_summary.declined_steps}
                          </span>
                        </div>
                        <div className={`current-status ${getStatusClass(plan.approval_summary.current_status)}`}>
                          {getStatusIcon(plan.approval_summary.current_status)}
                          Current Status: {plan.approval_summary.current_status}
                        </div>
                      </div>
                      <button
                        className="view-history-btn"
                        onClick={() => setSelectedPlanId(plan.plan_id)}
                      >
                        View Detailed History
                      </button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {selectedPlanId && (
          <Card className="detailed-history-card">
            <CardHeader>
              <CardTitle>Detailed Approval History - Plan #{selectedPlanId}</CardTitle>
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
      </div>
    );
  }

  return (
    <div className="approval-history-timeline">
      {approvalHistory.length === 0 ? (
        <p className="no-history">No approval history found for this plan.</p>
      ) : (
        <div className="timeline">
          {approvalHistory.map((step, index) => (
            <div key={step.history_id} className="timeline-item">
              <div className="timeline-marker">
                <div className={`marker-icon ${getStatusClass(step.status)}`}>
                  {getStatusIcon(step.status)}
                </div>
                <div className="step-number">Step {step.step_number}</div>
              </div>
              <div className="timeline-content">
                <div className="approval-step-card">
                  <div className="step-header">
                    <h4 className="approver-name">{step.approver.name}</h4>
                    <span className="approver-role">{step.approver.role}</span>
                    <span className={`status-badge ${getStatusClass(step.status)}`}>
                      {step.status}
                    </span>
                  </div>
                  <div className="step-details">
                    <p className="action-date">
                      <strong>Date:</strong> {formatDate(step.action_date)}
                    </p>
                    <p className="comment">
                      <strong>Comment:</strong> {step.comment}
                    </p>
                    {step.is_current_step && (
                      <div className="current-step-indicator">
                        <span className="current-badge">Current Step</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ApprovalHistory;
