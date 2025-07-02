import Link from "next/link";

export const Pagination: React.FC<{
    page: number;
    totalPages: number;
    searchParams: Record<string, string | number>;
}> = ({ page, totalPages, searchParams }) => {
    if (totalPages <= 1) return null; // No pagination needed if only one page
    return (
        <div className="flex justify-center mt-6 gap-2">
            <Link
                href={`?${new URLSearchParams({ ...searchParams, page: String(Math.max(1, page - 1)) }).toString()}`}
                className={`px-3 py-1 rounded ${page === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                aria-disabled={page === 1}
            >
                Previous
            </Link>
            <span className="px-3 py-1">Page {page} of {totalPages}</span>
            <Link
                href={`?${new URLSearchParams({ ...searchParams, page: String(Math.min(totalPages, page + 1)) }).toString()}`}
                className={`px-3 py-1 rounded ${page === totalPages ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                aria-disabled={page === totalPages}
            >
                Next
            </Link>
        </div>
    );
};