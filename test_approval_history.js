const axios = require('axios');

// Test script to verify approval history API endpoints
async function testApprovalHistoryAPI() {
    console.log('🧪 Testing Approval History API Endpoints...\n');
    
    const baseURL = 'http://localhost:5000/api';
    
    // You'll need to replace this with a valid token from your application
    // You can get this by logging into the application and checking localStorage
    const token = 'your_jwt_token_here';
    
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
    
    try {
        // Test 1: Get user's plans with history
        console.log('📋 Test 1: Getting user plans with approval history...');
        try {
            const response = await axios.get(`${baseURL}/my-plans-history`, { headers });
            console.log('✅ Success! Found', response.data.plans?.length || 0, 'plans');
            if (response.data.plans && response.data.plans.length > 0) {
                console.log('📊 Sample plan:', {
                    plan_id: response.data.plans[0].plan_id,
                    approval_summary: response.data.plans[0].approval_summary
                });
            }
        } catch (error) {
            console.log('❌ Error:', error.response?.data?.message || error.message);
        }
        
        console.log('\n' + '='.repeat(50) + '\n');
        
        // Test 2: Get approval history for a specific plan
        console.log('📋 Test 2: Getting approval history for plan ID 1...');
        try {
            const response = await axios.get(`${baseURL}/approval-history/1`, { headers });
            console.log('✅ Success! Found', response.data.approval_history?.length || 0, 'approval steps');
            if (response.data.approval_history && response.data.approval_history.length > 0) {
                console.log('📊 Sample approval step:', {
                    step_number: response.data.approval_history[0].step_number,
                    status: response.data.approval_history[0].status,
                    approver: response.data.approval_history[0].approver.name
                });
            }
        } catch (error) {
            console.log('❌ Error:', error.response?.data?.message || error.message);
        }
        
        console.log('\n' + '='.repeat(50) + '\n');
        
        // Test 3: Get supervisor pending plans
        console.log('📋 Test 3: Getting supervisor pending plans...');
        try {
            const response = await axios.get(`${baseURL}/supervisor/plans`, { headers });
            console.log('✅ Success! Found', response.data.plans?.length || 0, 'pending plans');
            if (response.data.plans && response.data.plans.length > 0) {
                console.log('📊 Sample pending plan:', {
                    plan_id: response.data.plans[0].plan_id,
                    goal_name: response.data.plans[0].goal_name,
                    status: response.data.plans[0].status
                });
            }
        } catch (error) {
            console.log('❌ Error:', error.response?.data?.message || error.message);
        }
        
    } catch (error) {
        console.error('💥 General error:', error.message);
    }
    
    console.log('\n🎉 API testing completed!');
    console.log('\n📝 Instructions to get a valid token:');
    console.log('1. Open http://localhost:5173 in your browser');
    console.log('2. Log in to the application');
    console.log('3. Open browser developer tools (F12)');
    console.log('4. Go to Application/Storage tab');
    console.log('5. Find localStorage and copy the "token" value');
    console.log('6. Replace "your_jwt_token_here" in this script with the actual token');
    console.log('7. Run this script again: node test_approval_history.js');
}

// Run the test
testApprovalHistoryAPI();
