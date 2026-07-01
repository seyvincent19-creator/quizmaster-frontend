export default function Pagination({ meta, onPageChange }) {
  if (!meta || meta.last_page <= 1) return null;

  const pages = Array.from({ length: meta.last_page }, (_, i) => i + 1);
  const visiblePages = pages.filter(p =>
    p === 1 || p === meta.last_page ||
    Math.abs(p - meta.current_page) <= 2
  );

  return (
    <div className="flex items-center justify-between mt-4">
      <p className="text-sm text-gray-500">
        Showing page {meta.current_page} of {meta.last_page} ({meta.total} total)
      </p>
      <div className="flex gap-1">
        <button
          onClick={() => onPageChange(meta.current_page - 1)}
          disabled={meta.current_page === 1}
          className="px-3 py-1 rounded border text-sm disabled:opacity-40 hover:bg-gray-100"
        >
          &laquo;
        </button>
        {visiblePages.map((page, idx) => {
          const prev = visiblePages[idx - 1];
          return (
            <>
              {prev && page - prev > 1 && <span key={`gap-${page}`} className="px-2 py-1 text-gray-400">…</span>}
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`px-3 py-1 rounded border text-sm ${
                  page === meta.current_page
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'hover:bg-gray-100'
                }`}
              >
                {page}
              </button>
            </>
          );
        })}
        <button
          onClick={() => onPageChange(meta.current_page + 1)}
          disabled={meta.current_page === meta.last_page}
          className="px-3 py-1 rounded border text-sm disabled:opacity-40 hover:bg-gray-100"
        >
          &raquo;
        </button>
      </div>
    </div>
  );
}
