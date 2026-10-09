import { useEffect, useState } from 'react'

// Runs an async loader and returns { data, error, loading, stale }.
// Pass a STABLE loader (module-level function or useCallback): a new loader means a new request.
// "stale" keeps the last good result so a summary does not flash empty while it refreshes.
export function useApi(loader) {
  const [result, setResult] = useState({ source: null, data: null, error: '' })

  useEffect(() => {
    let active = true
    loader()
      .then((data) => {
        if (active) setResult({ source: loader, data, error: '' })
      })
      .catch((err) => {
        if (active) setResult({ source: loader, data: null, error: err.message })
      })
    return () => {
      active = false
    }
  }, [loader])

  const loading = result.source !== loader
  return {
    data: loading ? null : result.data,
    error: loading ? '' : result.error,
    loading,
    stale: result.data,
  }
}
