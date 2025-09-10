import React, { useEffect } from "react";

const Filters = ({ filters, handleFilterChange, applyFilters, dropdownOptions, loadingOptions }) => {
  
  // Debug logging
  useEffect(() => {
    console.log("Filters component - dropdownOptions:", dropdownOptions);
    console.log("Filters component - loadingOptions:", loadingOptions);
  }, [dropdownOptions, loadingOptions]);
  return (
    <div className="space-y-6">
      {/* Global Search */}
      <div className="col-span-full">
        <label htmlFor="search" className="block text-sm font-medium text-slate-700 mb-2">
          <i className="bi bi-search mr-2 text-blue-600"></i>
          Global Search
        </label>
        <div className="relative">
          <input
            type="text"
            id="search"
            name="search"
            value={filters.search || ""}
            onChange={handleFilterChange}
            className="w-full px-4 py-3 pl-11 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            placeholder="Search across all report data..."
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <i className="bi bi-search text-slate-400"></i>
          </div>
        </div>
      </div>

      {/* Filter Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Fiscal Year */}
        <div>
          <label htmlFor="year" className="block text-sm font-medium text-slate-700 mb-2">
            <i className="bi bi-calendar3 mr-2 text-blue-600"></i>
            Fiscal Year
          </label>
          <input
            type="number"
            id="year"
            name="year"
            value={filters.year}
            onChange={handleFilterChange}
            className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            placeholder="e.g., 2024"
            min="2020"
            max="2030"
          />
        </div>

        {/* Quarter */}
        <div>
          <label htmlFor="quarter" className="block text-sm font-medium text-slate-700 mb-2">
            <i className="bi bi-bar-chart mr-2 text-blue-600"></i>
            Quarter
          </label>
          <select
            id="quarter"
            name="quarter"
            value={filters.quarter}
            onChange={handleFilterChange}
            className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          >
            <option value="">All Quarters</option>
            <option value="1">Q1 (Jan-Mar)</option>
            <option value="2">Q2 (Apr-Jun)</option>
            <option value="3">Q3 (Jul-Sep)</option>
            <option value="4">Q4 (Oct-Dec)</option>
          </select>
        </div>

        {/* Department */}
        <div>
          <label htmlFor="department" className="block text-sm font-medium text-slate-700 mb-2">
            <i className="bi bi-building mr-2 text-blue-600"></i>
            Department
          </label>
          <select
            id="department"
            name="department"
            value={filters.department}
            onChange={handleFilterChange}
            className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          >
            <option value="">All Departments</option>
            <option value="አካውንቲንግ እና ፋይናንስ">አካውንቲንግ እና ፋይናንስ</option>
            <option value="ኢንፎርሜሽን ቴክኖሎጂ ልማት">ኢንፎርሜሽን ቴክኖሎጂ ልማት</option>
            <option value="ኮንስትራክሽን">ኮንስትራክሽን</option>
            <option value="ኦዲት">ኦዲት</option>
            <option value="ቢዝነስ ዴቨሎፕመንት">ቢዝነስ ዴቨሎፕመንት</option>
            <option value="ህግ">ህግ</option>
          </select>
        </div>

        {/* Goal */}
        <div>
          <label htmlFor="goal_id" className="block text-sm font-medium text-slate-700 mb-2">
            <i className="bi bi-bullseye mr-2 text-blue-600"></i>
            Goal
          </label>
          <select
            id="goal_id"
            name="goal_id"
            value={filters.goal_id}
            onChange={handleFilterChange}
            className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-slate-100 disabled:text-slate-500"
            disabled={loadingOptions}
          >
            <option value="">All Goals</option>
            {loadingOptions ? (
              <option disabled>Loading goals...</option>
            ) : (
              dropdownOptions.goals.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  {goal.name}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Objective */}
        <div>
          <label htmlFor="objective_id" className="block text-sm font-medium text-slate-700 mb-2">
            <i className="bi bi-clipboard-check mr-2 text-blue-600"></i>
            Objective
          </label>
          <select
            id="objective_id"
            name="objective_id"
            value={filters.objective_id}
            onChange={handleFilterChange}
            className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-slate-100 disabled:text-slate-500"
            disabled={loadingOptions}
          >
            <option value="">All Objectives</option>
            {loadingOptions ? (
              <option disabled>Loading objectives...</option>
            ) : (
              dropdownOptions.objectives.map((objective) => (
                <option key={objective.id} value={objective.id}>
                  {objective.name}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Specific Objective */}
        <div>
          <label htmlFor="specific_objective_id" className="block text-sm font-medium text-slate-700 mb-2">
            <i className="bi bi-target mr-2 text-blue-600"></i>
            Specific Objective
          </label>
          <select
            id="specific_objective_id"
            name="specific_objective_id"
            value={filters.specific_objective_id}
            onChange={handleFilterChange}
            className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-slate-100 disabled:text-slate-500"
            disabled={loadingOptions}
          >
            <option value="">All Specific Objectives</option>
            {loadingOptions ? (
              <option disabled>Loading specific objectives...</option>
            ) : (
              dropdownOptions.specificObjectives.map((specificObjective) => (
                <option key={specificObjective.id} value={specificObjective.id}>
                  {specificObjective.name || specificObjective.specific_objective_name || `Specific Objective ${specificObjective.id}`}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Detail */}
        <div>
          <label htmlFor="specific_objective_detail_id" className="block text-sm font-medium text-slate-700 mb-2">
            <i className="bi bi-file-text mr-2 text-blue-600"></i>
            Detail
          </label>
          <select
            id="specific_objective_detail_id"
            name="specific_objective_detail_id"
            value={filters.specific_objective_detail_id}
            onChange={handleFilterChange}
            className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-slate-100 disabled:text-slate-500"
            disabled={loadingOptions}
          >
            <option value="">All Details</option>
            {loadingOptions ? (
              <option disabled>Loading details...</option>
            ) : (
              dropdownOptions.details.map((detail) => (
                <option key={detail.id} value={detail.id}>
                  {detail.name || detail.detail_name || detail.specific_detail || `Detail ${detail.id}`}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-200">
        <button
          onClick={applyFilters}
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <i className="bi bi-search mr-2"></i>
          Apply Filters
        </button>
        
        <button
          onClick={() => {
            // Clear all filters
            Object.keys(filters).forEach(key => {
              handleFilterChange({ target: { name: key, value: '' } });
            });
            applyFilters();
          }}
          className="inline-flex items-center px-6 py-3 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500/20 transition-all duration-200"
        >
          <i className="bi bi-x-circle mr-2"></i>
          Clear All
        </button>
        
        <button
          onClick={() => console.log('Export filtered data')}
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-lg hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <i className="bi bi-download mr-2"></i>
          Export Data
        </button>
      </div>
    </div>
  );
};

export default Filters;
