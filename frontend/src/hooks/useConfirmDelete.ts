import { useState } from 'react'

export function useConfirmDelete<T extends { id: number }>(
  onDelete: (item: T) => Promise<void> | Promise<string | void>,
  fallbackError = 'Gagal menghapus data.'
) {
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const requestDelete = (item: T) => {
    setDeleteTarget(item)
    setDeleteError(null)
  }

  const cancelDelete = () => {
    setDeleteTarget(null)
    setDeleteError(null)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await onDelete(deleteTarget)
      setDeleteTarget(null)
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : fallbackError)
    } finally {
      setDeleting(false)
    }
  }

  return {
    deleteTarget,
    deleteError,
    deleting,
    requestDelete,
    cancelDelete,
    confirmDelete,
  }
}

