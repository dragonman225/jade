import { useState } from 'react'

interface Pager {
  page: number
  start: number
  nextStart: number
  goPrevPage: () => void
  goNextPage: () => void
  resetPage: () => void
}

export function usePager(items: unknown[], itemsPerPage: number): Pager {
  const [page, setPage] = useState<number>(0)
  const start = page * itemsPerPage
  const nextStart = (page + 1) * itemsPerPage

  function isFirstPage() {
    return page === 0
  }

  function isLastPage() {
    return nextStart > items.length - 1
  }

  function goPrevPage() {
    if (!isFirstPage()) setPage(page - 1)
  }

  function goNextPage() {
    if (!isLastPage()) setPage(page + 1)
  }

  function resetPage() {
    setPage(0)
  }

  return {
    page,
    start,
    nextStart,
    goPrevPage,
    goNextPage,
    resetPage,
  }
}
