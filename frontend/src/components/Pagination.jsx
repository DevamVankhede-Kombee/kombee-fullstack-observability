const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600">Page</span>
        <span className="px-3 py-1 bg-gradient-to-r from-violet-600 to-pink-600 text-white rounded-lg font-bold text-sm">
          {currentPage}
        </span>
        <span className="text-sm text-gray-600">of</span>
        <span className="px-3 py-1 bg-gray-100 text-gray-900 rounded-lg font-bold text-sm">
          {totalPages}
        </span>
      </div>

      <div className="flex space-x-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center space-x-2 px-5 py-2.5 border-2 border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Previous</span>
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-pink-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <span>Next</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Pagination;
