import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/generic/button"

interface PaginationProps {
    currentPage: number
    totalPages: number
    searchParams?: Record<string, string>
    basePath?: string
}

export function Pagination({
    currentPage,
    totalPages,
    searchParams = {},
    basePath = "/movies",
}: PaginationProps) {
    if (totalPages <= 1) return null

    const createHref = (page: number) => {
        const params = new URLSearchParams(Object.entries(searchParams))
        if (page === 1) {
            params.delete("page")
        } else {
            params.set("page", page.toString())
        }
        const queryString = params.toString()
        return queryString ? `${basePath}?${queryString}` : basePath
    }

    return (
        <div className="flex items-center justify-center gap-2 py-8">
            <Button
                variant="outline"
                size="sm"
                className="gap-2 bg-transparent"
                disabled={currentPage === 1}
                asChild={currentPage > 1}
            >
                {currentPage > 1 ? (
                    <Link href={createHref(currentPage - 1)}>
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                    </Link>
                ) : (
                    <>
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                    </>
                )}
            </Button>

            <div className="flex items-center gap-1 mx-4">
                {[...getPaginationButtons({
                    currentPage,
                    totalPages,
                    maxVisiblePages: 7,
                    createHref,
                })]}
            </div>

            <Button
                variant="outline"
                size="sm"
                className="gap-2 bg-transparent"
                disabled={currentPage === totalPages}
                asChild={currentPage < totalPages}
            >
                {currentPage < totalPages ? (
                    <Link href={createHref(currentPage + 1)}>
                        Next
                        <ChevronRight className="h-4 w-4" />
                    </Link>
                ) : (
                    <>
                        Next
                        <ChevronRight className="h-4 w-4" />
                    </>
                )}
            </Button>
        </div>
    )
}

function* getPaginationButtons({ currentPage, totalPages, maxVisiblePages, createHref }: { currentPage: number, totalPages: number, maxVisiblePages: number, createHref: (page: number) => string }) {
    if (totalPages <= maxVisiblePages) {
        // Show all pages if total pages is small
        for (let i = 1; i <= totalPages; i++) {
            yield (
                <Button
                    key={i}
                    variant={currentPage === i ? "default" : "outline"}
                    size="sm"
                    className="min-w-[40px]"
                    asChild
                >
                    <Link href={createHref(i)}>{i}</Link>
                </Button>
            );
        }
    } else {
        // Show first page
        yield (
            <Button key={1} variant={currentPage === 1 ? "default" : "outline"} size="sm" className="min-w-[40px]" asChild>
                <Link href={createHref(1)}>1</Link>
            </Button>
        );

        // Show ellipsis if needed
        if (currentPage > 4) {
            yield (
                <span key="ellipsis1" className="px-2 text-muted-foreground">
                    ...
                </span>
            )
        }

        // Show pages around current page
        const start = Math.max(2, currentPage - 1)
        const end = Math.min(totalPages - 1, currentPage + 1)

        for (let i = start; i <= end; i++) {
            if (i !== 1 && i !== totalPages) {
                yield (
                    <Button
                        key={i}
                        variant={currentPage === i ? "default" : "outline"}
                        size="sm"
                        className="min-w-[40px]"
                        asChild
                    >
                        <Link href={createHref(i)}>{i}</Link>
                    </Button>
                )
            }
        }

        // Show ellipsis if needed
        if (currentPage < totalPages - 3) {
            yield (
                <span key="ellipsis2" className="px-2 text-muted-foreground">
                    ...
                </span>
            )
        }

        // Show last page
        if (totalPages > 1) {
            yield (
                <Button
                    key={totalPages}
                    variant={currentPage === totalPages ? "default" : "outline"}
                    size="sm"
                    className="min-w-[40px]"
                    asChild
                >
                    <Link href={createHref(totalPages)}>{totalPages}</Link>
                </Button>
            )
        }
    }
}