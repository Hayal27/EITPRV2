import React, { useState, useEffect, useRef } from "react";
import Axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import debounce from "lodash.debounce";
import Swal from "sweetalert2";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFilePdf,
  faFileWord,
  faFileImage,
  faFileAlt,
  faPaperclip,
  faEye,
  faEdit,
  faPlus,
  faChartLine,
  faFileContract,
  faSync,
  faSave,
  faSearch,
  faHome,
  faArrowLeft,
  faDownload,
  faCalendarAlt,
  faTasks,
  faPercent,
  faBuilding,
  faUser,
  faComments,
  faCheckCircle,
  faExclamationTriangle,
  faInfoCircle,
  faFilter,
  faSort,
  faTrash,
  faCloudUpload,
  faTimes,
  faExpand,
  faCompress,
  faClockRotateLeft
} from "@fortawesome/free-solid-svg-icons";
import Filters from "./Filters";
import PlansTable from "./PlansTable";
import Pagination from "./Pagination";
import sad from "../../../assets/img/sad.gif";
import happy from "../../../assets/img/happy.gif";
import ApprovalHistory from "./ApprovalHistory";

// Utility functions
const calculateExecutionPercentage = (baseline, plan, outcome) => {
  const base = parseFloat(baseline);
  const p = parseFloat(plan);
  const o = parseFloat(outcome);
  if (isNaN(base) || isNaN(p) || isNaN(o) || (p - base) === 0) return 0;
  return ((o - base) / (p - base)) * 100;
};

const CIcalculateExecutionPercentage = (CIbaseline, CIplan, CIoutcome) => {
  const cibase = parseFloat(CIbaseline);
  const cip = parseFloat(CIplan);
  const cio = parseFloat(CIoutcome);
  if (isNaN(cibase) || isNaN(cip) || isNaN(cio) || (cip - cibase) === 0) return 0;
  return ((cio - cibase) / (cip - cibase)) * 100;
};

const renderFileIcon = (fileName) => {
  const ext = fileName.split('.').pop().toLowerCase();
  if(ext === 'pdf') return <FontAwesomeIcon icon={faFilePdf} className="text-red-600 w-4 h-4" />;
  if(ext === 'doc' || ext === 'docx') return <FontAwesomeIcon icon={faFileWord} className="text-blue-600 w-4 h-4" />;
  if(ext === 'jpg' || ext === 'jpeg' || ext === 'png') return <FontAwesomeIcon icon={faFileImage} className="text-green-600 w-4 h-4" />;
  return <FontAwesomeIcon icon={faFileAlt} className="text-gray-600 w-4 h-4" />;
};

