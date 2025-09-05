import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronRight,
  faSearch,
  faArrowLeft,
  faArrowRight,
  faSave,
  faEdit,
  faSpinner,
  faExclamationTriangle,
  faCheckCircle,
  faTimes,
  faFileContract,
  faChartLine,
  faPlus,
  faClockRotateLeft,
  faEye,
  faList,
  faHistory,
  faBullseye,
  faTasks,
  faListCheck
} from "@fortawesome/free-solid-svg-icons";
import ApprovalHistory from "../ApprovalHistory";
import "./StafPlanSteps.css";

const StafPlanSteps = () => {
  // Main state management
  const [currentMode, setCurrentMode] = useState('create'); // 'create' or 'view'
  const [currentStep, setCurrentStep] = useState('goal'); // 'goal', 'objective', 'specific', 'details', 'form', 'review'
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [selectedObjective, setSelectedObjective] = useState(null);
  const [selectedSpecificObjective, setSelectedSpecificObjective] = useState(null);

  // Plan viewing state
  const [userPlans, setUserPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list', 'detail', 'history'
  const [plansLoading, setPlansLoading] = useState(false);


  // Data arrays
  const [goals, setGoals] = useState([]);
  const [objectives, setObjectives] = useState([]);
  const [specificObjectives, setSpecificObjectives] = useState([]);


  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [searchTerms, setSearchTerms] = useState({
    goal: '',
    objective: '',
    specific: ''
  });

  // Modal state for Step4 (Specific Objective Details)
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [specificObjectiveDetails, setSpecificObjectiveDetails] = useState([]);
  const [newDetail, setNewDetail] = useState({
    name: "",
    description: "",
    baseline: "",
    plan: "",
    measurement: "",
    year: "",
    month: "",
    day: "",
    deadline: "",
    priority: "",
    planType: "",
    costType: "",
    incomeType: "",
    incomeExchange: "",
    hrType: "",
    employmentType: "",
    costName: "",
    incomeName: "",
    CustomcostName: "",
    CIbaseline: "",
    CIplan: "",
    xzx: "",
    CItotalBaseline: "",
    CItotalPlan: "",
    CItotalExpectedOutcome: ""
  });

  const defaultDetailValues = {
    name: "",
    description: "",
    baseline: "",
    plan: "",
    measurement: "",
    year: "",
    month: "",
    day: "",
    deadline: "",
    priority: "",
    planType: "",
    costType: "",
    incomeType: "",
    incomeExchange: "",
    hrType: "",
    employmentType: "",
    costName: "",
    incomeName: "",
    CustomcostName: "",
    CIbaseline: "",
    CIplan: "",
    xzx: "",
    CItotalBaseline: "",
    CItotalPlan: "",
    CItotalExpectedOutcome: ""
  };

  // Form data for step 4
  const [formData, setFormData] = useState({
    measurement: '',
    baseline: '',
    plan: '',
    description: '',
    year: new Date().getFullYear(),
    quarter: '',
    progress: '',
    plan_type: 'default',
    cost_type: '',
    costName: '',
    income_exchange: '',
    incomeName: '',
    employment_type: '',
    CIbaseline: '',
    CIplan: ''
  });

  const token = localStorage.getItem("token");

  // Sidebar state management
  const [sidebarState, setSidebarState] = useState({
    isCollapsed: false,
    sidebarWidth: 280, // Reduced from 320
    mainContentMargin: 280 // Reduced from 320
  });

  // Data fetching functions
  const fetchGoals = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get("http://localhost:5000/api/goalsg", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGoals(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching goals:", err);
      setError("Failed to load goals. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchObjectives = async (goalId) => {
    try {
      setIsLoading(true);
      const response = await axios.get(`http://localhost:5000/api/objectivesg?goal_id=${goalId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Fetched objectives:", response.data);
      if (response.data.length > 0) {
        console.log("First objective structure:", response.data[0]);
        console.log("First objective keys:", Object.keys(response.data[0]));
      }
      setObjectives(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching objectives:", err);
      setError("Failed to load objectives. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSpecificObjectives = async (objectiveId) => {
    if (!objectiveId) {
      console.error("No objective ID provided");
      return;
    }

    console.log("Fetching specific objectives for objective ID:", objectiveId);

    try {
      setIsLoading(true);
      const response = await axios.get(`http://localhost:5000/api/spesificObjectivesg?objective_id=${objectiveId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Fetched specific objectives:", response.data);
      if (response.data.length > 0) {
        console.log("First specific objective structure:", response.data[0]);
        console.log("First specific objective keys:", Object.keys(response.data[0]));
      }
      setSpecificObjectives(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching specific objectives:", err);
      setError("Failed to load specific objectives. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };







  // Selection handlers
  const handleGoalSelect = async (goal) => {
    setSelectedGoal(goal);
    setSelectedObjective(null);
    setSelectedSpecificObjective(null);
    setObjectives([]);
    setSpecificObjectives([]);
    await fetchObjectives(goal.goal_id);
  };

  const handleObjectiveSelect = async (objective) => {
    console.log("Selected objective:", objective);
    console.log("Objective keys:", Object.keys(objective || {}));

    if (!objective) {
      console.error("No objective provided");
      return;
    }

    // The original data uses objective_id, but we need to transform it like the original component
    if (!objective.objective_id) {
      console.error("Invalid objective selected - no objective_id found:", objective);
      return;
    }

    // Transform the objective data like the original component does
    const transformedObjective = {
      id: objective.objective_id,
      name: objective.name,
      description: objective.description,
      goal_id: objective.goal_id
    };

    setSelectedObjective(transformedObjective);
    setSelectedSpecificObjective(null);
    setSpecificObjectives([]);
    await fetchSpecificObjectives(transformedObjective.id);
  };

  const handleSpecificObjectiveSelect = async (specificObjective) => {
    console.log("Selected specific objective:", specificObjective);
    console.log("Specific objective keys:", Object.keys(specificObjective || {}));

    if (!specificObjective) {
      console.error("No specific objective provided");
      return;
    }

    if (!specificObjective.specific_objective_id) {
      console.error("Invalid specific objective selected - no specific_objective_id found:", specificObjective);
      return;
    }

    setSelectedSpecificObjective(specificObjective);

    // Show the details modal for creating specific objective details
    setShowDetailsModal(true);
  };

  // Step4 handler functions (from original Step4SpecificObjectiveDetails component)
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewDetail((prevDetail) => ({
      ...prevDetail,
      [name]: name === "year" || name === "month" || name === "day" ? Number(value) : value,
    }));
  };

  const handlePlanTypeChange = (e) => {
    const { value } = e.target;
    setNewDetail((prevDetail) => ({
      ...prevDetail,
      planType: value,
      costType: "",
      incomeType: "",
      hrType: "",
      costName: "",
      incomeName: ""
    }));
  };

  const handleCostTypeChange = (e) => {
    const { value } = e.target;
    setNewDetail((prevDetail) => ({
      ...prevDetail,
      costType: value,
      costName: ""
    }));
  };

  const handleCostNameChange = (e) => {
    const { value } = e.target;
    setNewDetail((prevDetail) => ({
      ...prevDetail,
      costName: value
    }));
  };

  const handleIncomeExchangeChange = (e) => {
    const { value } = e.target;
    setNewDetail((prevDetail) => ({
      ...prevDetail,
      incomeExchange: value,
      incomeName: ""
    }));
  };

  const handleIncomeTypeChange = (e) => {
    const { value } = e.target;
    setNewDetail((prevDetail) => ({
      ...prevDetail,
      incomeType: value
    }));
  };

  const handleEmploymentTypeChange = (e) => {
    const { value } = e.target;
    setNewDetail((prevDetail) => ({
      ...prevDetail,
      employmentType: value
    }));
  };

  // Calculation function for expected outcome
  const calculateExpectedOutcome = (baseline, plan) => {
    const baselineNum = parseFloat(baseline) || 0;
    const planNum = parseFloat(plan) || 0;
    return planNum - baselineNum;
  };



  // Compute inline error for deadline year validation
  const deadlineYearError =
    newDetail.deadline && newDetail.year && new Date(newDetail.deadline).getFullYear() < newDetail.year
      ? "Deadline's year must be greater than or equal to the specified year."
      : "";

  // Create detail handler
  const handleCreateDetail = async () => {
    if (!selectedSpecificObjective?.specific_objective_id) {
      Swal.fire("Error", "Specific objective ID is missing.", "error");
      return;
    }

    // Validate required fields
    if (!newDetail.name || !newDetail.description || !newDetail.baseline || !newDetail.plan || !newDetail.measurement || !newDetail.year || !newDetail.month || !newDetail.day || !newDetail.priority) {
      Swal.fire("Error", "Please fill in all required fields (name, description, baseline, plan, measurement, year, month, day, priority).", "error");
      return;
    }

    // Validate deadline's year on submit
    if (newDetail.deadline && newDetail.year) {
      const deadlineYear = new Date(newDetail.deadline).getFullYear();
      if (deadlineYear < newDetail.year) {
        Swal.fire("Error", "The deadline's year must be greater than or equal to the specified year.", "error");
        return;
      }
    }

    try {
      setIsLoading(true);
      const payload = {
        specific_objective: [
          {
            specific_objective_id: selectedSpecificObjective.specific_objective_id,
            specific_objective_detailname: newDetail.name || "",
            details: newDetail.description || "",
            baseline: (newDetail.baseline || "0").toString(),
            plan: (newDetail.plan || "0").toString(),
            measurement: (newDetail.measurement || "").toString(),
            year: (newDetail.year || new Date().getFullYear()).toString(),
            month: (newDetail.month || "1").toString(),
            day: (newDetail.day || "1").toString(),
            deadline: newDetail.deadline || null,
            priority: newDetail.priority || "አስፈላጊ",
            name: newDetail.name || "Default Name",
            description: newDetail.description || "Default Description",
            count: 1,
            plan_type: newDetail.planType || null,
            cost_type: newDetail.costType || null,
            income_exchange: newDetail.incomeExchange || null,
            employment_type: newDetail.employmentType || null,
            costName: newDetail.costName === "other"
              ? newDetail.CustomcostName
              : newDetail.costName || null,
            incomeName: newDetail.incomeName || null,
            CIbaseline: (newDetail.CIbaseline || "0").toString(),
            CIplan: (newDetail.CIplan || "0").toString(),
            xzx: (newDetail.xzx || "0").toString()
          },
        ],
      };

      console.log("Payload:", payload);

      const response = await axios.post(
        "http://localhost:5000/api/addspecificObjectiveDetail",
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("API Response:", response.data);

      const createdDetailId = response.data?.insertIds?.[0];

      if (!createdDetailId) {
        console.error("Server response does not contain a valid ID:", response.data);
        Swal.fire("Error", "The server did not return a valid ID. Please check the server logs.", "error");
        return;
      }

      // Create the new updated array of details including the newly created detail.
      const updatedDetails = [
        ...specificObjectiveDetails,
        { ...newDetail, id: createdDetailId },
      ];

      setSpecificObjectiveDetails(updatedDetails);

      Swal.fire("Success", "Detail created successfully!", "success");

      // Reset the newDetail state to default values
      setNewDetail({ ...defaultDetailValues });
    } catch (err) {
      console.error("Error occurred:", err);
      console.error("Error response:", err.response?.data);
      Swal.fire("Error", err.response?.data?.message || "Failed to create detail.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle modal close and proceed to form
  const handleDetailsModalClose = () => {
    if (specificObjectiveDetails.length > 0) {
      setShowDetailsModal(false);
      // Directly submit the plan instead of going to a form step
      handleFormSubmit();
    } else {
      Swal.fire("Warning", "Please add at least one detail before proceeding.", "warning");
    }
  };

  // Handle modal cancel
  const handleDetailsModalCancel = () => {
    setShowDetailsModal(false);
    setNewDetail({ ...defaultDetailValues });
    setSpecificObjectiveDetails([]);
  };



  const handleFormSubmit = async () => {
    try {
      setIsLoading(true);

      if (!selectedGoal?.goal_id || !selectedObjective?.id || !selectedSpecificObjective?.specific_objective_id) {
        throw new Error("Please complete all selection steps before submitting.");
      }

      const payload = {
        goal_id: selectedGoal.goal_id,
        objective_id: selectedObjective.id,
        specific_objective_id: selectedSpecificObjective.specific_objective_id,
        // Include the created details IDs
        specific_objective_details_id: specificObjectiveDetails.map(detail => detail.id),
        ...formData
      };

      await axios.post("http://localhost:5000/api/addplan", payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      Swal.fire({
        title: "እቅድ መመዝገቢያ!",
        text: "እቅዶ በተሳካ ሁኔታ ተመዝግቧል.",
        icon: "success",
        confirmButtonText: "OK",
      });

      setSuccessMessage("እቅዱ ስለተመዝገበ ወደ ሁዋል መመለስ አልያም መውጣት ይችላሉ!");
      setCurrentStep('review');
    } catch (err) {
      console.error("Error during submission:", err);
      Swal.fire({
        title: "Submission Error",
        text: err.response?.data?.message || "An error occurred while submitting the form.",
        icon: "error",
        confirmButtonText: "OK",
      });
      setError(err.response?.data?.message || "An error occurred while submitting the form.");
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize data on component mount
  useEffect(() => {
    fetchGoals();
  }, []);

  // Debug logging
  useEffect(() => {
    console.log('Goals:', goals);
    console.log('Objectives:', objectives);
    console.log('Specific Objectives:', specificObjectives);
  }, [goals, objectives, specificObjectives]);

  // Sidebar state management
  useEffect(() => {
    const handleSidebarToggle = (event) => {
      const { isCollapsed, width } = event.detail;
      const isMobile = window.innerWidth <= 768;
      
      console.log('Staff Plan Steps - Sidebar toggle event:', { isCollapsed, width, isMobile }); // Debug log
      
      setSidebarState({
        isCollapsed,
        sidebarWidth: width,
        mainContentMargin: isMobile ? 0 : width
      });
    };

    // More aggressive sidebar detection
    const detectSidebarState = () => {
      const savedCollapsed = localStorage.getItem('sidebar_collapsed');
      const isMobile = window.innerWidth <= 768;
      
      // Try multiple selectors to find the sidebar
      const sidebarSelectors = [
        'aside[class*="sidebar"]',
        '.sidebar',
        '#sidebar',
        'aside.sidebar',
        '[data-sidebar]'
      ];
      
      let sidebarElement = null;
      for (const selector of sidebarSelectors) {
        sidebarElement = document.querySelector(selector);
        if (sidebarElement) break;
      }
      
      let actualWidth = 280; // Reduced default expanded width
      let collapsedWidth = 80; // default collapsed width
      
      if (sidebarElement) {
        const computedStyle = window.getComputedStyle(sidebarElement);
        const currentWidth = parseInt(computedStyle.width) || 280;
        
        // Determine if currently collapsed based on width
        const isCurrentlyCollapsed = currentWidth < 150; // threshold
        // Use more reasonable widths
        actualWidth = isCurrentlyCollapsed ? 280 : Math.min(currentWidth, 280);
        collapsedWidth = isCurrentlyCollapsed ? currentWidth : 80;
        
        console.log('Staff Plan Steps - Detected sidebar:', { 
          currentWidth, 
          isCurrentlyCollapsed, 
          actualWidth, 
          collapsedWidth 
        });
      }
      
      if (savedCollapsed !== null) {
        const isCollapsed = savedCollapsed === 'true';
        const width = isCollapsed ? collapsedWidth : actualWidth;
        
        console.log('Staff Plan Steps - Setting initial state:', { 
          isCollapsed, 
          width, 
          actualWidth, 
          collapsedWidth, 
          isMobile 
        });
        
        setSidebarState({
          isCollapsed,
          sidebarWidth: width,
          mainContentMargin: isMobile ? 0 : width
        });
      } else {
        // No saved state, detect current state
        const currentWidth = sidebarElement ? parseInt(window.getComputedStyle(sidebarElement).width) : actualWidth;
        const isCollapsed = currentWidth < 150;
        
        setSidebarState({
          isCollapsed,
          sidebarWidth: currentWidth,
          mainContentMargin: isMobile ? 0 : currentWidth
        });
      }
    };

    // Listen for sidebar toggle events
    window.addEventListener('sidebarToggle', handleSidebarToggle);

    // Initial detection with delay to ensure DOM is ready
    setTimeout(detectSidebarState, 100);
    
    // Also detect on DOM changes
    const observer = new MutationObserver(() => {
      setTimeout(detectSidebarState, 50);
    });
    
    observer.observe(document.body, { 
      childList: true, 
      subtree: true, 
      attributes: true, 
      attributeFilter: ['class', 'style'] 
    });

    // Handle window resize
    const handleResize = () => {
      const isMobile = window.innerWidth <= 768;
      setSidebarState(prev => ({
        ...prev,
        mainContentMargin: isMobile ? 0 : prev.sidebarWidth
      }));
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('sidebarToggle', handleSidebarToggle);
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, []);
  
  
  
  
  
  
  

  // Filter functions
  const getFilteredGoals = () => {
    return goals.filter(goal =>
      goal.name?.toLowerCase().includes(searchTerms.goal.toLowerCase()) ||
      goal.description?.toLowerCase().includes(searchTerms.goal.toLowerCase())
    );
  };

  const getFilteredObjectives = () => {
    return objectives.filter(objective =>
      objective.name?.toLowerCase().includes(searchTerms.objective.toLowerCase()) ||
      objective.description?.toLowerCase().includes(searchTerms.objective.toLowerCase())
    );
  };

  const getFilteredSpecificObjectives = () => {
    return specificObjectives.filter(specific =>
      specific.specific_objective_name?.toLowerCase().includes(searchTerms.specific.toLowerCase()) ||
      specific.view?.toLowerCase().includes(searchTerms.specific.toLowerCase())
    );
  };

  // Plan viewing functions
  const fetchUserPlans = async () => {
    try {
      setPlansLoading(true);
      const response = await axios.get("http://localhost:5000/api/my-plans-history", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setUserPlans(response.data.plans);
      } else {
        console.error("Failed to fetch plans:", response.data.message);
      }
    } catch (error) {
      console.error("Error fetching plans:", error);
    } finally {
      setPlansLoading(false);
    }
  };

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    setViewMode('detail');
  };

  const handleViewHistory = (plan) => {
    setSelectedPlan(plan);
    setViewMode('history');
  };

  const resetPlanView = () => {
    setSelectedPlan(null);
    setViewMode('list');
  };

  // Load plans when switching to view mode
  useEffect(() => {
    if (currentMode === 'view') {
      fetchUserPlans();
    }
  }, [currentMode]);





  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header Section */}
      <div className="bg-white bg-opacity-90 border-b border-gray-200 sticky top-0 z-40 shadow-sm" style={{ backdropFilter: 'blur(12px)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Title Section */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-lg transform hover:scale-105 transition-transform duration-200">
                <FontAwesomeIcon icon={faFileContract} className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                  የእቅድ መመዝገቢያ ስርዓት
                </h1>
                <p className="text-gray-600 text-sm lg:text-base font-medium">Professional Plan Creation & Management System</p>
              </div>
            </div>

            {/* Mode Selector */}
            <div className="flex bg-gray-100 bg-opacity-80 rounded-2xl p-1.5 shadow-inner border border-gray-200" style={{ backdropFilter: 'blur(4px)' }}>
              <button
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform ${
                  currentMode === 'create'
                    ? 'bg-white text-blue-600 shadow-lg scale-105 border border-blue-100'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
                onClick={() => setCurrentMode('create')}
              >
                <FontAwesomeIcon icon={faPlus} className="text-sm" />
                <span>Create New Plan</span>
              </button>
              <button
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform ${
                  currentMode === 'view'
                    ? 'bg-white text-blue-600 shadow-lg scale-105 border border-blue-100'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
                onClick={() => setCurrentMode('view')}
              >
                <FontAwesomeIcon icon={faList} className="text-sm" />
                <span>View My Plans</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50/80 backdrop-blur-sm border border-red-200/50 rounded-2xl p-6 flex items-start space-x-4 shadow-sm">
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500 text-lg" />
            </div>
            <div className="flex-1">
              <p className="text-red-800 font-semibold text-lg">Error</p>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600 transition-colors p-1 hover:bg-red-100 rounded-lg"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50/80 backdrop-blur-sm border border-green-200/50 rounded-2xl p-6 flex items-start space-x-4 shadow-sm">
            <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 text-lg" />
            </div>
            <div className="flex-1">
              <p className="text-green-800 font-semibold text-lg">Success</p>
              <p className="text-green-700 text-sm mt-1">{successMessage}</p>
            </div>
            <button
              onClick={() => setSuccessMessage("")}
              className="text-green-400 hover:text-green-600 transition-colors p-1 hover:bg-green-100 rounded-lg"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        )}

        {/* CREATE MODE - Plan Creation Interface */}
        {currentMode === 'create' && (
          <div className="create-plan-content space-y-8">

        {/* Cascading Dropdown Interface */}
        <div className="cascading-dropdowns space-y-6">
          {/* Goal Selection */}
          <div key="goal-selection" className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden transition-all duration-300 hover:shadow-2xl">
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <FontAwesomeIcon icon={faChartLine} className="text-white text-xl" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">Select Goal</h3>
                    <p className="text-blue-100 text-sm">Choose your primary objective</p>
                  </div>
                </div>
                {selectedGoal && (
                  <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-3 flex items-center space-x-3">
                    <span className="text-white font-semibold text-lg">{selectedGoal.name}</span>
                    <button 
                      onClick={() => {
                        setSelectedGoal(null);
                        setSelectedObjective(null);
                        setSelectedSpecificObjective(null);
                      }}
                      className="w-8 h-8 bg-red-500/80 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors duration-200"
                    >
                      <FontAwesomeIcon icon={faTimes} className="text-white text-sm" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {!selectedGoal && (
              <div className="p-8">
                <div className="relative mb-6">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FontAwesomeIcon icon={faSearch} className="text-gray-400 text-lg" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search goals..."
                    value={searchTerms.goal}
                    onChange={(e) => setSearchTerms(prev => ({ ...prev, goal: e.target.value }))}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-500 text-lg"
                  />
                </div>

                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 space-y-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center animate-pulse">
                      <FontAwesomeIcon icon={faSpinner} spin className="text-white text-2xl" />
                    </div>
                    <span className="text-gray-600 text-lg font-medium">Loading goals...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {getFilteredGoals().map((goal) => (
                      <div
                        key={goal.goal_id}
                        onClick={() => handleGoalSelect(goal)}
                        className="group bg-gradient-to-br from-white to-gray-50/50 rounded-2xl p-6 border border-gray-200/50 hover:border-blue-300/50 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <h4 className="text-xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors duration-200 line-clamp-2">{goal.name}</h4>
                          <div className="w-8 h-8 bg-blue-100 group-hover:bg-blue-200 rounded-full flex items-center justify-center transition-all duration-200 group-hover:scale-110">
                            <FontAwesomeIcon icon={faChevronRight} className="text-blue-600 text-sm" />
                          </div>
                        </div>
                        <p className="text-gray-600 group-hover:text-gray-700 text-sm leading-relaxed line-clamp-3">{goal.description}</p>
                        <div className="mt-4 pt-4 border-t border-gray-100 group-hover:border-blue-100">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 group-hover:bg-blue-200">
                            Click to select
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Objective Selection */}
          {selectedGoal && (
            <div key="objective-selection" className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden transition-all duration-300 hover:shadow-2xl animate-fade-in">
              <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-8 py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                      <FontAwesomeIcon icon={faFileContract} className="text-white text-xl" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">Select Objective</h3>
                      <p className="text-emerald-100 text-sm">Define your specific target</p>
                    </div>
                  </div>
                  {selectedObjective && (
                    <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-3 flex items-center space-x-3">
                      <span className="text-white font-semibold text-lg">{selectedObjective.name}</span>
                      <button 
                        onClick={() => {
                          setSelectedObjective(null);
                          setSelectedSpecificObjective(null);
                        }}
                        className="w-8 h-8 bg-red-500/80 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors duration-200"
                      >
                        <FontAwesomeIcon icon={faTimes} className="text-white text-sm" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {!selectedObjective && (
                <div className="p-8">
                  <div className="relative mb-6">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FontAwesomeIcon icon={faSearch} className="text-gray-400 text-lg" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search objectives..."
                      value={searchTerms.objective}
                      onChange={(e) => setSearchTerms(prev => ({ ...prev, objective: e.target.value }))}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 text-gray-900 placeholder-gray-500 text-lg"
                    />
                  </div>

                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-16 space-y-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center animate-pulse">
                        <FontAwesomeIcon icon={faSpinner} spin className="text-white text-2xl" />
                      </div>
                      <span className="text-gray-600 text-lg font-medium">Loading objectives...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {getFilteredObjectives().map((objective) => (
                        <div
                          key={objective.objective_id || objective.id}
                          onClick={() => handleObjectiveSelect(objective)}
                          className="group bg-gradient-to-br from-white to-gray-50/50 rounded-2xl p-6 border border-gray-200/50 hover:border-emerald-300/50 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 hover:bg-gradient-to-br hover:from-emerald-50 hover:to-teal-50"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <h4 className="text-xl font-bold text-gray-900 group-hover:text-emerald-700 transition-colors duration-200 line-clamp-2">{objective.name}</h4>
                            <div className="w-8 h-8 bg-emerald-100 group-hover:bg-emerald-200 rounded-full flex items-center justify-center transition-all duration-200 group-hover:scale-110">
                              <FontAwesomeIcon icon={faChevronRight} className="text-emerald-600 text-sm" />
                            </div>
                          </div>
                          <p className="text-gray-600 group-hover:text-gray-700 text-sm leading-relaxed line-clamp-3">{objective.description}</p>
                          <div className="mt-4 pt-4 border-t border-gray-100 group-hover:border-emerald-100">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 group-hover:bg-emerald-200">
                              Click to select
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Specific Objective Selection */}
          {selectedObjective && (
            <div key="specific-objective-selection" className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden transition-all duration-300 hover:shadow-2xl animate-fade-in">
              <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 px-8 py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                      <FontAwesomeIcon icon={faTasks} className="text-white text-xl" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">Select Specific Objective</h3>
                      <p className="text-purple-100 text-sm">Choose your detailed action plan</p>
                    </div>
                  </div>
                  {selectedSpecificObjective && (
                    <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-3 flex items-center space-x-3">
                      <span className="text-white font-semibold text-lg">{selectedSpecificObjective.specific_objective_name}</span>
                      <button 
                        onClick={() => {
                          setSelectedSpecificObjective(null);
                        }}
                        className="w-8 h-8 bg-red-500/80 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors duration-200"
                      >
                        <FontAwesomeIcon icon={faTimes} className="text-white text-sm" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {!selectedSpecificObjective && (
                <div className="p-8">
                  <div className="relative mb-6">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FontAwesomeIcon icon={faSearch} className="text-gray-400 text-lg" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search specific objectives..."
                      value={searchTerms.specific}
                      onChange={(e) => setSearchTerms(prev => ({ ...prev, specific: e.target.value }))}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200 text-gray-900 placeholder-gray-500 text-lg"
                    />
                  </div>

                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-16 space-y-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center animate-pulse">
                        <FontAwesomeIcon icon={faSpinner} spin className="text-white text-2xl" />
                      </div>
                      <span className="text-gray-600 text-lg font-medium">Loading specific objectives...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {getFilteredSpecificObjectives().map((specific) => (
                        <div
                          key={specific.specific_objective_id}
                          onClick={() => handleSpecificObjectiveSelect(specific)}
                          className="group bg-gradient-to-br from-white to-gray-50/50 rounded-2xl p-6 border border-gray-200/50 hover:border-purple-300/50 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <h4 className="text-xl font-bold text-gray-900 group-hover:text-purple-700 transition-colors duration-200 line-clamp-2">{specific.specific_objective_name}</h4>
                            <div className="w-8 h-8 bg-purple-100 group-hover:bg-purple-200 rounded-full flex items-center justify-center transition-all duration-200 group-hover:scale-110">
                              <FontAwesomeIcon icon={faChevronRight} className="text-purple-600 text-sm" />
                            </div>
                          </div>
                          <p className="text-gray-600 group-hover:text-gray-700 text-sm leading-relaxed line-clamp-3">{specific.view}</p>
                          <div className="mt-4 pt-4 border-t border-gray-100 group-hover:border-purple-100">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 group-hover:bg-purple-200">
                              Click to select
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

    

        {/* Review Section */}
        {currentStep === 'review' && (
          <div key="review-section" className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-200/50 overflow-hidden animate-fade-in">
            <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 px-8 py-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-white text-3xl" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Plan Submitted Successfully!</h2>
                <p className="text-green-100 text-lg">Your plan has been created and submitted for review.</p>
              </div>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200/50">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <FontAwesomeIcon icon={faBullseye} className="text-white text-sm" />
                    </div>
                    <span className="font-semibold text-blue-900">Goal</span>
                  </div>
                  <p className="text-gray-700 font-medium">{selectedGoal?.name}</p>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-200/50">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                      <FontAwesomeIcon icon={faFileContract} className="text-white text-sm" />
                    </div>
                    <span className="font-semibold text-emerald-900">Objective</span>
                  </div>
                  <p className="text-gray-700 font-medium">{selectedObjective?.name}</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200/50">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                      <FontAwesomeIcon icon={faTasks} className="text-white text-sm" />
                    </div>
                    <span className="font-semibold text-purple-900">Specific Objective</span>
                  </div>
                  <p className="text-gray-700 font-medium">{selectedSpecificObjective?.specific_objective_name}</p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-200/50">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                      <FontAwesomeIcon icon={faListCheck} className="text-white text-sm" />
                    </div>
                    <span className="font-semibold text-orange-900">Plan Details</span>
                  </div>
                  <p className="text-gray-700 font-medium">Type: {formData.plan_type} | Year: {formData.year}</p>
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <FontAwesomeIcon icon={faPlus} className="text-lg" />
                  <span>Create Another Plan</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step4 Details Modal */}
        {showDetailsModal && (
          <div className="modal-overlay">
            <div className="modal-container">
              <div className="modal-header">
                <h3>
                  <FontAwesomeIcon icon={faEdit} />
                  አዲስ የውጤቶ ተግባር ዝርዝር ይመዝግቡ
                </h3>
                <button className="modal-close" onClick={handleDetailsModalCancel}>
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>

              <div className="modal-body">
                <form className="details-form">
                  {/* Plan Type Select */}
                  <div className="form-field">
                    <label htmlFor="planType" className="form-label">
                      የተግባሩ አይነት
                    </label>
                    <select
                      id="planType"
                      name="planType"
                      value={newDetail.planType}
                      onChange={handlePlanTypeChange}
                      className="form-select"
                    >
                      <option value="">⬇️ Select Plan Type</option>
                      <option value="cost">ወጪ</option>
                      <option value="income">ገቢ</option>
                      <option value="hr">ሰራተኞች</option>
                    </select>
                  </div>

                  {/* Conditional Fields for Cost Type */}
                  {newDetail.planType === "cost" && (
                    <div className="form-field-group">
                      <div className="form-field">
                        <label htmlFor="costType" className="form-label">
                          ወጪ አይነት
                        </label>
                        <select
                          id="costType"
                          name="costType"
                          value={newDetail.costType}
                          onChange={handleCostTypeChange}
                          className="form-select"
                        >
                          <option value="">⬇️ Select Cost Type</option>
                          <option value="regular_budget">መደበኛ ወጪ</option>
                          <option value="capital_project_budget">ካፒታል ፕሮጀክት ወጪ</option>
                        </select>
                      </div>

                      {newDetail.costType && (
                        <div className="form-field">
                          <label htmlFor="costName" className="form-label">
                            ወጪ ስም
                          </label>
                          <select
                            id="costName"
                            name="costName"
                            value={newDetail.costName}
                            onChange={handleCostNameChange}
                            className="form-select"
                          >
                            <option value="">⬇️ Select Cost Name</option>
                            {newDetail.costType === "regular_budget" && (
                              <>
                                <option disabled className="group-header">regular_budget options</option>
                                <option value="Annual Leave Expense">Annual Leave Expense (511111)</option>
                                <option value="Basic Salary Expense">Basic Salary Expense (511101)</option>
                                <option value="Bonus">Bonus (511114)</option>
                                <option value="Building Insurance">Building Insurance (511351)</option>
                                <option value="Building Rent Expense">Building Rent Expense (511301)</option>
                                <option value="Cash Indemnity Allowance">Cash Indemnity Allowance (511107)</option>
                                <option value="Cash Indemnity Insurance">Cash Indemnity Insurance (511354)</option>
                                <option value="Chemical Material Expense">Chemical Material Expense (511453)</option>
                                <option value="Cleaning and Sanitation Service Expense">Cleaning and Sanitation Service Expense (511205)</option>
                                <option value="Consultants Services Expense">Consultants Services Expense (511207)</option>
                                <option value="Daily Labourers Fee">Daily Labourers Fee (511115)</option>
                                <option value="Food Items">Food Items (511454)</option>
                                <option value="Fuel Allowance">Fuel Allowance (511109)</option>
                                <option value="Fuel and Lubricants">Fuel and Lubricants (511402)</option>
                                <option value="Greenery Services Expense">Greenery Services Expense (511202)</option>
                                <option value="Hardship Allowance">Hardship Allowance (511113)</option>
                                <option value="Housing Allowance">Housing Allowance (511104)</option>
                                <option value="Janitorial and Cleaning Supplies">Janitorial and Cleaning Supplies (511455)</option>
                                <option value="Materials & Supplies">Materials & Supplies (511450)</option>
                                <option value="Medical and Hospitalization">Medical and Hospitalization (511208)</option>
                                <option value="Other Allowances">Other Allowances (511116)</option>
                                <option value="Other Communication Expenses">Other Communication Expenses (511553)</option>
                                <option value="Other Employee Benefits">Other Employee Benefits (511117)</option>
                                <option value="Other Insurance">Other Insurance (511355)</option>
                                <option value="Other Materials and Supplies">Other Materials and Supplies (511457)</option>
                                <option value="Overtime Pay Expense">Overtime Pay Expense (511103)</option>
                                <option value="Parking and Express Road Expense">Parking and Express Road Expense (511403)</option>
                                <option value="Pension Contribution 11%">Pension Contribution 11% (511110)</option>
                                <option value="Printed Materials">Printed Materials</option>
                                <option value="Responsibility and Acting Allowance">Responsibility and Acting Allowance (511106)</option>
                                <option value="Solid Waste Removal Services Expense">Solid Waste Removal Services Expense (511203)</option>
                                <option value="Sewage Line Cleaning Expense">Sewage Line Cleaning Expense (511201)</option>
                                <option value="Stationery and Office Supplies">Stationery and Office Supplies (511451)</option>
                                <option value="Telephone Allowance">Telephone Allowance (511108)</option>
                                <option value="Telephone, Fax, and Internet Expenses">Telephone, Fax, and Internet Expenses (511551)</option>
                                <option value="Transport Allowance">Transport Allowance (511105)</option>
                                <option value="Uniform">Uniform (511500-01)</option>
                                <option value="Uniform and Outfit Expense">Uniform and Outfit Expense (511501)</option>
                                <option value="Vehicle Inspection">Vehicle Inspection (511401)</option>
                                <option value="Vehicle Rent Expense">Vehicle Rent Expense (511302)</option>
                                <option value="Vehicle Running">Vehicle Running (511400-04)</option>
                                <option value="Workmen Compensation">Workmen Compensation (511112)</option>
                                <option value="Zero Liquid Discharge Operations and Management Expense">Zero Liquid Discharge Operations and Management Expense (511204)</option>
                              </>
                            )}
                            {newDetail.costType === "capital_project_budget" && (
                              <>
                                <option disabled className="group-header">capital_project_budget options</option>
                                <option value="Plant, Machinery and Equipment">Plant, Machinery and Equipment (122102)</option>
                                <option value="Office Furnitures, Equipment and Fixtures">Office Furnitures, Equipment and Fixtures (122103)</option>
                                <option value="ETP and STP Building and Structure">ETP and STP Building and Structure (122104)</option>
                                <option value="Power House">Power House (122105)</option>
                                <option value="ICT Equipments">ICT Equipments (122106)</option>
                                <option value="Vehicles and Vehicles Accessories">Vehicles and Vehicles Accessories (122107)</option>
                                <option value="Household Equipment">Household Equipment (122108)</option>
                                <option value="Laboratory Equipment">Laboratory Equipment (122109)</option>
                                <option value="Construction Equipment">Construction Equipment (122110)</option>
                                <option value="Bore Hole Station">Bore Hole Station (122111)</option>
                                <option value="Other Fixed Assets">Other Fixed Assets (122112)</option>
                                <option value="Property, Plant and Equipment - Clearing">Property, Plant and Equipment - Clearing (122113)</option>
                                <option value="Infrstructure Consultancy">Infrstructure Consultancy (122114)</option>
                                <option value="Right of use of Land (PPE)">Right of use of Land (PPE) (122115)</option>
                              </>
                            )}
                            <option disabled className="group-header">if NOT listed above, select "Other"</option>
                            <option value="other">Other</option>
                          </select>

                          {newDetail.costName === "other" && (
                            <div className="form-field">
                              <label htmlFor="CustomcostName" className="form-label">
                                አዲስ ወጪ ስም እንዲገቡ
                              </label>
                              <input
                                id="CustomcostName"
                                type="text"
                                name="CustomcostName"
                                placeholder="አዲስ ወጪ ስም ከዚህ ያስገቡ"
                                value={newDetail.CustomcostName}
                                onChange={handleInputChange}
                                className="form-control"
                              />
                            </div>
                          )}

                          <div className="ci-fields">
                            <div className="form-field">
                              <label htmlFor="CIbaseline" className="form-label">Baseline</label>
                              <input
                                id="CIbaseline"
                                type="number"
                                name="CIbaseline"
                                value={newDetail.CIbaseline || ""}
                                onChange={(e) =>
                                  setNewDetail((prev) => ({
                                    ...prev,
                                    CIbaseline: e.target.value,
                                    xzx: e.target.value && newDetail.CIplan ? newDetail.CIplan - e.target.value : ""
                                  }))
                                }
                                className="form-control"
                              />
                            </div>
                            <div className="form-field">
                              <label htmlFor="CIplan" className="form-label">Plan</label>
                              <input
                                id="CIplan"
                                type="number"
                                name="CIplan"
                                value={newDetail.CIplan || ""}
                                onChange={(e) =>
                                  setNewDetail((prev) => ({
                                    ...prev,
                                    CIplan: e.target.value,
                                    xzx: newDetail.CIbaseline ? e.target.value - newDetail.CIbaseline : ""
                                  }))
                                }
                                className="form-control"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Conditional Fields for Income Type */}
                  {newDetail.planType === "income" && (
                    <div className="form-field-group">
                      <div className="form-field">
                        <label htmlFor="incomeExchange" className="form-label">
                          ገቢ ምንዛሬ
                        </label>
                        <select
                          id="incomeExchange"
                          name="incomeExchange"
                          value={newDetail.incomeExchange}
                          onChange={handleIncomeExchangeChange}
                          className="form-select"
                        >
                          <option value="">⬇️ Select Income Exchange</option>
                          <option value="etb">በETB ምንዛሬ</option>
                          <option value="usd">በUSD ምንዛሬ</option>
                        </select>
                      </div>

                      {newDetail.incomeExchange && (
                        <div className="form-field">
                          <label htmlFor="incomeName" className="form-label">
                            ገቢ ስም
                          </label>
                          <select
                            id="incomeName"
                            name="incomeName"
                            value={newDetail.incomeType}
                            onChange={handleIncomeTypeChange}
                            className="form-select"
                          >
                            <option value="">⬇️ Select Income Name</option>
                            <option value="ከህንጻ ኪራይ">ከህንጻ ኪራይ</option>
                            <option value="ከመሬት ንኡስ ሊዝ">ከመሬት ንዑስ ሊዝ</option>
                            <option value="other">Other</option>
                          </select>

                          {newDetail.incomeType === "other" && (
                            <div className="form-field">
                              <label htmlFor="incomeName" className="form-label">
                                አዲስ ገቢ ስም እንዲገቡ
                              </label>
                              <input
                                id="incomeName"
                                type="text"
                                name="incomeName"
                                placeholder="አዲስ ገቢ ስም ከዚህ ያስገቡ"
                                value={newDetail.incomeName}
                                onChange={handleInputChange}
                                className="form-control"
                              />
                            </div>
                          )}

                          <div className="ci-fields">
                            <div className="form-field">
                              <label htmlFor="CIbaseline" className="form-label">Baseline</label>
                              <input
                                id="CIbaseline"
                                type="number"
                                name="CIbaseline"
                                value={newDetail.CIbaseline || ""}
                                onChange={(e) =>
                                  setNewDetail((prev) => ({
                                    ...prev,
                                    CIbaseline: e.target.value,
                                    xzx: e.target.value && newDetail.CIplan ? newDetail.CIplan - e.target.value : ""
                                  }))
                                }
                                className="form-control"
                              />
                            </div>
                            <div className="form-field">
                              <label htmlFor="CIplan" className="form-label">Plan</label>
                              <input
                                id="CIplan"
                                type="number"
                                name="CIplan"
                                value={newDetail.CIplan || ""}
                                onChange={(e) =>
                                  setNewDetail((prev) => ({
                                    ...prev,
                                    CIplan: e.target.value,
                                    xzx: newDetail.CIbaseline ? e.target.value - newDetail.CIbaseline : ""
                                  }))
                                }
                                className="form-control"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Conditional Fields for HR Type */}
                  {newDetail.planType === "hr" && (
                    <div className="form-field-group">
                      <div className="form-field">
                        <label htmlFor="employmentType" className="form-label">
                          ሰራተኞች አይነት
                        </label>
                        <select
                          id="employmentType"
                          name="employmentType"
                          value={newDetail.employmentType}
                          onChange={handleEmploymentTypeChange}
                          className="form-select"
                        >
                          <option value="">⬇️ Select Employment Type</option>
                          <option value="full_time">ቋሚ</option>
                          <option value="contract">ኮንትራት</option>
                        </select>
                      </div>

                      <div className="ci-fields">
                        <div className="form-field">
                          <label htmlFor="CIbaseline" className="form-label">Baseline</label>
                          <input
                            id="CIbaseline"
                            type="number"
                            name="CIbaseline"
                            value={newDetail.CIbaseline || ""}
                            onChange={(e) =>
                              setNewDetail((prev) => ({
                                ...prev,
                                CIbaseline: e.target.value,
                                xzx: e.target.value && newDetail.CIplan ? newDetail.CIplan - e.target.value : ""
                              }))
                            }
                            className="form-control"
                          />
                        </div>
                        <div className="form-field">
                          <label htmlFor="CIplan" className="form-label">Plan</label>
                          <input
                            id="CIplan"
                            type="number"
                            name="CIplan"
                            value={newDetail.CIplan || ""}
                            onChange={(e) =>
                              setNewDetail((prev) => ({
                                ...prev,
                                CIplan: e.target.value,
                                xzx: newDetail.CIbaseline ? e.target.value - newDetail.CIbaseline : ""
                              }))
                            }
                            className="form-control"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Common Fields for all plan types */}
                  <div className="form-field-group">
                    <div className="form-field">
                      <label htmlFor="name" className="form-label">
                        የውጤቱ ሚከናወን ዝርዝር ሥራ *
                      </label>
                      <input
                        id="name"
                        type="text"
                        name="name"
                        value={newDetail.name}
                        onChange={handleInputChange}
                        className="form-control"
                        placeholder="Enter detail name"
                        required
                      />
                    </div>

                    <div className="form-field">
                      <label htmlFor="description" className="form-label">
                        መግለጫ *
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        value={newDetail.description}
                        onChange={handleInputChange}
                        className="form-control"
                        rows="3"
                        placeholder="Enter description"
                        required
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-field">
                        <label htmlFor="baseline" className="form-label">
                          መነሻ *
                        </label>
                        <input
                          id="baseline"
                          type="number"
                          name="baseline"
                          value={newDetail.baseline}
                          onChange={handleInputChange}
                          className="form-control"
                          placeholder="Enter baseline"
                          required
                        />
                      </div>

                      <div className="form-field">
                        <label htmlFor="plan" className="form-label">
                          እቅድ *
                        </label>
                        <input
                          id="plan"
                          type="number"
                          name="plan"
                          value={newDetail.plan}
                          onChange={handleInputChange}
                          className="form-control"
                          placeholder="Enter plan"
                          required
                        />
                      </div>
                    </div>

                    <div className="form-field">
                      <label htmlFor="measurement" className="form-label">
                        መለኪያ *
                      </label>
                      <select
                        id="measurement"
                        name="measurement"
                        value={newDetail.measurement}
                        onChange={handleInputChange}
                        className="form-select"
                        required
                      >
                        <option value="">⬇️ Select Measurement</option>
                        <option value="present">Present</option>
                        <option value="USD">USD</option>
                        <option value="ETB">ETB</option>
                        <option value="performance">Performance</option>
                        <option value="number">Number</option>
                      </select>
                    </div>

                    <div className="form-row">
                      <div className="form-field">
                        <label htmlFor="year" className="form-label">
                          አመት *
                        </label>
                        <input
                          id="year"
                          type="number"
                          name="year"
                          value={newDetail.year}
                          onChange={handleInputChange}
                          className="form-control"
                          placeholder="Enter year"
                          min="2020"
                          max="2030"
                          required
                        />
                      </div>

                      <div className="form-field">
                        <label htmlFor="month" className="form-label">
                          ወር
                        </label>
                        <select
                          id="month"
                          name="month"
                          value={newDetail.month}
                          onChange={handleInputChange}
                          className="form-select"
                        >
                          <option value="">Select Month</option>
                          <option value="1">January</option>
                          <option value="2">February</option>
                          <option value="3">March</option>
                          <option value="4">April</option>
                          <option value="5">May</option>
                          <option value="6">June</option>
                          <option value="7">July</option>
                          <option value="8">August</option>
                          <option value="9">September</option>
                          <option value="10">October</option>
                          <option value="11">November</option>
                          <option value="12">December</option>
                        </select>
                      </div>

                      <div className="form-field">
                        <label htmlFor="day" className="form-label">
                          ቀን
                        </label>
                        <input
                          id="day"
                          type="number"
                          name="day"
                          value={newDetail.day}
                          onChange={handleInputChange}
                          className="form-control"
                          placeholder="Enter day"
                          min="1"
                          max="31"
                        />
                      </div>
                    </div>

                    <div className="form-field">
                      <label htmlFor="deadline" className="form-label">
                        የመጨረሻ ቀን
                      </label>
                      <input
                        id="deadline"
                        type="date"
                        name="deadline"
                        value={newDetail.deadline}
                        onChange={handleInputChange}
                        className="form-control"
                      />
                      {deadlineYearError && (
                        <div className="error-message">{deadlineYearError}</div>
                      )}
                    </div>

                    <div className="form-field">
                      <label htmlFor="priority" className="form-label">
                        ቅድሚያ *
                      </label>
                      <select
                        id="priority"
                        name="priority"
                        value={newDetail.priority}
                        onChange={handleInputChange}
                        className="form-select"
                        required
                      >
                        <option value="">⬇️ Select Priority</option>
                        <option value="አስፈላጊ">አስፈላጊ (Important)</option>
                        <option value="በጣም አስፈላጊ">በጣም አስፈላጊ (Very Important)</option>
                        <option value="መደበኛ">መደበኛ (Normal)</option>
                        <option value="ዝቅተኛ">ዝቅተኛ (Low)</option>
                      </select>
                    </div>
                  </div>
                </form>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleDetailsModalCancel}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleCreateDetail}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin />
                      Creating...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faPlus} />
                      Create Detail
                    </>
                  )}
                </button>
                {specificObjectiveDetails.length > 0 && (
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={handleDetailsModalClose}
                  >
                    <FontAwesomeIcon icon={faArrowRight} />
                    Continue ({specificObjectiveDetails.length} details)
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        </div>
        )}

        {/* VIEW MODE - Plan Viewing Interface */}
        {currentMode === 'view' && (
          <div className="view-plans-content">
            {viewMode === 'list' && (
              <div className="plans-list-view">
                <div className="plans-header">
                  <h2>
                    <FontAwesomeIcon icon={faList} />
                    My Plans & Approval History
                  </h2>
                  <p>View your submitted plans and track their approval status</p>
                </div>

                {plansLoading ? (
                  <div className="loading-container">
                    <FontAwesomeIcon icon={faSpinner} spin />
                    <span>Loading your plans...</span>
                  </div>
                ) : userPlans.length === 0 ? (
                  <div className="no-plans-container">
                    <div className="no-plans-icon">
                      <FontAwesomeIcon icon={faFileContract} />
                    </div>
                    <h3>No Plans Found</h3>
                    <p>You haven't submitted any plans yet. Create your first plan to get started!</p>
                    <button
                      className="btn btn-primary"
                      onClick={() => setCurrentMode('create')}
                    >
                      <FontAwesomeIcon icon={faPlus} />
                      Create New Plan
                    </button>
                  </div>
                ) : (
                  <div className="plans-grid">
                    {userPlans.map((plan) => (
                      <div key={plan.plan_id} className="plan-card">
                        <div className="plan-card-header">
                          <div className="plan-id">Plan #{plan.plan_id}</div>
                          <div className={`plan-status ${plan.approval_summary.current_status.toLowerCase()}`}>
                            {plan.approval_summary.current_status === 'Approved' && '✅'}
                            {plan.approval_summary.current_status === 'Pending' && '⏳'}
                            {plan.approval_summary.current_status === 'Declined' && '❌'}
                            {plan.approval_summary.current_status}
                          </div>
                        </div>

                        <div className="plan-card-content">
                          <h3>{plan.plan_details.goal_name}</h3>
                          <p className="objective">{plan.plan_details.objective_name}</p>
                          <p className="specific-objective">{plan.plan_details.specific_objective_name}</p>

                          <div className="plan-meta">
                            <div className="meta-item">
                              <strong>Department:</strong> {plan.plan_details.department_name}
                            </div>
                            <div className="meta-item">
                              <strong>Created:</strong> {new Date(plan.plan_created_at).toLocaleDateString()}
                            </div>
                          </div>

                          <div className="approval-summary">
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
                          </div>
                        </div>

                        <div className="plan-card-actions">
                          <button
                            className="btn btn-secondary"
                            onClick={() => handlePlanSelect(plan)}
                          >
                            <FontAwesomeIcon icon={faEye} />
                            View Details
                          </button>
                          <button
                            className="btn btn-primary"
                            onClick={() => handleViewHistory(plan)}
                          >
                            <FontAwesomeIcon icon={faClockRotateLeft} />
                            Approval History
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Plan Detail View */}
            {viewMode === 'detail' && selectedPlan && (
              <div className="plan-detail-view">
                <div className="detail-header">
                  <button
                    className="btn btn-secondary back-btn"
                    onClick={resetPlanView}
                  >
                    <FontAwesomeIcon icon={faArrowLeft} />
                    Back to Plans
                  </button>
                  <h2>Plan #{selectedPlan.plan_id} - Details</h2>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleViewHistory(selectedPlan)}
                  >
                    <FontAwesomeIcon icon={faClockRotateLeft} />
                    View Approval History
                  </button>
                </div>

                <div className="plan-detail-content">
                  <div className="detail-section">
                    <h3>Goal Information</h3>
                    <p><strong>Goal:</strong> {selectedPlan.plan_details.goal_name}</p>
                    <p><strong>Description:</strong> {selectedPlan.plan_details.goal_description}</p>
                  </div>

                  <div className="detail-section">
                    <h3>Objective Information</h3>
                    <p><strong>Objective:</strong> {selectedPlan.plan_details.objective_name}</p>
                    <p><strong>Description:</strong> {selectedPlan.plan_details.objective_description}</p>
                  </div>

                  <div className="detail-section">
                    <h3>Specific Objective</h3>
                    <p><strong>Specific Objective:</strong> {selectedPlan.plan_details.specific_objective_name}</p>
                    <p><strong>View:</strong> {selectedPlan.plan_details.specific_objective_view}</p>
                  </div>

                  <div className="detail-section">
                    <h3>Plan Information</h3>
                    <p><strong>Department:</strong> {selectedPlan.plan_details.department_name}</p>
                    <p><strong>Created:</strong> {new Date(selectedPlan.plan_created_at).toLocaleString()}</p>
                    <p><strong>Current Status:</strong>
                      <span className={`status-badge ${selectedPlan.approval_summary.current_status.toLowerCase()}`}>
                        {selectedPlan.approval_summary.current_status}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Approval History View */}
            {viewMode === 'history' && selectedPlan && (
              <div className="approval-history-view">
                <div className="history-header">
                  <button
                    className="btn btn-secondary back-btn"
                    onClick={resetPlanView}
                  >
                    <FontAwesomeIcon icon={faArrowLeft} />
                    Back to Plans
                  </button>
                  <h2>
                    <FontAwesomeIcon icon={faClockRotateLeft} />
                    Approval History - Plan #{selectedPlan.plan_id}
                  </h2>
                  <button
                    className="btn btn-secondary"
                    onClick={() => handlePlanSelect(selectedPlan)}
                  >
                    <FontAwesomeIcon icon={faEye} />
                    View Details
                  </button>
                </div>

                <div className="history-content">
                  <div className="history-intro">
                    <div className="intro-card">
                      <div className="intro-icon">
                        <FontAwesomeIcon icon={faClockRotateLeft} />
                      </div>
                      <div className="intro-content">
                        <h3>Plan Approval Timeline</h3>
                        <p>Track the complete approval journey of your plan, including all approver decisions, comments, and timestamps.</p>
                      </div>
                    </div>
                  </div>

                  <div className="history-timeline">
                    <ApprovalHistory
                      planId={selectedPlan.plan_id}
                      showFullHistory={false}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      </div>
      );
      };

export default StafPlanSteps;

