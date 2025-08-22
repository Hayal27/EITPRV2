import React, { useState } from 'react';
import ApprovalHistory from './ApprovalHistory';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import './PlanApprovalHistoryPage.css';

const PlanApprovalHistoryPage = () => {
  const [viewMode, setViewMode] = useState('all'); // 'all' or 'specific'
  const [specificPlanId, setSpecificPlanId] = useState('');

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    if (mode === 'all') {
      setSpecificPlanId('');
    }
  };

  const handleSpecificPlanSubmit = (e) => {
    e.preventDefault();
    if (specificPlanId.trim()) {
      setViewMode('specific');
    }
  };

  return (
    <div className="plan-approval-history-page">
      <div className="page-header">
        <h1>Plan Approval History</h1>
        <p>Track the approval status and history of your submitted plans</p>
      </div>

      <div className="view-mode-selector">
        <Card>
          <CardHeader>
            <CardTitle>View Options</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mode-buttons">
              <button
                className={`mode-btn ${viewMode === 'all' ? 'active' : ''}`}
                onClick={() => handleViewModeChange('all')}
              >
                All My Plans
              </button>
              <button
                className={`mode-btn ${viewMode === 'specific' ? 'active' : ''}`}
                onClick={() => handleViewModeChange('specific')}
              >
                Specific Plan
              </button>
            </div>

            {viewMode === 'specific' && (
              <form onSubmit={handleSpecificPlanSubmit} className="specific-plan-form">
                <div className="form-group">
                  <label htmlFor="planId">Enter Plan ID:</label>
                  <div className="input-group">
                    <input
                      type="number"
                      id="planId"
                      value={specificPlanId}
                      onChange={(e) => setSpecificPlanId(e.target.value)}
                      placeholder="e.g., 129"
                      min="1"
                      required
                    />
                    <button type="submit" className="search-btn">
                      View History
                    </button>
                  </div>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="history-content">
        {viewMode === 'all' ? (
          <ApprovalHistory showFullHistory={true} />
        ) : (
          specificPlanId && (
            <Card>
              <CardHeader>
                <CardTitle>Approval History - Plan #{specificPlanId}</CardTitle>
              </CardHeader>
              <CardContent>
                <ApprovalHistory planId={parseInt(specificPlanId)} showFullHistory={false} />
              </CardContent>
            </Card>
          )
        )}
      </div>

      <div className="help-section">
        <Card>
          <CardHeader>
            <CardTitle>Understanding Approval Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="status-guide">
              <div className="status-item">
                <span className="status-icon approved">✓</span>
                <div className="status-info">
                  <strong>Approved</strong>
                  <p>The plan has been approved by this approver and moved to the next level.</p>
                </div>
              </div>
              <div className="status-item">
                <span className="status-icon pending">⏳</span>
                <div className="status-info">
                  <strong>Pending</strong>
                  <p>The plan is currently waiting for approval from this approver.</p>
                </div>
              </div>
              <div className="status-item">
                <span className="status-icon declined">✗</span>
                <div className="status-info">
                  <strong>Declined</strong>
                  <p>The plan has been declined and returned for revision.</p>
                </div>
              </div>
            </div>
            
            <div className="approval-flow-info">
              <h4>Approval Flow</h4>
              <p>
                Plans typically go through multiple approval levels based on your organizational hierarchy:
              </p>
              <ol>
                <li><strong>Service Head</strong> - Initial review and approval</li>
                <li><strong>Deputy Manager</strong> - Department level approval</li>
                <li><strong>General Manager</strong> - Senior management approval</li>
                <li><strong>CEO</strong> - Final approval for implementation</li>
              </ol>
              <p>
                Each approver can add comments to provide feedback or explain their decision.
                If a plan is declined at any level, it returns to you for revision.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PlanApprovalHistoryPage;
