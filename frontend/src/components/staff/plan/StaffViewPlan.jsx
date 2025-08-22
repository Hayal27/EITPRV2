
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
import "../../../assets/css/planform.css";
import "./StaffViewPlan.css";
import "./ModernStaffViewPlan.css";

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
  if(ext === 'pdf') return <FontAwesomeIcon icon={faFilePdf} className="file-attachment-icon pdf-icon" />;
  if(ext === 'doc' || ext === 'docx') return <FontAwesomeIcon icon={faFileWord} className="file-attachment-icon word-icon" />;
  if(ext === 'jpg' || ext === 'jpeg' || ext === 'png') return <FontAwesomeIcon icon={faFileImage} className="file-attachment-icon image-icon" />;
  return <FontAwesomeIcon icon={faFileAlt} className="file-attachment-icon generic-icon" />;
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
    Goal: '',
    Objective: '',
    Details: '',
    Measurement: '',
    Baseline: '',
    Plan: '',
    Outcome: '',
    Execution_Percentage: '',
    Status: '',
    Progress: '',
    Comment: ''
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
      const response = await Axios.get(`http://localhost:5000/api/pland/${planIdToFetch}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const p = response.data.plan;
        setPlan(p);

        // Set update form data
        setUpdateFormData({
          goal: p.goal_name || "",
          objective: p.objective_name || "",
          specObjective: p.specific_objective_name || "",
          specific_objective_detailname: p.specific_objective_detailname || "",
          measurement: p.measurement || "",
          baseline: p.baseline || "",
          plan: p.plan || "",
          description: p.details || "",
          year: (p.year || p.year === 0) ? p.year.toString() : "",
          Quarter: p.month || "",
          progress: p.progress || "",
          plan_type: p.plan_type || "",
          cost_type: p.cost_type || "",
          costName: p.costName || "",
          income_exchange: p.income_exchange || "",
          incomeName: p.incomeName || "",
          employment_type: p.employment_type || "",
          CIbaseline: (p.CIbaseline || p.CIbaseline === 0) ? p.CIbaseline.toString() : "",
          CIplan: (p.CIplan || p.CIplan === 0) ? p.CIplan.toString() : "",
          outcome: (p.outcome || p.outcome === 0) ? p.outcome.toString() : "",
          execution_percentage: (p.execution_percentage || p.execution_percentage === 0) ? p.execution_percentage.toString() : "",
          CIoutcome: (p.CIoutcome || p.CIoutcome === 0) ? p.CIoutcome.toString() : "",
          CIexecution_percentage: (p.CIexecution_percentage || p.CIexecution_percentage === 0) ? p.CIexecution_percentage.toString() : ""
        });

        // Set report form data
        setReportFormData({
          goal: p.goal_name !== undefined ? p.goal_name : null,
          objective: p.objective_name !== undefined ? p.objective_name : null,
          specObjective: p.specific_objective_name !== undefined ? p.specific_objective_name : null,
          specific_objective_detailname: p.specific_objective_detailname !== undefined ? p.specific_objective_detailname : null,
          measurement: p.measurement !== undefined ? p.measurement : null,
          baseline: p.baseline !== undefined ? p.baseline : null,
          plan: p.plan !== undefined ? p.plan : null,
          description: p.details !== undefined ? p.details : null,
          year: p.year !== undefined ? p.year : null,
          Quarter: p.month !== undefined ? p.month : null,
          progress: p.progress !== undefined ? p.progress : null,
          plan_type: p.plan_type !== undefined ? p.plan_type : null,
          cost_type: p.cost_type !== undefined ? p.cost_type : null,
          costName: p.costName !== undefined ? p.costName : null,
          income_exchange: p.income_exchange !== undefined ? p.income_exchange : null,
          incomeName: p.incomeName !== undefined ? p.incomeName : null,
          employment_type: p.employment_type !== undefined ? p.employment_type : null,
          CIbaseline: (p.CIbaseline !== undefined && p.CIbaseline !== null) ? p.CIbaseline.toString() : null,
          CIplan: (p.CIplan !== undefined && p.CIplan !== null) ? p.CIplan.toString() : null,
          outcome: (p.outcome !== undefined && p.outcome !== null) ? p.outcome.toString() : "",
          execution_percentage: (p.execution_percentage !== undefined && p.execution_percentage !== null) ? p.execution_percentage.toString() : "",
          CIoutcome: (p.CIoutcome !== undefined && p.CIoutcome !== null) ? p.CIoutcome.toString() : null,
          CIexecution_percentage: (p.CIexecution_percentage !== undefined && p.CIexecution_percentage !== null) ? p.CIexecution_percentage.toString() : ""
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
    setSelectedPlanId(planIdToSelect);
    setActiveView(viewToActivate);
    fetchPlanDetails(planIdToSelect);
    setErrorMessage("");
    setSuccessMessage("");

    // Load plan data for update form if switching to update view
    if (viewToActivate === 'update') {
      loadPlanForUpdate(planIdToSelect);
    }
  };

  // Load plan data for update form
  const loadPlanForUpdate = async (planId) => {
    try {
      const response = await Axios.get(`http://localhost:5000/api/plandetail/${planId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data && response.data.length > 0) {
        const planData = response.data[0];
        setUpdateFormData({
          Goal: planData.Goal || '',
          Objective: planData.Objective || '',
          Details: planData.Details || '',
          Measurement: planData.Measurement || '',
          Baseline: planData.Baseline || '',
          Plan: planData.Plan || '',
          Outcome: planData.Outcome || '',
          Execution_Percentage: planData.Execution_Percentage || '',
          Status: planData.Status || '',
          Progress: planData.Progress || '',
          Comment: planData.Comment || ''
        });
      }
    } catch (error) {
      console.error("Error loading plan for update:", error);
      setErrorMessage("Failed to load plan data for update");
    }
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

        setPlans((prevPlans) => prevPlans.filter((plan) => plan.ID !== planIdToDelete));

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

  // Determine CSS classes based on sidebar state
  const getContainerClasses = () => {
    let classes = "staff-view-plan-container";

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
    <div className={`staff-plan-workspace ${isFullscreen ? 'fullscreen' : ''} ${getContainerClasses()}`} style={containerStyle}>
      {/* Modern Header with Breadcrumb */}
      <div className="workspace-header">
        <div className="header-main">
          <div className="header-left">
            <div className="breadcrumb">
              <button
                className="breadcrumb-item"
                onClick={() => setActiveView('dashboard')}
              >
                <FontAwesomeIcon icon={faHome} />
                <span>Dashboard</span>
              </button>
              {selectedPlanId && (
                <>
                  <FontAwesomeIcon key="breadcrumb-separator" icon={faArrowLeft} className="breadcrumb-separator" />
                  <span key="breadcrumb-item" className="breadcrumb-item active">
                    Plan #{selectedPlanId}
                  </span>
                </>
              )}
            </div>
            <div className="header-title">
              <h1>
                <FontAwesomeIcon icon={faChartLine} className="title-icon" />
                የእቅድ አስተዳደር
              </h1>
              <p className="subtitle">Comprehensive Plan Management & Reporting System</p>
            </div>
          </div>

          <div className="header-actions">
            <div className="stats-summary">
              <div className="stat-item">
                <span className="stat-number">{plans.length}</span>
                <span className="stat-label">Total Plans</span>
              </div>
              {selectedPlanId && (
                <div className="stat-item active">
                  <span className="stat-number">#{selectedPlanId}</span>
                  <span className="stat-label">Selected</span>
                </div>
              )}
            </div>

            <div className="action-buttons">
              <button
                className="btn btn-icon"
                onClick={() => setIsFullscreen(!isFullscreen)}
                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              >
                <FontAwesomeIcon icon={isFullscreen ? faCompress : faExpand} />
              </button>

              <button
                className="btn btn-primary"
                onClick={() => window.location.reload()}
              >
                <FontAwesomeIcon icon={faSync} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Navigation */}
      <div className="workspace-navigation">
        <div className="nav-container">
          <div className="nav-main">
            <button
              className={`nav-button ${activeView === 'dashboard' ? 'active' : ''}`}
              onClick={() => {
                setActiveView('dashboard');
                setSelectedPlanId(null);
              }}
            >
              <FontAwesomeIcon icon={faChartLine} />
              <span>Dashboard</span>
            </button>

            {selectedPlanId && (
              <>
                <button
                  className={`nav-button ${activeView === 'detail' ? 'active' : ''}`}
                  onClick={() => setActiveView('detail')}
                >
                  <FontAwesomeIcon icon={faEye} />
                  <span>Details</span>
                </button>

                <button
                  className={`nav-button ${activeView === 'update' ? 'active' : ''}`}
                  onClick={() => setActiveView('update')}
                >
                  <FontAwesomeIcon icon={faEdit} />
                  <span>Update</span>
                </button>

                <button
                  className={`nav-button ${activeView === 'report' ? 'active' : ''}`}
                  onClick={() => setActiveView('report')}
                >
                  <FontAwesomeIcon icon={faPlus} />
                  <span>Report</span>
                </button>
              </>
            )}
          </div>

          <div className="nav-actions">
            {activeView === 'dashboard' && (
              <button
                className={`btn btn-filter ${showFilters ? 'active' : ''}`}
                onClick={() => setShowFilters(!showFilters)}
              >
                <FontAwesomeIcon icon={faFilter} />
                <span>Filters</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Workspace Content */}
      <div className="workspace-content">

        {/* Dashboard View */}
        {activeView === 'dashboard' && (
          <div className="dashboard-view">
            {/* Quick Stats */}
            <div className="dashboard-stats">
              <div className="stat-card">
                <div className="stat-icon">
                  <FontAwesomeIcon icon={faFileContract} />
                </div>
                <div className="stat-content">
                  <h3>{plans.length}</h3>
                  <p>Total Plans</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <FontAwesomeIcon icon={faCheckCircle} />
                </div>
                <div className="stat-content">
                  <h3>{plans.filter(p => p.Status === 'Completed').length}</h3>
                  <p>Completed</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <FontAwesomeIcon icon={faTasks} />
                </div>
                <div className="stat-content">
                  <h3>{plans.filter(p => p.Status === 'In Progress').length}</h3>
                  <p>In Progress</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <FontAwesomeIcon icon={faExclamationTriangle} />
                </div>
                <div className="stat-content">
                  <h3>{plans.filter(p => p.Status === 'Pending').length}</h3>
                  <p>Pending</p>
                </div>
              </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="filters-panel">
                <div className="filters-header">
                  <h3>
                    <FontAwesomeIcon icon={faFilter} />
                    Filter Plans
                  </h3>
                  <button
                    className="btn btn-close"
                    onClick={() => setShowFilters(false)}
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
                <div className="filters-content">
                  <Filters
                    filters={filters}
                    handleFilterChange={handleFilterChange}
                    applyFilters={debouncedFetchPlans}
                  />
                </div>
              </div>
            )}

            {/* Plans Grid */}
            <div className="plans-section">
              <div className="section-header">
                <h2>
                  <FontAwesomeIcon icon={faFileContract} />
                  My Plans
                </h2>
                <div className="section-actions">
                  <div className="search-box">
                    <FontAwesomeIcon icon={faSearch} className="search-icon" />
                    <input
                      type="text"
                      placeholder="Search plans..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange({target: {name: 'search', value: e.target.value}})}
                    />
                  </div>
                  <button
                    className="btn btn-refresh"
                    onClick={debouncedFetchPlans}
                    disabled={loading}
                  >
                    <FontAwesomeIcon icon={faSync} spin={loading} />
                  </button>
                </div>
              </div>

              <div className="plans-content">
                {loading ? (
                  <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Loading plans...</p>
                  </div>
                ) : errorMessage ? (
                  <div className="error-state">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="error-icon" />
                    <h3>No Plans Found</h3>
                    <p>{errorMessage}</p>
                    <button className="btn btn-primary" onClick={debouncedFetchPlans}>
                      <FontAwesomeIcon icon={faSync} />
                      Try Again
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="plans-grid">
                      {sortedPlans.map((plan) => (
                        <div key={plan.ID} className="plan-card" onClick={() => handlePlanSelect(plan.ID, 'detail')}>
                          <div className="plan-header">
                            <div className="plan-id">#{plan.ID}</div>
                            <div className={`plan-status ${plan.Status?.toLowerCase().replace(' ', '-')}`}>
                              {plan.Status}
                            </div>
                          </div>

                          <div className="plan-content">
                            <h3 className="plan-title">{plan.Goal || 'No Goal Set'}</h3>
                            <p className="plan-objective">{plan.Objective || 'No Objective Set'}</p>

                            <div className="plan-metrics">
                              <div className="metric">
                                <span className="metric-label">Baseline:</span>
                                <span className="metric-value">{plan.Baseline || 'N/A'}</span>
                              </div>
                              <div className="metric">
                                <span className="metric-label">Target:</span>
                                <span className="metric-value">{plan.Plan || 'N/A'}</span>
                              </div>
                              <div className="metric">
                                <span className="metric-label">Outcome:</span>
                                <span className="metric-value">{plan.Outcome || 'N/A'}</span>
                              </div>
                              <div className="metric">
                                <span className="metric-label">Progress:</span>
                                <span className="metric-value percentage">{plan.Execution_Percentage || 0}%</span>
                              </div>
                            </div>
                          </div>

                          <div className="plan-footer">
                            <div className="plan-meta">
                              <span className="meta-item">
                                <FontAwesomeIcon icon={faCalendarAlt} />
                                {plan.Year}
                              </span>
                              <span className="meta-item">
                                <FontAwesomeIcon icon={faBuilding} />
                                {plan.Department_Name}
                              </span>
                            </div>

                            <div className="plan-actions">
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePlanSelect(plan.ID, 'detail');
                                }}
                              >
                                <FontAwesomeIcon icon={faEye} />
                              </button>
                              <button
                                className="btn btn-sm btn-secondary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePlanSelect(plan.ID, 'update');
                                }}
                              >
                                <FontAwesomeIcon icon={faEdit} />
                              </button>
                              <button
                                className="btn btn-sm btn-success"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePlanSelect(plan.ID, 'report');
                                }}
                              >
                                <FontAwesomeIcon icon={faPlus} />
                              </button>
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(plan.ID);
                                }}
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    <div className="pagination-section">
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
          <div className="detail-view">
            <div className="detail-header">
              <div className="header-left">
                <h2>
                  <FontAwesomeIcon icon={faEye} />
                  Plan Details
                </h2>
                <div className="plan-badge">
                  Plan #{selectedPlanId}
                </div>
              </div>

              <div className="header-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => setActiveView('update')}
                >
                  <FontAwesomeIcon icon={faEdit} />
                  Update Plan
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => setActiveView('report')}
                >
                  <FontAwesomeIcon icon={faPlus} />
                  Add Report
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => setActiveView('dashboard')}
                >
                  <FontAwesomeIcon icon={faArrowLeft} />
                  Back to Dashboard
                </button>
              </div>
            </div>

            {planDetailLoading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading plan details...</p>
              </div>
            ) : errorMessage ? (
              <div className="error-state">
                <FontAwesomeIcon icon={faExclamationTriangle} className="error-icon" />
                <h3>Error Loading Plan</h3>
                <p>{errorMessage}</p>
                <button className="btn btn-primary" onClick={() => fetchPlanDetails(selectedPlanId)}>
                  <FontAwesomeIcon icon={faSync} />
                  Retry
                </button>
              </div>
            ) : plan ? (
              <div className="detail-content">
                {/* Plan Overview Card */}
                <div className="overview-card">
                  <div className="overview-header">
                    <div className="plan-title">
                      <h3>{plan.Goal || 'No Goal Set'}</h3>
                      <p className="plan-objective">{plan.Objective || 'No Objective Set'}</p>
                    </div>
                    <div className={`status-badge ${plan.Status?.toLowerCase().replace(' ', '-')}`}>
                      {plan.Status}
                    </div>
                  </div>

                  <div className="progress-section">
                    <div className="progress-header">
                      <span>Execution Progress</span>
                      <span className="progress-percentage">{plan.Execution_Percentage || 0}%</span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{width: `${Math.min(plan.Execution_Percentage || 0, 100)}%`}}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="details-grid">
                  {/* Basic Information */}
                  <div className="detail-card">
                    <div className="card-header">
                      <FontAwesomeIcon icon={faInfoCircle} />
                      <h4>Basic Information</h4>
                    </div>
                    <div className="card-content">
                      <div className="detail-item">
                        <span className="label">Plan ID:</span>
                        <span className="value">{plan.Plan_ID}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">ግብ (Goal):</span>
                        <span className="value">{plan.Goal || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">አላማ (Objective):</span>
                        <span className="value">{plan.Objective || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Details:</span>
                        <span className="value">{plan.Details || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Measurement:</span>
                        <span className="value">{plan.Measurement || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Metrics & Progress */}
                  <div className="detail-card">
                    <div className="card-header">
                      <FontAwesomeIcon icon={faChartLine} />
                      <h4>Metrics & Progress</h4>
                    </div>
                    <div className="card-content">
                      <div className="metrics-row">
                        <div className="metric-item">
                          <span className="metric-label">Baseline</span>
                          <span className="metric-value">{plan.Baseline || 'N/A'}</span>
                        </div>
                        <div className="metric-item">
                          <span className="metric-label">Target</span>
                          <span className="metric-value">{plan.Plan || 'N/A'}</span>
                        </div>
                        <div className="metric-item">
                          <span className="metric-label">Outcome</span>
                          <span className="metric-value highlight">{plan.Outcome || 'N/A'}</span>
                        </div>
                        <div className="metric-item">
                          <span className="metric-label">Progress</span>
                          <span className="metric-value percentage">{plan.Execution_Percentage || 0}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Administrative Info */}
                  <div className="detail-card">
                    <div className="card-header">
                      <FontAwesomeIcon icon={faBuilding} />
                      <h4>Administrative Info</h4>
                    </div>
                    <div className="card-content">
                      <div className="detail-item">
                        <span className="label">Created By:</span>
                        <span className="value">
                          <FontAwesomeIcon icon={faUser} />
                          {plan.Created_By}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Department:</span>
                        <span className="value">
                          <FontAwesomeIcon icon={faBuilding} />
                          {plan.Department_Name}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Year:</span>
                        <span className="value">
                          <FontAwesomeIcon icon={faCalendarAlt} />
                          {plan.Year}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Quarter:</span>
                        <span className="value">{plan.Quarter || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Progress Status:</span>
                        <span className="value">{plan.Progress || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Comments */}
                  {plan.Comment && (
                    <div className="detail-card full-width">
                      <div className="card-header">
                        <FontAwesomeIcon icon={faComments} />
                        <h4>Comments</h4>
                      </div>
                      <div className="card-content">
                        <div className="comment-content">
                          {plan.Comment}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="no-plan-state">
                <FontAwesomeIcon icon={faFileContract} className="no-plan-icon" />
                <h3>No Plan Selected</h3>
                <p>Please select a plan from the dashboard to view its details.</p>
                <button
                  className="btn btn-primary"
                  onClick={() => setActiveView('dashboard')}
                >
                  <FontAwesomeIcon icon={faArrowLeft} />
                  Go to Dashboard
                </button>
              </div>
            )}
          </div>
        )}

        {/* Update Plan View */}
        {activeView === 'update' && selectedPlanId && (
          <div className="update-view">
            <div className="update-header">
              <div className="header-left">
                <h2>
                  <FontAwesomeIcon icon={faEdit} />
                  Update Plan
                </h2>
                <div className="plan-badge">
                  Plan #{selectedPlanId}
                </div>
              </div>

              <div className="header-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => setActiveView('detail')}
                >
                  <FontAwesomeIcon icon={faEye} />
                  View Details
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => setActiveView('dashboard')}
                >
                  <FontAwesomeIcon icon={faArrowLeft} />
                  Back to Dashboard
                </button>
              </div>
            </div>

            <div className="update-content">
              <div className="update-form-container">
                <form onSubmit={handleUpdateSubmit} className="update-form">
                  <div className="form-grid">
                    {/* Basic Information Section */}
                    <div className="form-section">
                      <div className="section-header">
                        <FontAwesomeIcon icon={faInfoCircle} />
                        <h3>Basic Information</h3>
                      </div>

                      <div className="form-group">
                        <label htmlFor="Goal">ግብ (Goal) *</label>
                        <textarea
                          id="Goal"
                          name="Goal"
                          value={updateFormData.Goal}
                          onChange={handleUpdateFormChange}
                          className="form-control"
                          rows="3"
                          required
                          placeholder="Enter the main goal..."
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="Objective">አላማ (Objective) *</label>
                        <textarea
                          id="Objective"
                          name="Objective"
                          value={updateFormData.Objective}
                          onChange={handleUpdateFormChange}
                          className="form-control"
                          rows="3"
                          required
                          placeholder="Enter the objective..."
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="Details">Details</label>
                        <textarea
                          id="Details"
                          name="Details"
                          value={updateFormData.Details}
                          onChange={handleUpdateFormChange}
                          className="form-control"
                          rows="4"
                          placeholder="Enter additional details..."
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="Measurement">Measurement</label>
                        <input
                          type="text"
                          id="Measurement"
                          name="Measurement"
                          value={updateFormData.Measurement}
                          onChange={handleUpdateFormChange}
                          className="form-control"
                          placeholder="How will this be measured?"
                        />
                      </div>
                    </div>

                    {/* Metrics Section */}
                    <div className="form-section">
                      <div className="section-header">
                        <FontAwesomeIcon icon={faChartLine} />
                        <h3>Metrics & Progress</h3>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor="Baseline">Baseline</label>
                          <input
                            type="number"
                            id="Baseline"
                            name="Baseline"
                            value={updateFormData.Baseline}
                            onChange={handleUpdateFormChange}
                            className="form-control"
                            placeholder="Starting value"
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="Plan">Target Plan</label>
                          <input
                            type="number"
                            id="Plan"
                            name="Plan"
                            value={updateFormData.Plan}
                            onChange={handleUpdateFormChange}
                            className="form-control"
                            placeholder="Target value"
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor="Outcome">ክንውን (Outcome)</label>
                          <input
                            type="number"
                            id="Outcome"
                            name="Outcome"
                            value={updateFormData.Outcome}
                            onChange={handleUpdateFormChange}
                            className="form-control"
                            placeholder="Actual outcome"
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="Execution_Percentage">Execution %</label>
                          <input
                            type="number"
                            id="Execution_Percentage"
                            name="Execution_Percentage"
                            value={updateFormData.Execution_Percentage}
                            onChange={handleUpdateFormChange}
                            className="form-control"
                            min="0"
                            max="100"
                            placeholder="0-100"
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor="Status">Status</label>
                          <select
                            id="Status"
                            name="Status"
                            value={updateFormData.Status}
                            onChange={handleUpdateFormChange}
                            className="form-control"
                          >
                            <option value="">Select Status</option>
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="On Hold">On Hold</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label htmlFor="Progress">Progress</label>
                          <input
                            type="text"
                            id="Progress"
                            name="Progress"
                            value={updateFormData.Progress}
                            onChange={handleUpdateFormChange}
                            className="form-control"
                            placeholder="Progress description"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Comments Section */}
                    <div className="form-section full-width">
                      <div className="section-header">
                        <FontAwesomeIcon icon={faComments} />
                        <h3>Comments</h3>
                      </div>

                      <div className="form-group">
                        <label htmlFor="Comment">Additional Comments</label>
                        <textarea
                          id="Comment"
                          name="Comment"
                          value={updateFormData.Comment}
                          onChange={handleUpdateFormChange}
                          className="form-control"
                          rows="4"
                          placeholder="Add any additional comments or notes..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="form-actions">
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => setActiveView('detail')}
                      disabled={loading}
                    >
                      <FontAwesomeIcon icon={faTimes} />
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Updating...
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faSave} />
                          Update Plan
                        </>
                      )}
                    </button>
                  </div>

                  {/* Messages */}
                  {errorMessage && (
                    <div className="alert alert-danger">
                      <FontAwesomeIcon icon={faExclamationTriangle} />
                      {errorMessage}
                    </div>
                  )}

                  {successMessage && (
                    <div className="alert alert-success">
                      <FontAwesomeIcon icon={faCheckCircle} />
                      {successMessage}
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Add Report View */}
        {activeView === 'report' && selectedPlanId && (
          <div className="report-view">
            <div className="report-header">
              <div className="header-left">
                <h2>
                  <FontAwesomeIcon icon={faPlus} />
                  Add Report
                </h2>
                <div className="plan-badge">
                  Plan #{selectedPlanId}
                </div>
              </div>

              <div className="header-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => setActiveView('detail')}
                >
                  <FontAwesomeIcon icon={faEye} />
                  View Details
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => setActiveView('dashboard')}
                >
                  <FontAwesomeIcon icon={faArrowLeft} />
                  Back to Dashboard
                </button>
              </div>
            </div>

            <div className="report-content">
              <div className="report-form-container">
                <form onSubmit={handleReportSubmit} className="report-form">
                  <div className="form-section">
                    <div className="section-header">
                      <FontAwesomeIcon icon={faFileContract} />
                      <h3>Report Content</h3>
                    </div>

                    <div className="form-group">
                      <label htmlFor="report_content">Report Description *</label>
                      <textarea
                        id="report_content"
                        name="report_content"
                        value={reportFormData.report_content}
                        onChange={handleReportFormChange}
                        className="form-control"
                        rows="8"
                        required
                        placeholder="Enter your detailed report content here..."
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="attachments">Attachments</label>
                      <div className="file-upload-area">
                        <input
                          type="file"
                          id="attachments"
                          multiple
                          onChange={handleReportFileChange}
                          className="file-input"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                        />
                        <div className="file-upload-label">
                          <FontAwesomeIcon icon={faCloudUpload} />
                          <span>Choose files or drag and drop</span>
                          <small>PDF, DOC, DOCX, JPG, PNG, TXT files allowed</small>
                        </div>
                      </div>

                      {reportFiles.length > 0 && (
                        <div className="selected-files">
                          <h4>Selected Files:</h4>
                          <ul>
                            {reportFiles.map((file, index) => (
                              <li key={index} className="file-item">
                                {renderFileIcon(file.name)}
                                <span>{file.name}</span>
                                <span className="file-size">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="upload-progress">
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{width: `${uploadProgress}%`}}
                          ></div>
                        </div>
                        <span>{uploadProgress}% uploaded</span>
                      </div>
                    )}
                  </div>

                  {/* Form Actions */}
                  <div className="form-actions">
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => setActiveView('detail')}
                      disabled={loading}
                    >
                      <FontAwesomeIcon icon={faTimes} />
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading || !reportFormData.report_content.trim()}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faPlus} />
                          Add Report
                        </>
                      )}
                    </button>
                  </div>

                  {/* Messages */}
                  {errorMessage && (
                    <div className="alert alert-danger">
                      <FontAwesomeIcon icon={faExclamationTriangle} />
                      {errorMessage}
                    </div>
                  )}

                  {successMessage && (
                    <div className="alert alert-success">
                      <FontAwesomeIcon icon={faCheckCircle} />
                      {successMessage}
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        )}



      </div>
    </div>
  );
};

export default StaffViewPlan;
