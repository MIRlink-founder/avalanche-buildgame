'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@mire/ui';
import { cn } from '@mire/ui';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  /** 미지정 시 /admin/hospitals (목록 페이지용) */
  basePath?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  basePath = '/admin/hospitals',
}: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`${basePath}?${params.toString()}`);
  };

  // 표시할 페이지 번호 계산 (현재 페이지 기준 좌우 2개씩)
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showPages = 5; // 표시할 페이지 버튼 수

    if (totalPages <= showPages + 2) {
      // 전체 페이지가 적으면 모두 표시
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 첫 페이지는 항상 표시
      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      // 현재 페이지 주변 표시
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      // 마지막 페이지는 항상 표시
      pages.push(totalPages);
    }

    return pages;
  };

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        총 {totalCount}개 중 {startItem}-{endItem} 표시
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {getPageNumbers().map((page, index) =>
          typeof page === 'number' ? (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page)}
              className={cn(
                'min-w-[2.5rem]',
                currentPage === page &&
                  'bg-gray-900 text-white hover:bg-gray-800 hover:text-white',
              )}
            >
              {page}
            </Button>
          ) : (
            <span key={index} className="px-2">
              {page}
            </span>
          ),
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
