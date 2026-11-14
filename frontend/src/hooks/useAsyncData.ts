import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DependencyList,
} from 'react'

export interface AsyncDataState<T> {
  data: T
  setData: React.Dispatch<React.SetStateAction<T>>
  loading: boolean
  error: string | null
  reload: () => Promise<void>
}

export function useAsyncData<T>(
  fetcher: () => Promise<T>,
  initialValue: T,
  fallbackError = 'Gagal memuat data.',
  deps: DependencyList = [],
): AsyncDataState<T> {
  const [data, setData] = useState<T>(initialValue)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetcherRef = useRef(fetcher)
  const fallbackRef = useRef(fallbackError)
  const depsKey = JSON.stringify(deps)

  useEffect(() => {
    fetcherRef.current = fetcher
    fallbackRef.current = fallbackError
  })

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetcherRef.current()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : fallbackRef.current)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    Promise.resolve()
      .then(() => {
        if (!active) return Promise.resolve()
        setLoading(true)
        return fetcherRef.current().then((result) => {
          if (active) {
            setData(result)
            setError(null)
          }
        })
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : fallbackRef.current)
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [depsKey])

  return { data, setData, loading, error, reload }
}
