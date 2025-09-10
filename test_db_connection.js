const mysql = require("mysql");

// Create connection using the same configuration as the backend
const con = mysql.createConnection({
    user: "root",
    host: "localhost",
    password: "", // Use an empty string if PASSWORD is undefined
    database: "itpr"
});

// Test connection
con.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('✅ Connected to MySQL database successfully');
  
  // Test the updatePlanApprovalStatus functionality
  testUpdatePlanApprovalStatus();
});

function testUpdatePlanApprovalStatus() {
  console.log('\n🔍 Testing updatePlanApprovalStatus functionality...\n');
  
  // First, let's check if there are any plans with pending approval
  const checkPlansQuery = `
    SELECT p.plan_id, p.user_id, aw.approver_id, aw.status, aw.comment, aw.comment_writer
    FROM plans p
    JOIN approvalworkflow aw ON p.plan_id = aw.plan_id
    WHERE aw.status = 'Pending'
    LIMIT 5
  `;
  
  con.query(checkPlansQuery, (err, results) => {
    if (err) {
      console.error('❌ Error checking plans:', err);
      return;
    }
    
    console.log('📋 Found pending plans:');
    console.table(results);
    
    if (results.length > 0) {
      // Test updating a plan approval status
      const testPlanId = results[0].plan_id;
      const testApproverId = results[0].approver_id;
      
      console.log(`\n🧪 Testing approval update for plan_id: ${testPlanId}, approver_id: ${testApproverId}`);
      
      // Simulate the update that would happen in updatePlanApprovalStatus
      const updateApprovalQuery = `
        UPDATE approvalworkflow
        SET status = ?, comment = ?, comment_writer = ?, approval_date = NOW()
        WHERE plan_id = ? AND approver_id = ?
      `;
      
      const testComment = "Test comment from CEO approval";
      const testCommentWriter = "Test CEO User";
      const testStatus = "Approved";
      
      con.query(updateApprovalQuery, [testStatus, testComment, testCommentWriter, testPlanId, testApproverId], (err, result) => {
        if (err) {
          console.error('❌ Error updating approval status:', err);
          return;
        }
        
        console.log('✅ Successfully updated approval status');
        console.log('📊 Update result:', result);
        
        // Verify the update
        const verifyQuery = `
          SELECT plan_id, approver_id, status, comment, comment_writer, approval_date
          FROM approvalworkflow
          WHERE plan_id = ? AND approver_id = ?
        `;
        
        con.query(verifyQuery, [testPlanId, testApproverId], (err, verifyResults) => {
          if (err) {
            console.error('❌ Error verifying update:', err);
            return;
          }
          
          console.log('\n✅ Verification results:');
          console.table(verifyResults);
          
          // Rollback the test change
          const rollbackQuery = `
            UPDATE approvalworkflow
            SET status = 'Pending', comment = '', comment_writer = '', approval_date = NULL
            WHERE plan_id = ? AND approver_id = ?
          `;
          
          con.query(rollbackQuery, [testPlanId, testApproverId], (err) => {
            if (err) {
              console.error('❌ Error rolling back test:', err);
            } else {
              console.log('🔄 Test changes rolled back successfully');
            }
            
            // Close connection
            con.end();
            console.log('\n🏁 Database connection test completed');
          });
        });
      });
    } else {
      console.log('ℹ️  No pending plans found for testing');
      con.end();
      console.log('\n🏁 Database connection test completed');
    }
  });
}