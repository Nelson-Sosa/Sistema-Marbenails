import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getCategories,
  getActiveCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  toggleCategoryActive,
} from '@/services/serviceCategories/serviceCategoriesService'

const QUERY_KEY = 'serviceCategories'

export function useCategories() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: getCategories,
    staleTime: 1000 * 60 * 30,
  })
}

export function useActiveCategories() {
  return useQuery({
    queryKey: [QUERY_KEY, 'active'],
    queryFn: getActiveCategories,
    staleTime: 1000 * 60 * 30,
  })
}

export function useCategory(id) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => getCategoryById(id),
    enabled: !!id,
  })
}

export function useCreateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}

export function useUpdateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => updateCategory(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}

export function useToggleCategoryActive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, active }) => toggleCategoryActive(id, active),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}
