const jwt = require("jsonwebtoken");
const con = require("../models/db");

// Helper function to verify JWT token and extract user_id
const verifyToken = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, 'hayaltamrat@27', (err, decoded) => {
      if (err) {
        reject(err);
      } else {
        resolve(decoded.user_id);
      }
    });
  });
};

// Function to add approval workflow history entry
const addApprovalHistory = async (planId, approverId, approverName, approverRole, status, comment, stepNumber, isCurrentStep, createdByUserId, createdByName) => {
  return new Promise((resolve, reject) => {
    const insertQuery = `
      INSERT INTO approval_workflow_history 
      (plan_id, approver_id, approver_name, approver_role, status, comment, step_number, is_current_step, created_by_user_id, created_by_name)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    con.query(insertQuery, [planId, approverId, approverName, approverRole, status, comment, stepNumber, isCurrentStep, createdByUserId, createdByName], (err, result) => {
      if (err) {
        console.error("Error adding approval history:", err);
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

// Function to update current step status
const updateCurrentStepStatus = async (planId) => {
  return new Promise((resolve, reject) => {
    const updateQuery = `
      UPDATE approval_workflow_history 
      SET is_current_step = 0 
      WHERE plan_id = ?
    `;
    
    con.query(updateQuery, [planId], (err, result) => {
      if (err) {
        console.error("Error updating current step status:", err);
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

// Get approval workflow history for a specific plan
const getApprovalHistory = async (req, res) => {
  try {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) {
      return res.status(403).json({
        success: false,
        message: "Authorization token is required.",
        error_code: "TOKEN_MISSING"
      });
    }

    const user_id = await verifyToken(token);
    const { plan_id } = req.params;

    if (!plan_id) {
      return res.status(400).json({
        success: false,
        message: "Plan ID is required.",
        error_code: "PLAN_ID_MISSING"
      });
    }

    // First, verify that the user is the original creator of the plan
    const planOwnershipQuery = `
      SELECT user_id, created_at 
      FROM plans 
      WHERE plan_id = ?
    `;

    con.query(planOwnershipQuery, [plan_id], (err, planResults) => {
      if (err) {
        console.error("Error checking plan ownership:", err);
        return res.status(500).json({
          success: false,
          message: "Error checking plan ownership.",
          error_code: "DB_ERROR",
          error: err.message
        });
      }

      if (planResults.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Plan not found.",
          error_code: "PLAN_NOT_FOUND"
        });
      }

      const planOwnerId = planResults[0].user_id;
      
      // Allow access if user is the plan owner or has supervisor role
      if (planOwnerId !== user_id) {
        // Check if user has supervisor privileges (you can modify this logic based on your role system)
        const roleCheckQuery = `
          SELECT r.role_name 
          FROM users u 
          JOIN roles r ON u.role_id = r.role_id 
          WHERE u.user_id = ?
        `;
        
        con.query(roleCheckQuery, [user_id], (err, roleResults) => {
          if (err || roleResults.length === 0) {
            return res.status(403).json({
              success: false,
              message: "You don't have permission to view this plan's approval history.",
              error_code: "ACCESS_DENIED"
            });
          }

          const userRole = roleResults[0].role_name;
          if (!['supervisor', 'manager', 'admin', 'CEO'].includes(userRole.toLowerCase())) {
            return res.status(403).json({
              success: false,
              message: "You don't have permission to view this plan's approval history.",
              error_code: "ACCESS_DENIED"
            });
          }

          // If user has supervisor privileges, proceed to fetch history
          fetchApprovalHistory(plan_id, res);
        });
      } else {
        // User is the plan owner, proceed to fetch history
        fetchApprovalHistory(plan_id, res);
      }
    });

  } catch (error) {
    console.error("Error in getApprovalHistory:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
      error_code: "INTERNAL_ERROR",
      error: error.message
    });
  }
};

// Helper function to fetch approval history
const fetchApprovalHistory = (plan_id, res) => {
  const historyQuery = `
    SELECT 
      h.history_id,
      h.plan_id,
      h.approver_id,
      h.approver_name,
      h.approver_role,
      h.status,
      h.comment,
      h.action_date,
      h.step_number,
      h.is_current_step,
      h.created_by_user_id,
      h.created_by_name,
      p.department_name,
      sod.specific_objective_detailname,
      g.name as goal_name,
      o.name as objective_name,
      so.specific_objective_name
    FROM approval_workflow_history h
    JOIN plans p ON h.plan_id = p.plan_id
    LEFT JOIN specific_objective_details sod ON p.specific_objective_detail_id = sod.specific_objective_detail_id
    LEFT JOIN goals g ON p.goal_id = g.goal_id
    LEFT JOIN objectives o ON p.objective_id = o.objective_id
    LEFT JOIN specific_objectives so ON p.specific_objective_id = so.specific_objective_id
    WHERE h.plan_id = ?
    ORDER BY h.step_number ASC, h.action_date ASC
  `;

  con.query(historyQuery, [plan_id], (err, results) => {
    if (err) {
      console.error("Error fetching approval history:", err);
      return res.status(500).json({
        success: false,
        message: "Error fetching approval history.",
        error_code: "DB_ERROR",
        error: err.message
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No approval history found for this plan.",
        error_code: "NO_HISTORY_FOUND"
      });
    }

    // Group results by step and format response
    const formattedHistory = results.map(row => ({
      history_id: row.history_id,
      plan_id: row.plan_id,
      approver: {
        id: row.approver_id,
        name: row.approver_name,
        role: row.approver_role
      },
      status: row.status,
      comment: row.comment || "No comment provided",
      action_date: row.action_date,
      step_number: row.step_number,
      is_current_step: row.is_current_step === 1,
      plan_details: {
        department_name: row.department_name,
        goal_name: row.goal_name,
        objective_name: row.objective_name,
        specific_objective_name: row.specific_objective_name,
        specific_objective_detail_name: row.specific_objective_detailname
      },
      created_by: {
        user_id: row.created_by_user_id,
        name: row.created_by_name
      }
    }));

    res.json({
      success: true,
      plan_id: plan_id,
      total_steps: formattedHistory.length,
      approval_history: formattedHistory
    });
  });
};

// Get all plans with their approval history for the current user
const getUserPlansWithHistory = async (req, res) => {
  try {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) {
      return res.status(403).json({
        success: false,
        message: "Authorization token is required.",
        error_code: "TOKEN_MISSING"
      });
    }

    const user_id = await verifyToken(token);

    const plansQuery = `
      SELECT DISTINCT
        p.plan_id,
        p.created_at as plan_created_at,
        p.status as plan_status,
        p.department_name,
        sod.specific_objective_detailname,
        g.name as goal_name,
        o.name as objective_name,
        so.specific_objective_name,
        (SELECT COUNT(*) FROM approval_workflow_history WHERE plan_id = p.plan_id) as total_approval_steps,
        (SELECT COUNT(*) FROM approval_workflow_history WHERE plan_id = p.plan_id AND status = 'Approved') as approved_steps,
        (SELECT COUNT(*) FROM approval_workflow_history WHERE plan_id = p.plan_id AND status = 'Declined') as declined_steps,
        (SELECT status FROM approval_workflow_history WHERE plan_id = p.plan_id AND is_current_step = 1 LIMIT 1) as current_status
      FROM plans p
      LEFT JOIN specific_objective_details sod ON p.specific_objective_detail_id = sod.specific_objective_detail_id
      LEFT JOIN goals g ON p.goal_id = g.goal_id
      LEFT JOIN objectives o ON p.objective_id = o.objective_id
      LEFT JOIN specific_objectives so ON p.specific_objective_id = so.specific_objective_id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
    `;

    con.query(plansQuery, [user_id], (err, results) => {
      if (err) {
        console.error("Error fetching user plans:", err);
        return res.status(500).json({
          success: false,
          message: "Error fetching user plans.",
          error_code: "DB_ERROR",
          error: err.message
        });
      }

      const formattedPlans = results.map(row => ({
        plan_id: row.plan_id,
        plan_created_at: row.plan_created_at,
        plan_status: row.plan_status,
        plan_details: {
          department_name: row.department_name,
          goal_name: row.goal_name,
          objective_name: row.objective_name,
          specific_objective_name: row.specific_objective_name,
          specific_objective_detail_name: row.specific_objective_detailname
        },
        approval_summary: {
          total_steps: row.total_approval_steps || 0,
          approved_steps: row.approved_steps || 0,
          declined_steps: row.declined_steps || 0,
          current_status: row.current_status || 'Pending'
        }
      }));

      res.json({
        success: true,
        user_id: user_id,
        total_plans: formattedPlans.length,
        plans: formattedPlans
      });
    });

  } catch (error) {
    console.error("Error in getUserPlansWithHistory:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
      error_code: "INTERNAL_ERROR",
      error: error.message
    });
  }
};

module.exports = {
  addApprovalHistory,
  updateCurrentStepStatus,
  getApprovalHistory,
  getUserPlansWithHistory,
  fetchApprovalHistory
};
