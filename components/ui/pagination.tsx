import React from "react";

type PaginationProps = {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
};

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
}) => {

  const totalPages = Math.max(
    1,
    Math.ceil(totalItems / itemsPerPage)
  );

  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  const pages: (number | "...")[] = [];

  if (startPage > 1) {
    pages.push(1);
    if (startPage > 2) pages.push("...");
  }

  for (let i = startPage; i <= endPage; i++) pages.push(i);

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="flex flex-col w-full sm:flex-row items-center justify-between mt-6 gap-4">
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`flex items-center cursor-pointer gap-2 px-3 py-2 text-sm font-medium rounded-lg border order-1 sm:order-0 ${
          currentPage === 1
            ? "text-gray-400 bg-gray-50 border-gray-200 cursor-not-allowed"
            : "text-gray-700 bg-white border-gray-300 hover:bg-gray-50"
        }`}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M15.8333 10H4.16667M4.16667 10L10 15.8333M4.16667 10L10 4.16667"
            stroke="currentColor"
            strokeWidth="1.67"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Previous
      </button>

      {/* Page Numbers */}
      <div className="flex items-center gap-1 order-2 sm:order-0">
        {pages.map((page, i) => (
          <button
            key={i}
            onClick={() => typeof page === "number" && onPageChange(page)}
            disabled={page === "..."}
            className={`min-w-8 h-8 flex items-center justify-center text-sm font-medium rounded-lg ${
              page === currentPage
                ? "bg-gray-50 text-gray-900 border border-gray-300"
                : page === "..."
                ? "text-gray-400 cursor-default"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            {page}
          </button>
        ))}
      </div>

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`flex items-center cursor-pointer gap-2 px-3 py-2 text-sm font-medium rounded-lg border order-3 sm:order-0 ${
          currentPage === totalPages
            ? "text-gray-400 bg-gray-50 border-gray-200 cursor-not-allowed"
            : "text-gray-700 bg-white border-gray-300 hover:bg-gray-50"
        }`}
      >
        Next
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M4.16667 10H15.8333M15.8333 10L10 4.16667M15.8333 10L10 15.8333"
            stroke="currentColor"
            strokeWidth="1.67"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
};

export default Pagination;
