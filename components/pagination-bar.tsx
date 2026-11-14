"use client";

import type { MouseEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface PaginationBarProps {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

function getVisiblePages(
  currentPage: number,
  totalPages: number
): Array<number | "ellipsis"> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i);
  }

  const pages: Array<number | "ellipsis"> = [0];
  const start = Math.max(1, currentPage - 1);
  const end = Math.min(totalPages - 2, currentPage + 1);

  if (start > 1) pages.push("ellipsis");
  for (let i = start; i <= end; i += 1) {
    pages.push(i);
  }
  if (end < totalPages - 2) pages.push("ellipsis");
  pages.push(totalPages - 1);

  return pages;
}

export function PaginationBar({
  page,
  size,
  totalElements,
  totalPages,
}: PaginationBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function buildPageHref(targetPage: number): string {
    const next = new URLSearchParams(searchParams.toString());
    next.set("page", String(targetPage));
    next.set("size", String(size));
    return `${pathname}?${next.toString()}`;
  }

  function navigateTo(
    e: MouseEvent<HTMLAnchorElement>,
    targetPage: number,
    disabled = false
  ) {
    if (disabled) {
      e.preventDefault();
      return;
    }
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
      return;
    }
    e.preventDefault();
    router.push(buildPageHref(targetPage));
  }

  const effectiveTotalPages = Math.max(totalPages, 1);
  const hasPrev = page > 0;
  const hasNext = page + 1 < effectiveTotalPages;
  const rangeStart = totalElements === 0 ? 0 : page * size + 1;
  const rangeEnd = Math.min((page + 1) * size, totalElements);
  const visiblePages = getVisiblePages(page, effectiveTotalPages);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border pt-4">
      <div className="font-mono text-xs text-muted-foreground whitespace-nowrap">
        Showing <span className="text-foreground">{rangeStart}</span>–
        <span className="text-foreground">{rangeEnd}</span> of{" "}
        <span className="text-foreground">{totalElements}</span>
      </div>

      <Pagination className="mx-0 w-auto justify-end">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href={hasPrev ? buildPageHref(page - 1) : "#"}
              onClick={(e) => navigateTo(e, page - 1, !hasPrev)}
              aria-disabled={!hasPrev}
              className={!hasPrev ? "pointer-events-none opacity-40" : undefined}
            />
          </PaginationItem>

          {visiblePages.map((item, idx) =>
            item === "ellipsis" ? (
              <PaginationItem key={`ellipsis-${idx}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={item}>
                <PaginationLink
                  href={buildPageHref(item)}
                  isActive={item === page}
                  onClick={(e) => navigateTo(e, item)}
                >
                  {item + 1}
                </PaginationLink>
              </PaginationItem>
            )
          )}

          <PaginationItem>
            <PaginationNext
              href={hasNext ? buildPageHref(page + 1) : "#"}
              onClick={(e) => navigateTo(e, page + 1, !hasNext)}
              aria-disabled={!hasNext}
              className={!hasNext ? "pointer-events-none opacity-40" : undefined}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
