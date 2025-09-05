
import React, { useEffect, useState } from "react";
import axios from "axios";


const CeoSubmittedViewPlan = () => {
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [comment, setComment] = useState("");
  const [selectedPlanIds, setSelectedPlanIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const token = localStorage.getItem("token");

  // Sidebar state management
  const [sidebarState, setSidebarState] = useState({
    isCollapsed: false,
    sidebarWidth: 260,
    mainContentMargin: 260
  });

  // Listen for sidebar state changes
  useEffect(() => {
    const handleSidebarStateChange = (event) => {
      const { isCollapsed, sidebarWidth, mainContentMargin } = event.detail;

      // Handle mobile responsiveness
      const isMobile = window.innerWidth <= 768;
      const adjustedMargin = isMobile ? 0 : mainContentMargin;

      setSidebarState({
        isCollapsed,
        sidebarWidth,
        mainContentMargin: adjustedMargin
      });
    };

    // Handle window resize for responsive behavior
    const handleResize = () => {
      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        setSidebarState(prev => ({
          ...prev,
          mainContentMargin: 0
        }));
      } else {
        // Restore sidebar margin on desktop
        setSidebarState(prev => ({
          ...prev,
          mainContentMargin: prev.isCollapsed ?
            (prev.sidebarWidth === 70 ? 70 : 60) :
            (prev.sidebarWidth === 280 ? 280 : 260)
        }));
      }
    };

    // Listen for different sidebar events
    window.addEventListener('sidebarStateChange', handleSidebarStateChange);
    window.addEventListener('staffSidebarStateChange', handleSidebarStateChange);
    window.addEventListener('ceoSidebarStateChange', handleSidebarStateChange);
    window.addEventListener('resize', handleResize);

    // Initial check for mobile
    handleResize();

    // Cleanup event listeners
    return () => {
      window.removeEventListener('sidebarStateChange', handleSidebarStateChange);
      window.removeEventListener('staffSidebarStateChange', handleSidebarStateChange);
      window.removeEventListener('ceoSidebarStateChange', handleSidebarStateChange);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      const response = await axios.get("http://localhost:5000/api/supervisor/plans", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success && response.data.plans) {
        setPlans(response.data.plans);
        setErrorMessage("");
      } else {
        setPlans([]);
        setErrorMessage("No plans found.");
      }
    } catch (error) {
      console.error("Error fetching plans:", error.response?.data || error.message);
      setPlans([]);
      setErrorMessage("Failed to fetch plans. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveDecline = async (planId, action, actionComment = comment) => {
    try {
      const response = await axios.put(
        "http://localhost:5000/api/supervisor/plans/approveceo",
        { plan_id: planId, status: action, comment: actionComment },
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

  // Handlers for bulk selection
  const handleCheckboxChange = (planId, checked) => {
    if (checked) {
      setSelectedPlanIds((prev) => [...prev, planId]);
    } else {
      setSelectedPlanIds((prev) => prev.filter((id) => id !== planId));
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = plans.map((plan) => plan.plan_id);
      setSelectedPlanIds(allIds);
    } else {
      setSelectedPlanIds([]);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedPlanIds.length === 0) {
      alert("No plans selected.");
      return;
    }
    // Optional comment for bulk action
    const bulkComment = prompt("Add a comment (optional)") || "";
    try {
      await Promise.all(
        selectedPlanIds.map((id) =>
          handleApproveDecline(id, action, bulkComment)
        )
      );
      alert(`Plans ${action} successfully.`);
      // Clear selections and refresh
      setSelectedPlanIds([]);
      fetchPlans();
    } catch (error) {
      alert("Failed to update one or more plans. Please try again.");
    }
  };

  // Mapping backend attribute keys to display labels.
  const fieldLabels = {
    created_by: "አቃጅ",
    department_name: "የስራ ክፍል",
    year: "የታቀደበት አመት",
    month: "ወር",
    day: "ቀን",
    deadline: "እስከ",
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
    outcomeCI: "ክንውን በ ገንዘብ"
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

  // Filter plans based on the search term across all values
  const filteredPlans = plans.filter(plan => {
    return Object.values(plan)
      .filter(value => value !== null && value !== undefined)
      .some(value => value.toString().toLowerCase().includes(searchTerm.toLowerCase()));
  });

  // Calculate dynamic styles based on sidebar state
  const containerStyle = {
    '--sidebar-margin': `${sidebarState.mainContentMargin}px`,
    '--sidebar-width': `${sidebarState.sidebarWidth}px`
  };

  // Determine CSS classes based on sidebar state
  const getContainerClasses = () => {
    let classes = "ceo-view-plan-container";

    if (sidebarState.isCollapsed) {
      if (sidebarState.sidebarWidth === 70) {
        classes += " admin-sidebar-collapsed";
      } else {
        classes += " sidebar-collapsed";
      }
    } else {
      if (sidebarState.sidebarWidth === 280) {
        classes += " admin-sidebar-expanded";
      } else {
        classes += " sidebar-expanded";
      }
    }

    return classes;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Professional Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">CEO Plan Review Dashboard</h1>
                <p className="text-gray-600 mt-1">Review and approve departmental strategic plans</p>
              </div>
            </div>
            
            {/* Header Stats */}
            <div className="flex flex-wrap gap-4">
              <div className="bg-blue-50 rounded-lg px-4 py-3 min-w-0">
                <div className="text-2xl font-bold text-blue-600">{plans.length}</div>
                <div className="text-sm text-blue-700 font-medium">Total Plans</div>
              </div>
              <div className="bg-green-50 rounded-lg px-4 py-3 min-w-0">
                <div className="text-2xl font-bold text-green-600">{selectedPlanIds.length}</div>
                <div className="text-sm text-green-700 font-medium">Selected</div>
              </div>
              <div className="bg-purple-50 rounded-lg px-4 py-3 min-w-0">
                <div className="text-2xl font-bold text-purple-600">{filteredPlans.length}</div>
                <div className="text-sm text-purple-700 font-medium">Filtered</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Search & Filter Plans</h3>
              <p className="text-sm text-gray-600">Find specific plans to review and manage</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                id="search"
                placeholder="Search across all plan data..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleBulkAction("Approved")}
                disabled={selectedPlanIds.length === 0}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Approve Selected ({selectedPlanIds.length})
              </button>
              <button
                onClick={() => handleBulkAction("Declined")}
                disabled={selectedPlanIds.length === 0}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Decline Selected ({selectedPlanIds.length})
              </button>
              <button
                onClick={() => {
                  setSelectedPlanIds([]);
                  setSearchTerm("");
                }}
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear All
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Plans for Review</h2>
              </div>
              <button
                onClick={fetchPlans}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <svg className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600 font-medium">Loading plans...</p>
              </div>
            ) : errorMessage ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Plans</h3>
                <p className="text-gray-600 mb-4">{errorMessage}</p>
                <button
                  onClick={fetchPlans}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Try Again
                </button>
              </div>
            ) : filteredPlans.length > 0 ? (
              <div className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              onChange={handleSelectAll}
                              checked={filteredPlans.length > 0 && selectedPlanIds.length === filteredPlans.length}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span>Select All</span>
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center space-x-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span>Department</span>
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center space-x-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span>Created By</span>
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center space-x-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Goal</span>
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center space-x-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <span>Objective</span>
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredPlans.map((plan) => (
                        <tr
                          key={plan.plan_id}
                          className={`hover:bg-gray-50 transition-colors duration-150 ${
                            selectedPlanIds.includes(plan.plan_id) ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                          }`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedPlanIds.includes(plan.plan_id)}
                              onChange={(e) => handleCheckboxChange(plan.plan_id, e.target.checked)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                              </div>
                              <div className="text-sm font-medium text-gray-900">
                                {plan.department_name || "N/A"}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3">
                                <span className="text-white text-xs font-medium">
                                  {(plan.created_by || "N").charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="text-sm text-gray-900">{plan.created_by || "N/A"}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs truncate" title={plan.goal_name}>
                              {plan.goal_name || "N/A"}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs truncate" title={plan.objective_name}>
                              {plan.objective_name || "N/A"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              plan.status === 'Approved' ? 'bg-green-100 text-green-800' :
                              plan.status === 'Declined' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                plan.status === 'Approved' ? 'bg-green-400' :
                                plan.status === 'Declined' ? 'bg-red-400' :
                                'bg-yellow-400'
                              }`}></div>
                              {plan.status || "Pending"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleReviewClick(plan)}
                              className="inline-flex items-center px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                            >
                              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              Review
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Plans Found</h3>
                <p className="text-gray-600 mb-4">No plans match your current search criteria.</p>
                <button
                  onClick={() => setSearchTerm("")}
                  className="inline-flex items-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear Search
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Professional Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white">Plan Review Details</h3>
                </div>
                <button
                  onClick={() => setSelectedPlan(null)}
                  className="text-white hover:text-gray-200 transition-colors duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {Object.entries(fieldLabels).map(([key, label]) => {
                  if (selectedPlan[key] !== undefined && selectedPlan[key] !== null && selectedPlan[key] !== "") {
                    return (
                      <div key={key} className="bg-gray-50 rounded-lg p-4">
                        <dt className="text-sm font-medium text-gray-600 mb-1">{label}</dt>
                        <dd className="text-sm text-gray-900 font-semibold">{selectedPlan[key]}</dd>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>

              {/* Comment Section */}
              <div className="border-t border-gray-200 pt-6">
                <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span>Add Review Comment (Optional)</span>
                  </div>
                </label>
                <textarea
                  id="comment"
                  placeholder="Add your review comments here..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows="4"
                  className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 resize-none"
                />
              </div>  
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={() => setSelectedPlan(null)}
                  className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancel
                </button>
                <button
                  onClick={() => handleApproveDecline(selectedPlan.plan_id, "Declined")}
                  className="inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Decline Plan
                </button>
                <button
                  onClick={() => handleApproveDecline(selectedPlan.plan_id, "Approved")}
                  className="inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Approve Plan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CeoSubmittedViewPlan;