const StaffViewPlan = () => {
  const { planId } = useParams();
  const navigate = useNavigate();
  const hiddenFileInput = useRef(null);

  // Main state management
  const [activeView, setActiveView] = useState(planId ? 'detail' : 'dashboard');
  const [selectedPlanId, setSelectedPlanId] = useState(planId || null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [filters, setFilters] = useState({
    year: "",
    quarter: "",
    department: "",
    objective: "",
    status: "",
    search: ""
  });
  const [sortConfig, setSortConfig] = useState({ key: "", direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const token = localStorage.getItem("token");

  // UI State
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Update Plan State
  const [updateFormData, setUpdateFormData] = useState({
    outcome: '',
    execution_percentage: ''
  });

  // Add Report State
  const [reportFormData, setReportFormData] = useState({
    report_content: '',
    attachments: []
  });
  const [reportFiles, setReportFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Plan detail state
  const [plan, setPlan] = useState(null);
  const [planDetailLoading, setPlanDetailLoading] = useState(false);

  // Sidebar state management
  const [sidebarState, setSidebarState] = useState({
    isCollapsed: false,
    sidebarWidth: 260,
    mainContentMargin: 260
  });

  // Fetch plans for overview
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
      const response = await Axios.get("http://localhost:5000/api/getplan", {
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

  // Fetch plan details for detail view, update, and report
  const fetchPlanDetails = async (planIdToFetch) => {
    if (!planIdToFetch) {
      setErrorMessage("Invalid Plan ID");
      return;
    }

    try {
      setPlanDetailLoading(true);
      const response = await Axios.get(`http://localhost:5000/api/plan-details/${planIdToFetch}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const p = response.data.plan;
        setPlan(p);

        // Set update form data with correct field names
        setUpdateFormData({
          outcome: (p.outcome || p.outcome === 0) ? p.outcome.toString() : "",
          execution_percentage: (p.execution_percentage || p.execution_percentage === 0) ? p.execution_percentage.toString() : ""
        });

        setErrorMessage("");
      } else {
        setErrorMessage("Plan details not found.");
      }
    } catch (error) {
      setErrorMessage("Failed to fetch plan details.");
      console.error(error);
    } finally {
      setPlanDetailLoading(false);
    }
  };

  const debouncedFetchPlans = debounce(fetchPlans, 500);

  // Handle plan selection and view switching
  const handlePlanSelect = (planIdToSelect, viewToActivate = 'detail') => {
    if (!planIdToSelect) {
      setErrorMessage("Invalid Plan ID");
      return;
    }

    setSelectedPlanId(planIdToSelect);
    setActiveView(viewToActivate);
    fetchPlanDetails(planIdToSelect);
    setErrorMessage("");
    setSuccessMessage("");
  };

  // Handle update form changes
  const handleUpdateFormChange = (e) => {
    const { name, value } = e.target;
    setUpdateFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle update form submission
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await Axios.put(`http://localhost:5000/api/planupdate/${selectedPlanId}`, updateFormData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccessMessage("Plan updated successfully!");
      fetchPlanDetails(selectedPlanId);
      debouncedFetchPlans();

      setTimeout(() => {
        setActiveView('detail');
      }, 2000);

    } catch (error) {
      console.error("Error updating plan:", error);
      setErrorMessage(error.response?.data?.message || "Failed to update plan");
    } finally {
      setLoading(false);
    }
  };

  // Handle report form changes
  const handleReportFormChange = (e) => {
    const { name, value } = e.target;
    setReportFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle file selection for reports
  const handleReportFileChange = (e) => {
    const files = Array.from(e.target.files);
    setReportFiles(files);
  };

  // Handle report submission
  const handleReportSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const formData = new FormData();
      formData.append('plan_id', selectedPlanId);
      formData.append('report_content', reportFormData.report_content);

      reportFiles.forEach((file, index) => {
        formData.append('attachments', file);
      });

      await Axios.post('http://localhost:5000/api/reports', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

      setSuccessMessage("Report added successfully!");
      setReportFormData({ report_content: '', attachments: [] });
      setReportFiles([]);
      setUploadProgress(0);

      setTimeout(() => {
        setActiveView('detail');
      }, 2000);

    } catch (error) {
      console.error("Error adding report:", error);
      setErrorMessage(error.response?.data?.message || "Failed to add report");
    } finally {
      setLoading(false);
    }
  };

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
    if (activeView === 'dashboard') {
      debouncedFetchPlans();
    }
  }, [filters, currentPage, activeView]);

  // Fetch plan details when planId changes or component mounts
  useEffect(() => {
    if (planId && planId !== selectedPlanId) {
      setSelectedPlanId(planId);
      setActiveView('detail');
      fetchPlanDetails(planId);
    }
  }, [planId]);

  // Auto-fetch plans on component mount
  useEffect(() => {
    if (!planId) {
      debouncedFetchPlans();
    }
  }, []);

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

  const handleDelete = async (planIdToDelete) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await Axios.delete(`http://localhost:5000/api/plandelete/${planIdToDelete}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setPlans((prevPlans) => prevPlans.filter((plan) => plan.Plan_ID !== planIdToDelete));

        // If the deleted plan is currently selected, reset the view
        if (selectedPlanId === planIdToDelete) {
          setSelectedPlanId(null);
          setActiveView('dashboard');
          setPlan(null);
        }

        Swal.fire(
          'Deleted!',
          'Your plan has been deleted.',
          'success'
        );
      } catch (error) {
        console.error("Failed to delete the plan.");
        Swal.fire({
          icon: "error",
          title: "Delete Error",
          text: "Failed to delete the plan. Please try again."
        });
      }
    }
  };

  const nextPage = () => setCurrentPage((prevPage) => prevPage + 1);
  const prevPage = () => setCurrentPage((prevPage) => Math.max(prevPage - 1, 1));

  // Calculate dynamic styles based on sidebar state
  const containerStyle = {
    '--sidebar-margin': `${sidebarState.mainContentMargin}px`,
    '--sidebar-width': `${sidebarState.sidebarWidth}px`
  };

  return (
    <div className={`min-h-screen bg-gray-50 transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`} style={containerStyle}>
      {/* Modern Header with Breadcrumb */}
      <div className="shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex-1">
              <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                <button
                  className="flex items-center space-x-1 hover:text-blue-600 transition-colors"
                  onClick={() => setActiveView('dashboard')}
                >
                  <FontAwesomeIcon icon={faHome} className="w-4 h-4" />
                  <span>Dashboard</span>
                </button>
                {selectedPlanId && (
                  <>
                    <FontAwesomeIcon icon={faArrowLeft} className="w-3 h-3 text-gray-400" />
                    <span className="text-blue-600 font-medium">
                      Plan #{selectedPlanId}
                    </span>
                  </>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                  <FontAwesomeIcon icon={faChartLine} className="w-6 h-6 text-blue-600" />
                  <span>የእቅድ አስተዳደር</span>
                </h1>
                <p className="text-gray-600 mt-1">Comprehensive Plan Management & Reporting System</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{plans.length}</div>
                  <div className="text-xs text-gray-500">Total Plans</div>
                </div>
                {selectedPlanId && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">#{selectedPlanId}</div>
                    <div className="text-xs text-gray-500">Selected</div>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                >
                  <FontAwesomeIcon icon={isFullscreen ? faCompress : faExpand} className="w-4 h-4" />
                </button>

                <button
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  onClick={() => window.location.reload()}
                >
                  <FontAwesomeIcon icon={faSync} className="w-4 h-4" />
                  <span>Refresh</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Navigation */}
      <div className="border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3">
            <div className="flex flex-wrap items-center gap-2 mb-3 sm:mb-0">
              <button
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeView === 'dashboard' 
                    ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                onClick={() => {
                  setActiveView('dashboard');
                  setSelectedPlanId(null);
                }}
              >
                <FontAwesomeIcon icon={faChartLine} className="w-4 h-4" />
                <span>Dashboard</span>
              </button>

              {selectedPlanId && (
                <>
                  <button
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      activeView === 'detail' 
                        ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                    onClick={() => setActiveView('detail')}
                  >
                    <FontAwesomeIcon icon={faEye} className="w-4 h-4" />
                    <span>Details</span>
                  </button>

                  <button
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      activeView === 'update' 
                        ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                    onClick={() => setActiveView('update')}
                  >
                    <FontAwesomeIcon icon={faEdit} className="w-4 h-4" />
                    <span>Update</span>
                  </button>

                  <button
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      activeView === 'report' 
                        ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                    onClick={() => setActiveView('report')}
                  >
                    <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
                    <span>Report</span>
                  </button>

                  <button
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      activeView === 'history' 
                        ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                    onClick={() => setActiveView('history')}
                  >
                    <FontAwesomeIcon icon={faClockRotateLeft} className="w-4 h-4" />
                    <span>History</span>
                  </button>
                </>
              )}
            </div>

            <div>
              {activeView === 'dashboard' && (
                <button
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    showFilters 
                      ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300'
                  }`}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <FontAwesomeIcon icon={faFilter} className="w-4 h-4" />
                  <span>Filters</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace Content */}
      <div className="flex-1 overflow-auto">

        {/* Dashboard View */}
        {activeView === 'dashboard' && (
          <div className="p-4 sm:p-6 lg:p-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
              <div className=" rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FontAwesomeIcon icon={faFileContract} className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <div className="text-2xl font-bold text-gray-900">{plans.length}</div>
                    <div className="text-sm text-gray-500">Total Plans</div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FontAwesomeIcon icon={faCheckCircle} className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <div className="text-2xl font-bold text-gray-900">{plans.filter(p => p.Status === 'Completed').length}</div>
                    <div className="text-sm text-gray-500">Completed</div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FontAwesomeIcon icon={faTasks} className="w-8 h-8 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <div className="text-2xl font-bold text-gray-900">{plans.filter(p => p.Status === 'In Progress' || (p.Execution_Percentage && p.Execution_Percentage > 0)).length}</div>
                    <div className="text-sm text-gray-500">In Progress</div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="w-8 h-8 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <div className="text-2xl font-bold text-gray-900">{plans.filter(p => p.Status === 'Pending').length}</div>
                    <div className="text-sm text-gray-500">Pending</div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FontAwesomeIcon icon={faTimes} className="w-8 h-8 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <div className="text-2xl font-bold text-gray-900">{plans.filter(p => p.Status === 'Declined').length}</div>
                    <div className="text-sm text-gray-500">Declined</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="rounded-lg shadow-sm border border-gray-200 mb-6">
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                    <FontAwesomeIcon icon={faFilter} className="w-5 h-5 text-blue-600" />
                    <span>Filter Plans</span>
                  </h3>
                  <button
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    onClick={() => setShowFilters(false)}
                  >
                    <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-4">
                  <Filters
                    filters={filters}
                    handleFilterChange={handleFilterChange}
                    applyFilters={debouncedFetchPlans}
                  />
                </div>
              </div>
            )}

            {/* Plans Section */}
            <div className="rounded-lg shadow-sm border border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2 mb-4 sm:mb-0">
                  <FontAwesomeIcon icon={faFileContract} className="w-6 h-6 text-blue-600" />
                  <span>My Plans</span>
                </h2>
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
                  <div className="relative">
                    <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search plans..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange({target: {name: 'search', value: e.target.value}})}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
                    />
                  </div>
                  <button
                    className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
                    onClick={debouncedFetchPlans}
                    disabled={loading}
                  >
                    <FontAwesomeIcon icon={faSync} className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              <div className="p-6">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600">Loading plans...</p>
                  </div>
                ) : errorMessage ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="w-16 h-16 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Plans Found</h3>
                    <p className="text-gray-600 mb-4">{errorMessage}</p>
                    <button 
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      onClick={debouncedFetchPlans}
                    >
                      <FontAwesomeIcon icon={faSync} className="w-4 h-4" />
                      <span>Try Again</span>
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {sortedPlans.map((plan) => (
                        <div 
                          key={plan.Plan_ID} 
                          className="border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
                          onClick={() => handlePlanSelect(plan.Plan_ID, 'detail')}
                        >
                          {/* Card Header */}
                          <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <div className="text-sm font-medium text-blue-600">#{plan.Plan_ID}</div>
                            <div className={`px-2 py-1 text-xs font-medium rounded-full ${
                              plan.Status === 'Completed' ? 'bg-green-100 text-green-800' :
                              plan.Status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                              plan.Status === 'Pending' ? 'bg-orange-100 text-orange-800' :
                              plan.Status === 'Declined' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {plan.Status}
                            </div>
                          </div>

                          {/* Card Content */}
                          <div className="p-4">
                            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[3rem]">
                              {plan.Goal || 'No Goal Set'}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2 min-h-[2.5rem]">
                              {plan.Objective || 'No Objective Set'}
                            </p>
                            <p className="text-xs text-gray-500 mb-4 line-clamp-2 min-h-[2rem]">
                              {plan.SpecificObjective || 'No Specific Objective'}
                            </p>

                            {/* Metrics */}
                            <div className="grid grid-cols-2 gap-3 mb-4">
                              <div className="text-center p-2 bg-gray-50 rounded">
                                <div className="text-xs text-gray-500">Year</div>
                                <div className="font-medium text-gray-900">{plan.Year}</div>
                              </div>
                              <div className="text-center p-2 bg-gray-50 rounded">
                                <div className="text-xs text-gray-500">Quarter</div>
                                <div className="font-medium text-gray-900">{plan.Quarter || 'N/A'}</div>
                              </div>
                            </div>

                            {/* Meta Info */}
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                              <div className="flex items-center space-x-1">
                                <FontAwesomeIcon icon={faCalendarAlt} className="w-3 h-3" />
                                <span>{plan.Year}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <FontAwesomeIcon icon={faBuilding} className="w-3 h-3" />
                                <span className="truncate max-w-20" title={plan.Department}>{plan.Department}</span>
                              </div>
                            </div>
                          </div>

                          {/* Card Actions - Always Visible with Tailwind Grid */}
                          <div className="px-4 pb-4">
                            <div className="grid grid-cols-4 gap-2">
                              <button
                                className="flex items-center justify-center px-2 py-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePlanSelect(plan.Plan_ID, 'detail');
                                }}
                                title="View Details"
                              >
                                <FontAwesomeIcon icon={faEye} className="w-4 h-4" />
                              </button>
                              <button
                                className="flex items-center justify-center px-2 py-2 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePlanSelect(plan.Plan_ID, 'update');
                                }}
                                title="Update Plan"
                              >
                                <FontAwesomeIcon icon={faEdit} className="w-4 h-4" />
                              </button>
                              <button
                                className="flex items-center justify-center px-2 py-2 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePlanSelect(plan.Plan_ID, 'report');
                                }}
                                title="Add Report"
                              >
                                <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
                              </button>
                              <button
                                className="flex items-center justify-center px-2 py-2 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(plan.Plan_ID);
                                }}
                                title="Delete Plan"
                              >
                                <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    <div className="mt-8">
                      <Pagination
                        currentPage={currentPage}
                        nextPage={nextPage}
                        prevPage={prevPage}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Plan Details View */}
        {activeView === 'detail' && selectedPlanId && (
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                  <div className="flex items-center space-x-4">
                    <h2 className="text-2xl font-bold flex items-center space-x-3">
                      <FontAwesomeIcon icon={faEye} className="w-6 h-6" />
                      <span>Plan Details</span>
                    </h2>
                    <div className="bg-opacity-20 px-3 py-1 rounded-full text-sm font-medium">
                      Plan #{selectedPlanId}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      className="flex items-center space-x-2 px-4 py-2 bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
                      onClick={() => setActiveView('update')}
                    >
                      <FontAwesomeIcon icon={faEdit} className="w-4 h-4" />
                      <span>Update Plan</span>
                    </button>
                    <button
                      className="flex items-center space-x-2 px-4 py-2 bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
                      onClick={() => setActiveView('report')}
                    >
                      <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
                      <span>Add Report</span>
                    </button>
                    <button
                      className="flex items-center space-x-2 px-4 py-2 bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
                      onClick={() => setActiveView('dashboard')}
                    >
                      <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4" />
                      <span>Back to Dashboard</span>
                    </button>
                  </div>
                </div>
              </div>

              {planDetailLoading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-gray-600">Loading plan details...</p>
                </div>
              ) : errorMessage ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="w-16 h-16 text-red-500 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Plan</h3>
                  <p className="text-gray-600 mb-4">{errorMessage}</p>
                  <button 
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    onClick={() => fetchPlanDetails(selectedPlanId)}
                  >
                    <FontAwesomeIcon icon={faSync} className="w-4 h-4" />
                    <span>Retry</span>
                  </button>
                </div>
              ) : plan ? (
                <div className="p-6">
                  {/* Plan Overview Card */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-6 border border-gray-200">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-4 lg:space-y-0 mb-6">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.goal_name || 'No Goal Set'}</h3>
                        <p className="text-gray-700 mb-2">{plan.objective_name || 'No Objective Set'}</p>
                        <p className="text-gray-600 text-sm">{plan.specific_objective_name || 'No Specific Objective'}</p>
                      </div>
                      <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
                        plan.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        plan.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                        plan.status === 'Pending' ? 'bg-orange-100 text-orange-800' :
                        plan.status === 'Declined' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {plan.status}
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Execution Progress</span>
                        <span className="text-sm font-bold text-blue-600">{plan.execution_percentage || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all duration-300"
                          style={{width: `${Math.min(plan.execution_percentage || 0, 100)}%`}}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                        <h4 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                          <FontAwesomeIcon icon={faInfoCircle} className="w-5 h-5 text-blue-600" />
                          <span>Basic Information</span>
                        </h4>
                      </div>
                      <div className="p-6 space-y-4">
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-medium text-gray-500">Plan ID:</span>
                          <span className="text-sm text-gray-900 text-right">{plan.plan_id}</span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-medium text-gray-500">ግብ (Goal):</span>
                          <span className="text-sm text-gray-900 text-right max-w-xs">{plan.goal_name || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-medium text-gray-500">አላማ (Objective):</span>
                          <span className="text-sm text-gray-900 text-right max-w-xs">{plan.objective_name || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-medium text-gray-500">ዝርዝር አላማ (Specific Objective):</span>
                          <span className="text-sm text-gray-900 text-right max-w-xs">{plan.specific_objective_name || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-medium text-gray-500">የእቅድ ዝርዝር (Plan Details):</span>
                          <span className="text-sm text-gray-900 text-right max-w-xs">{plan.specific_objective_detailname || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-medium text-gray-500">Details:</span>
                          <span className="text-sm text-gray-900 text-right max-w-xs">{plan.details || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-medium text-gray-500">Measurement:</span>
                          <span className="text-sm text-gray-900 text-right max-w-xs">{plan.measurement || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Metrics & Progress */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                        <h4 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                          <FontAwesomeIcon icon={faChartLine} className="w-5 h-5 text-blue-600" />
                          <span>Metrics & Progress</span>
                        </h4>
                      </div>
                      <div className="p-6">
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className="text-xs text-gray-500 mb-1">Baseline</div>
                            <div className="text-lg font-bold text-gray-900">{plan.baseline || 'N/A'}</div>
                          </div>
                          <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className="text-xs text-gray-500 mb-1">Target</div>
                            <div className="text-lg font-bold text-gray-900">{plan.plan || 'N/A'}</div>
                          </div>
                          <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <div className="text-xs text-gray-500 mb-1">Outcome</div>
                            <div className="text-lg font-bold text-blue-600">{plan.outcome || 'N/A'}</div>
                          </div>
                          <div className="text-center p-4 bg-green-50 rounded-lg">
                            <div className="text-xs text-gray-500 mb-1">Progress</div>
                            <div className="text-lg font-bold text-green-600">{plan.execution_percentage || 0}%</div>
                          </div>
                        </div>
                        
                        {/* CI Metrics if available */}
                        {(plan.CIbaseline !== null || plan.CIplan !== null || plan.CIoutcome !== null) && (
                          <div className="border-t border-gray-200 pt-4">
                            <h5 className="text-sm font-semibold text-gray-700 mb-3">CI Metrics</h5>
                            <div className="grid grid-cols-3 gap-3">
                              <div className="text-center p-3 bg-gray-50 rounded">
                                <div className="text-xs text-gray-500 mb-1">CI Baseline</div>
                                <div className="text-sm font-bold text-gray-900">{plan.CIbaseline || 'N/A'}</div>
                              </div>
                              <div className="text-center p-3 bg-gray-50 rounded">
                                <div className="text-xs text-gray-500 mb-1">CI Plan</div>
                                <div className="text-sm font-bold text-gray-900">{plan.CIplan || 'N/A'}</div>
                              </div>
                              <div className="text-center p-3 bg-blue-50 rounded">
                                <div className="text-xs text-gray-500 mb-1">CI Outcome</div>
                                <div className="text-sm font-bold text-blue-600">{plan.CIoutcome || 'N/A'}</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Administrative Info */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                        <h4 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                          <FontAwesomeIcon icon={faBuilding} className="w-5 h-5 text-blue-600" />
                          <span>Administrative Info</span>
                        </h4>
                      </div>
                      <div className="p-6 space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-500">Created By:</span>
                          <span className="text-sm text-gray-900 flex items-center space-x-1">
                            <FontAwesomeIcon icon={faUser} className="w-3 h-3" />
                            <span>{plan.created_by || 'N/A'}</span>
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-500">Department:</span>
                          <span className="text-sm text-gray-900 flex items-center space-x-1">
                            <FontAwesomeIcon icon={faBuilding} className="w-3 h-3" />
                            <span>{plan.department_name || 'N/A'}</span>
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-500">Year:</span>
                          <span className="text-sm text-gray-900 flex items-center space-x-1">
                            <FontAwesomeIcon icon={faCalendarAlt} className="w-3 h-3" />
                            <span>{plan.year || 'N/A'}</span>
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-500">Month:</span>
                          <span className="text-sm text-gray-900">{plan.month || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-500">Priority:</span>
                          <span className="text-sm text-gray-900">{plan.priority || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-500">Progress Status:</span>
                          <span className="text-sm text-gray-900">{plan.progress || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-500">Deadline:</span>
                          <span className="text-sm text-gray-900">
                            {plan.deadline ? new Date(plan.deadline).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Timeline Info */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden lg:col-span-2">
                      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                        <h4 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                          <FontAwesomeIcon icon={faCalendarAlt} className="w-5 h-5 text-blue-600" />
                          <span>Timeline Information</span>
                        </h4>
                      </div>
                      <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="flex justify-between items-start">
                            <span className="text-sm font-medium text-gray-500">Created At:</span>
                            <span className="text-sm text-gray-900 text-right">
                              {plan.created_at ? new Date(plan.created_at).toLocaleString() : 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between items-start">
                            <span className="text-sm font-medium text-gray-500">Last Updated:</span>
                            <span className="text-sm text-gray-900 text-right">
                              {plan.updated_at ? new Date(plan.updated_at).toLocaleString() : 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between items-start">
                            <span className="text-sm font-medium text-gray-500">Editing Status:</span>
                            <span className={`text-sm px-2 py-1 rounded-full text-xs font-medium ${
                              plan.editing_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {plan.editing_status || 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between items-start">
                            <span className="text-sm font-medium text-gray-500">Reporting Status:</span>
                            <span className={`text-sm px-2 py-1 rounded-full text-xs font-medium ${
                              plan.reporting === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {plan.reporting || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16">
                  <FontAwesomeIcon icon={faFileContract} className="w-16 h-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Plan Selected</h3>
                  <p className="text-gray-600 mb-4">Please select a plan from the dashboard to view its details.</p>
                  <button
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    onClick={() => setActiveView('dashboard')}
                  >
                    <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4" />
                    <span>Go to Dashboard</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Update Plan View */}
        {activeView === 'update' && selectedPlanId && (
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                  <div className="flex items-center space-x-4">
                    <h2 className="text-2xl font-bold flex items-center space-x-3">
                      <FontAwesomeIcon icon={faEdit} className="w-6 h-6" />
                      <span>Update Plan</span>
                    </h2>
                    <div className="bg-opacity-20 px-3 py-1 rounded-full text-sm font-medium">
                      Plan #{selectedPlanId}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      className="flex items-center space-x-2 px-4 py-2 bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
                      onClick={() => setActiveView('detail')}
                    >
                      <FontAwesomeIcon icon={faEye} className="w-4 h-4" />
                      <span>View Details</span>
                    </button>
                    <button
                      className="flex items-center space-x-2 px-4 py-2 bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
                      onClick={() => setActiveView('dashboard')}
                    >
                      <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4" />
                      <span>Back to Dashboard</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="max-w-4xl mx-auto">
                  <form onSubmit={handleUpdateSubmit} className="space-y-8">
                    {/* Plan Information Display */}
                    {plan && (
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-gray-200">
                        <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-gray-200">
                          <FontAwesomeIcon icon={faInfoCircle} className="w-6 h-6 text-blue-600" />
                          <h3 className="text-xl font-semibold text-gray-900">Plan Information</h3>
                        </div>
                        
                        <div className="rounded-lg p-6 border border-gray-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex justify-between items-start py-3 border-b border-gray-100">
                              <span className="text-sm font-medium text-gray-500">Goal:</span>
                              <span className="text-sm text-gray-900 text-right max-w-xs">{plan.goal_name}</span>
                            </div>
                            <div className="flex justify-between items-start py-3 border-b border-gray-100">
                              <span className="text-sm font-medium text-gray-500">Objective:</span>
                              <span className="text-sm text-gray-900 text-right max-w-xs">{plan.objective_name}</span>
                            </div>
                            <div className="flex justify-between items-start py-3 border-b border-gray-100">
                              <span className="text-sm font-medium text-gray-500">Specific Objective:</span>
                              <span className="text-sm text-gray-900 text-right max-w-xs">{plan.specific_objective_name}</span>
                            </div>
                            <div className="flex justify-between items-start py-3 border-b border-gray-100">
                              <span className="text-sm font-medium text-gray-500">Plan Details:</span>
                              <span className="text-sm text-gray-900 text-right max-w-xs">{plan.specific_objective_detailname}</span>
                            </div>
                            <div className="flex justify-between items-start py-3 border-b border-gray-100">
                              <span className="text-sm font-medium text-gray-500">Baseline:</span>
                              <span className="text-sm text-gray-900 text-right max-w-xs">{plan.baseline}</span>
                            </div>
                            <div className="flex justify-between items-start py-3 border-b border-gray-100">
                              <span className="text-sm font-medium text-gray-500">Target:</span>
                              <span className="text-sm text-gray-900 text-right max-w-xs">{plan.plan}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Update Section */}
                    <div className="rounded-lg p-6 border border-gray-200">
                      <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-gray-200">
                        <FontAwesomeIcon icon={faChartLine} className="w-6 h-6 text-blue-600" />
                        <h3 className="text-xl font-semibold text-gray-900">Update Progress</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label htmlFor="outcome" className="block text-sm font-medium text-gray-700 mb-2">
                            ክንውን (Outcome) *
                          </label>
                          <input
                            type="number"
                            id="outcome"
                            name="outcome"
                            value={updateFormData.outcome}
                            onChange={handleUpdateFormChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="Enter actual outcome"
                            required
                          />
                        </div>

                        <div>
                          <label htmlFor="execution_percentage" className="block text-sm font-medium text-gray-700 mb-2">
                            Execution Percentage *
                          </label>
                          <input
                            type="number"
                            id="execution_percentage"
                            name="execution_percentage"
                            value={updateFormData.execution_percentage}
                            onChange={handleUpdateFormChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            min="0"
                            max="100"
                            step="0.1"
                            placeholder="Enter execution percentage (0-100)"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                      <button
                        type="button"
                        className="flex items-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        onClick={() => setActiveView('detail')}
                        disabled={loading}
                      >
                        <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
                        <span>Cancel</span>
                      </button>

                      <button
                        type="submit"
                        className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Updating...</span>
                          </>
                        ) : (
                          <>
                            <FontAwesomeIcon icon={faSave} className="w-4 h-4" />
                            <span>Update Plan</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Messages */}
                    {errorMessage && (
                      <div className="flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                        <FontAwesomeIcon icon={faExclamationTriangle} className="w-5 h-5" />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    {successMessage && (
                      <div className="flex items-center space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
                        <FontAwesomeIcon icon={faCheckCircle} className="w-5 h-5" />
                        <span>{successMessage}</span>
                      </div>
                    )}
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Report View */}
        {activeView === 'report' && selectedPlanId && (
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                  <div className="flex items-center space-x-4">
                    <h2 className="text-2xl font-bold flex items-center space-x-3">
                      <FontAwesomeIcon icon={faPlus} className="w-6 h-6" />
                      <span>Add Report</span>
                    </h2>
                    <div className="bg-opacity-20 px-3 py-1 rounded-full text-sm font-medium">
                      Plan #{selectedPlanId}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      className="flex items-center space-x-2 px-4 py-2 bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
                      onClick={() => setActiveView('detail')}
                    >
                      <FontAwesomeIcon icon={faEye} className="w-4 h-4" />
                      <span>View Details</span>
                    </button>
                    <button
                      className="flex items-center space-x-2 px-4 py-2 bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
                      onClick={() => setActiveView('dashboard')}
                    >
                      <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4" />
                      <span>Back to Dashboard</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="max-w-4xl mx-auto">
                  <form onSubmit={handleReportSubmit} className="space-y-8">
                    <div className="rounded-lg p-6 border border-gray-200">
                      <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-gray-200">
                        <FontAwesomeIcon icon={faFileContract} className="w-6 h-6 text-blue-600" />
                        <h3 className="text-xl font-semibold text-gray-900">Report Content</h3>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <label htmlFor="report_content" className="block text-sm font-medium text-gray-700 mb-2">
                            Report Description *
                          </label>
                          <textarea
                            id="report_content"
                            name="report_content"
                            value={reportFormData.report_content}
                            onChange={handleReportFormChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                            rows="8"
                            required
                            placeholder="Enter your detailed report content here..."
                          />
                        </div>

                        <div>
                          <label htmlFor="attachments" className="block text-sm font-medium text-gray-700 mb-2">
                            Attachments
                          </label>
                          <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                            <input
                              type="file"
                              id="attachments"
                              multiple
                              onChange={handleReportFileChange}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                            />
                            <div className="flex flex-col items-center space-y-3">
                              <FontAwesomeIcon icon={faCloudUpload} className="w-12 h-12 text-blue-600" />
                              <div>
                                <span className="text-lg font-medium text-gray-900">Choose files or drag and drop</span>
                                <p className="text-sm text-gray-500 mt-1">PDF, DOC, DOCX, JPG, PNG, TXT files allowed</p>
                              </div>
                            </div>
                          </div>

                          {reportFiles.length > 0 && (
                            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                              <h4 className="text-sm font-semibold text-gray-900 mb-3">Selected Files:</h4>
                              <ul className="space-y-2">
                                {reportFiles.map((file, index) => (
                                  <li key={index} className="flex items-center space-x-3 p-2 rounded border border-gray-200">
                                    {renderFileIcon(file.name)}
                                    <span className="flex-1 text-sm text-gray-900">{file.name}</span>
                                    <span className="text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {uploadProgress > 0 && uploadProgress < 100 && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-700">Uploading...</span>
                              <span className="text-blue-600 font-medium">{uploadProgress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{width: `${uploadProgress}%`}}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                      <button
                        type="button"
                        className="flex items-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        onClick={() => setActiveView('detail')}
                        disabled={loading}
                      >
                        <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
                        <span>Cancel</span>
                      </button>

                      <button
                        type="submit"
                        className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        disabled={loading || !reportFormData.report_content.trim()}
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Submitting...</span>
                          </>
                        ) : (
                          <>
                            <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
                            <span>Add Report</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Messages */}
                    {errorMessage && (
                      <div className="flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                        <FontAwesomeIcon icon={faExclamationTriangle} className="w-5 h-5" />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    {successMessage && (
                      <div className="flex items-center space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
                        <FontAwesomeIcon icon={faCheckCircle} className="w-5 h-5" />
                        <span>{successMessage}</span>
                      </div>
                    )}
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Approval History View */}
        {activeView === 'history' && selectedPlanId && (
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                  <div className="flex items-center space-x-4">
                    <h2 className="text-2xl font-bold flex items-center space-x-3">
                      <FontAwesomeIcon icon={faClockRotateLeft} className="w-6 h-6" />
                      <span>Approval Workflow History</span>
                    </h2>
                    <div className="bg-opacity-20 px-3 py-1 rounded-full text-sm font-medium">
                      Plan #{selectedPlanId}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      className="flex items-center space-x-2 px-4 py-2 bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
                      onClick={() => setActiveView('detail')}
                    >
                      <FontAwesomeIcon icon={faEye} className="w-4 h-4" />
                      <span>View Details</span>
                    </button>
                    <button
                      className="flex items-center space-x-2 px-4 py-2 bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
                      onClick={() => setActiveView('dashboard')}
                    >
                      <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4" />
                      <span>Back to Dashboard</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="max-w-6xl mx-auto space-y-8">
                  {/* Introduction Card */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-gray-200">
                    <div className="flex items-center space-x-3 mb-4">
                      <FontAwesomeIcon icon={faInfoCircle} className="w-6 h-6 text-blue-600" />
                      <h3 className="text-xl font-semibold text-gray-900">Approval Workflow Tracking</h3>
                    </div>
                    <p className="text-gray-700 leading-relaxed">
                      Track the complete approval journey of your plan through different organizational levels. 
                      This timeline shows all approval steps, comments from approvers, and the current status 
                      of your plan in the workflow process.
                    </p>
                  </div>

                  {/* Timeline Container */}
                  <div className="rounded-lg border border-gray-200">
                    <div className="p-6">
                      <ApprovalHistory planId={selectedPlanId} showFullHistory={true} />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-center space-x-4 pt-6 border-t border-gray-200">
                    <button
                      className="flex items-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      onClick={() => setActiveView('detail')}
                    >
                      <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4" />
                      <span>Back to Plan Details</span>
                    </button>
                    <button
                      className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      onClick={() => window.print()}
                    >
                      <FontAwesomeIcon icon={faDownload} className="w-4 h-4" />
                      <span>Print History</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default StaffViewPlan;