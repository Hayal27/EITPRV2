
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../../assets/css/viewplan.css";

const GeneralmanagerSubmittedViewPlan = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [comment, setComment] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/supervisor/plans", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success && response.data.plans) {
        setPlans(response.data.plans);
      } else {
        setPlans([]);
      }
    } catch (error) {
      console.error("Error fetching plans:", error.response?.data || error.message);
      setPlans([]);
    }
  };

  const handleApproveDecline = async (planId, action) => {
    try {
      const response = await axios.put(
        "http://localhost:5000/api/supervisor/plans/approve",
        { plan_id: planId, status: action, comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        alert(response.data.message);
        fetchPlans();  // Refresh the list of plans after the update
        setSelectedPlan(null);  // Clear selected plan
        setComment("");  // Clear comment
      } else {
        alert(response.data.message || "Something went wrong.");
      }
    } catch (error) {
      console.error("Error updating plan:", error.response?.data || error.message);
      alert("Failed to update plan. Please try again.");
    }
  };

  const handleReviewClick = (plan) => {
    setSelectedPlan(plan);
  };

  // Mapping backend attribute keys to display labels.
  const fieldLabels = {
    created_by: "አቃጅ",
    department_name: "የስራ ክፍል",
    year: "የታቀደበት አመት",
    month: "ወር",
    day: "ቀን",
    deadline: "እስከ",
    // status: "Status",
    priority: "Priority",
    goal_name: "ግብ",
    objective_name: "አላማ",
    specific_objective_name: "ውጤት",
    specific_objective_detailname: "ዝርዝር ተግባር",
    measurement: "ፐርፎርማንስ መለኪያ",
    baseline: "መነሻ %",
    plan: "የታቀደው %",
    outcome: "ክንውን",
    plan_type: "የ እቅዱ አይነት",
    income_exchange: "ምንዛሬ",
    cost_type: "ወጪ አይነት",
    employment_type: "የቅጥር ሁኔታ",
    incomeName: "የገቢ ስም",
    costName: "የመጪው ስም",
    CIbaseline: "መነሻ በ ገንዘብ",
    CIplan: "እቅድ በ ገንዘብ",
    outcomeCI: "ክንውን በ ገንዘብ",
  };

  // Filtering fields to only display those that are defined and not null in the plan.
  const renderPlanDetails = (plan) => {
    return Object.entries(fieldLabels).map(([key, label]) => {
      if (plan[key] !== undefined && plan[key] !== null && plan[key] !== "") {
        return (
          <p key={key}>
            <strong>{label}:</strong> {plan[key]}
          </p>
        );
      }
      return null;
    });
  };

  return (
    <div className="supervisor-dashboard">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>በ ዲፓርትመንቱ  የታቀዱ እቅዶች</h2>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/supervisor/approval-history')}
          style={{ padding: '8px 16px', fontSize: '14px' }}
        >
          📋 Approval History
        </button>
      </div>

      <div className="plan-list">
        {plans.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Department</th>
                <th>Plan By</th>
                <th>Goal</th>
                <th>Objective</th>
                <th>Specific Objective</th>
                <th>Specific Objective Detail</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan.plan_id}>
                  <td>{plan.department_name}</td>
                  <td>{plan.created_by}</td>
                  <td>{plan.goal_name}</td>
                  <td>{plan.objective_name}</td>
                  <td>{plan.specific_objective_name}</td>
                  <td>{plan.specific_objective_detailname}</td>
                  <td>{plan.status || "N/A"}</td>
                  <td>
                    <button onClick={() => handleReviewClick(plan)}>Review</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No plans available.</p>
        )}
      </div>

      {selectedPlan && (
        <div className="modal">
          <h3>Review Plan</h3>
          <div className="plan-details">
            {renderPlanDetails(selectedPlan)}
          </div>
          <textarea
            placeholder="Add a comment here (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <div className="modal-actions">
            <button onClick={() => handleApproveDecline(selectedPlan.plan_id, "Approved")}>
              Approve
            </button>
            <button onClick={() => handleApproveDecline(selectedPlan.plan_id, "Declined")}>
              Decline
            </button>
            <button onClick={() => setSelectedPlan(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeneralmanagerSubmittedViewPlan;
