import { useState, useMemo, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '@/store/index'
import { Candidate } from '@/types/index'
import { createDebouncedFunction, memoize, LRUCache } from '@/utils/performance'
import { jaroWinklerSimilarity } from '@/utils/algorithms'

const searchCache = new LRUCache<Candidate[]>(50)

const fuzzySearch = memoize((candidates: Candidate[], term: string): Candidate[] => {
  if (!term.trim()) return candidates

  const cacheKey = `${candidates.length}-${term.toLowerCase()}`
  const cached = searchCache.get(cacheKey)
  if (cached) return cached

  const searchTerm = term.toLowerCase()
  const results = candidates
    .map(candidate => {
      const nameScore = jaroWinklerSimilarity(candidate.name.toLowerCase(), searchTerm)
      const emailScore = jaroWinklerSimilarity(candidate.email.toLowerCase(), searchTerm)
      const positionScore = jaroWinklerSimilarity(candidate.position.toLowerCase(), searchTerm)
      const skillsScore = Math.max(
        ...candidate.skills.map(skill => 
          jaroWinklerSimilarity(skill.toLowerCase(), searchTerm)
        ),
        0
      )

      const maxScore = Math.max(nameScore, emailScore, positionScore, skillsScore)
      
      return {
        candidate,
        score: maxScore
      }
    })
    .filter(item => item.score > 0.3)
    .sort((a, b) => b.score - a.score)
    .map(item => item.candidate)

  searchCache.set(cacheKey, results)
  return results
})

export function useOptimizedSearch() {
  const candidates = useSelector((state: RootState) => state.candidates.candidates)
  const { searchTerm, sortBy, sortOrder } = useSelector((state: RootState) => state.ui)
  
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm)

  const debouncedSearch = createDebouncedFunction((term: string) => {
    setLocalSearchTerm(term)
  }, 300)

  const filteredCandidates = useMemo(() => {
    return fuzzySearch(candidates, localSearchTerm)
  }, [candidates, localSearchTerm])

  const sortedCandidates = useMemo(() => {
    const sorted = [...filteredCandidates].sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'score':
          aValue = a.score || 0
          bValue = b.score || 0
          break
        case 'date':
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
        default:
          return 0
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0
      }
    })

    return sorted
  }, [filteredCandidates, sortBy, sortOrder])

  const searchStats = useMemo(() => ({
    total: candidates.length,
    filtered: filteredCandidates.length,
    hasActiveFilter: localSearchTerm.trim().length > 0
  }), [candidates.length, filteredCandidates.length, localSearchTerm])

  const updateSearch = useCallback((term: string) => {
    debouncedSearch(term)
  }, [debouncedSearch])

  return {
    candidates: sortedCandidates,
    searchStats,
    updateSearch,
    clearSearch: () => setLocalSearchTerm('')
  }
}