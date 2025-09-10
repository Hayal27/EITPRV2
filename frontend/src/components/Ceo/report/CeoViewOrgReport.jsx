


import React, { useState, useEffect } from "react";
import Axios from "axios";
import { Outlet } from "react-router-dom";
import debounce from "lodash.debounce";
import Filters from "./Filters";
import PlansTable from "./PlansTable";
import Pagination from "./Pagination";

const CeoViewOrgReport = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [filters, setFilters] = useState({
    year: "",
    quarter: "",
    department: "",
    goal_id: "",
    objective_id: "",
    specific_objective_id: "",
    specific_objective_detail_id: "",
    search: "",
  });
  
  // New state for dropdown options
  const [dropdownOptions, setDropdownOptions] = useState({
    goals: [],
    objectives: [],
    specificObjectives: [],
    details: [],
  });
  const [loadingOptions, setLoadingOptions] = useState(false);
  
  const [sortConfig, setSortConfig] = useState({ key: "", direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const token = localStorage.getItem("token");

  const fetchPlans = async () => {
    if (!token) {
      setErrorMessage("You must be logged in to view plans.");
      return;
    }

    const validFilters = Object.fromEntries(
      Object.entries(filters).filter(([key, value]) => value)
    );

    try {
      setLoading(true);
      const response = await Axios.get("http://localhost:5000/api/myreport", {
        headers: { Authorization: `Bearer ${token}` },
        params: { ...validFilters, page: currentPage, limit: itemsPerPage },
      });

      if (response.data.success) {
        setPlans(response.data.plans);
        setErrorMessage("");
      } else {
        setErrorMessage("No plans found.");
      }
    } catch (error) {
      setErrorMessage("የተገኘ እቅድ ወይም ሪፖርት የለም");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch dropdown options for Goals, Objectives, etc.
  const fetchDropdownOptions = async () => {
    if (!token) {
      console.log("No token available for fetching dropdown options");
      return;
    }

    try {
      setLoadingOptions(true);
      console.log("Starting to fetch dropdown options...");
      
      // Fetch Goals using the correct endpoint
      console.log("Fetching goals from: http://localhost:5000/api/goalsg");
      const goalsResponse = await Axios.get("http://localhost:5000/api/goalsg", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Goals response:", goalsResponse.data);
      
      // Fetch all Objectives - try without goal_id first
      console.log("Fetching objectives from: http://localhost:5000/api/objectivesg");
      let objectivesData = [];
      try {
        const objectivesResponse = await Axios.get("http://localhost:5000/api/objectivesg", {
          headers: { Authorization: `Bearer ${token}` },
        });
        objectivesData = objectivesResponse.data || [];
        console.log("Objectives response:", objectivesData);
      } catch (objError) {
        console.warn("Objectives endpoint failed:", objError.message);
        objectivesData = [];
      }
      
      // Fetch all Specific Objectives
      console.log("Fetching specific objectives from: http://localhost:5000/api/getSpesificObjectives");
      let specificObjectivesData = [];
      try {
        const specificObjectivesResponse = await Axios.get("http://localhost:5000/api/getSpesificObjectives", {
          headers: { Authorization: `Bearer ${token}` },
        });
        specificObjectivesData = specificObjectivesResponse.data || [];
        console.log("Specific objectives response:", specificObjectivesData);
      } catch (specError) {
        console.warn("Specific objectives endpoint failed:", specError.message);
        specificObjectivesData = [];
      }
      
      // For details, we might need to use a different approach since the endpoint might require specific_objective_id
      console.log("Fetching details from: http://localhost:5000/api/getSpesificObjectiveDetails");
      let detailsData = [];
      try {
        const detailsResponse = await Axios.get("http://localhost:5000/api/getSpesificObjectiveDetails", {
          headers: { Authorization: `Bearer ${token}` },
        });
        detailsData = detailsResponse.data || [];
        console.log("Details response:", detailsData);
      } catch (detailError) {
        console.warn("Details endpoint not available:", detailError.message);
        detailsData = [];
      }

      const finalOptions = {
        goals: goalsResponse.data || [],
        objectives: objectivesData,
        specificObjectives: specificObjectivesData,
        details: detailsData,
      };
      
      console.log("Final dropdown options:", finalOptions);
      setDropdownOptions(finalOptions);
      
    } catch (error) {
      console.error("Error fetching dropdown options:", error);
      console.error("Error details:", error.response?.data || error.message);
      // Set empty arrays as fallback
      setDropdownOptions({
        goals: [],
        objectives: [],
        specificObjectives: [],
        details: [],
      });
    } finally {
      setLoadingOptions(false);
      console.log("Finished fetching dropdown options");
    }
  };

  const debouncedFetchPlans = debounce(fetchPlans, 500);

  useEffect(() => {
    fetchDropdownOptions();
  }, [token]);

  useEffect(() => {
    debouncedFetchPlans();
  }, [filters, currentPage]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prevFilters) => ({ ...prevFilters, [name]: value }));
  };

  const handleSorting = (key) => {
    const direction = sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc";
    setSortConfig({ key, direction });
  };

  const sortedPlans = plans.sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const handleDelete = async (planId) => {
    if (window.confirm("Are you sure you want to delete this plan?")) {
      try {
        await Axios.delete(`http://localhost:5000/api/plandelete/${planId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPlans((prevPlans) => prevPlans.filter((plan) => plan.ID !== planId));
      } catch (error) {
        console.error("Failed to delete the plan.");
      }
    }
  };

  const nextPage = () => setCurrentPage((prevPage) => prevPage + 1);
  const prevPage = () => setCurrentPage((prevPage) => Math.max(prevPage - 1, 1));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Professional Header Section */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <i className="bi bi-file-earmark-bar-graph text-white text-lg"></i>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 bg-clip-text text-transparent">
                  Organization Reports
                </h1>
                <p className="text-slate-600 text-sm mt-1">
                  View and manage organizational reports and analytics
                </p>
              </div>
            </div>
            
            {/* Stats Cards */}
            <div className="flex items-center space-x-4">
              <div className="bg-white/60 backdrop-blur-sm rounded-xl px-4 py-2 border border-slate-200/60">
                <div className="text-xs text-slate-500 uppercase tracking-wide font-medium">Total Reports</div>
                <div className="text-lg font-bold text-slate-800">{plans.length}</div>
              </div>
              <div className="bg-white/60 backdrop-blur-sm rounded-xl px-4 py-2 border border-slate-200/60">
                <div className="text-xs text-slate-500 uppercase tracking-wide font-medium">Current Page</div>
                <div className="text-lg font-bold text-slate-800">{currentPage}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Filters Section */}
        <div className="mb-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-900/5 border border-slate-200/60 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200/60">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <i className="bi bi-funnel text-blue-600 text-sm"></i>
                </div>
                <h2 className="text-lg font-semibold text-slate-800">Filter Reports</h2>
              </div>
            </div>
            <div className="p-6">
              <Filters 
                filters={filters} 
                handleFilterChange={handleFilterChange} 
                applyFilters={debouncedFetchPlans}
                dropdownOptions={dropdownOptions}
                loadingOptions={loadingOptions}
              />
            </div>
          </div>
        </div>

        {/* Reports Table Section */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-900/5 border border-slate-200/60 overflow-hidden">
          {/* Table Header */}
          <div className="px-6 py-5 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200/60">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <i className="bi bi-table text-indigo-600 text-sm"></i>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">Reports Overview</h2>
                  <p className="text-sm text-slate-600">Comprehensive view of all organizational reports</p>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 shadow-sm"
                >
                  <i className="bi bi-arrow-clockwise mr-2 text-sm"></i>
                  Refresh
                </button>
                <button className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl">
                  <i className="bi bi-download mr-2 text-sm"></i>
                  Export
                </button>
              </div>
            </div>
          </div>

          {/* Table Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin"></div>
                </div>
                <div className="mt-6 text-center">
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">Loading Reports</h3>
                  <p className="text-slate-600">Please wait while we fetch the latest data...</p>
                </div>
              </div>
            ) : errorMessage ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                  <i className="bi bi-exclamation-triangle text-red-500 text-2xl"></i>
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">No Reports Found</h3>
                  <p className="text-slate-600 mb-6 max-w-md">{errorMessage}</p>
                  <button 
                    onClick={() => window.location.reload()}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <i className="bi bi-arrow-clockwise mr-2"></i>
                    Try Again
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-hidden">
                <PlansTable
                  plans={plans}
                  handleDelete={handleDelete}
                  handleSorting={handleSorting}
                  sortedPlans={sortedPlans}
                  sortConfig={sortConfig}
                  handleDetailClick={() => {}}
                />
              </div>
            )}
          </div>

          {/* Pagination Section */}
          {!loading && !errorMessage && plans.length > 0 && (
            <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-t border-slate-200/60">
              <Pagination 
                currentPage={currentPage} 
                nextPage={nextPage} 
                prevPage={prevPage}
                totalItems={plans.length}
                itemsPerPage={itemsPerPage}
              />
            </div>
          )}
        </div>

        {/* Additional Info Cards */}
        {!loading && !errorMessage && plans.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-slate-200/60 shadow-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <i className="bi bi-check-circle text-green-600 text-lg"></i>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">Active Reports</h3>
                  <p className="text-2xl font-bold text-green-600">{plans.filter(plan => plan.status === 'active').length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-slate-200/60 shadow-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <i className="bi bi-clock text-yellow-600 text-lg"></i>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">Pending Review</h3>
                  <p className="text-2xl font-bold text-yellow-600">{plans.filter(plan => plan.status === 'pending').length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-slate-200/60 shadow-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <i className="bi bi-graph-up text-blue-600 text-lg"></i>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">Total Reports</h3>
                  <p className="text-2xl font-bold text-blue-600">{plans.length}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Outlet for nested routes */}
      <Outlet />
    </div>
  );
};

export default CeoViewOrgReport;


