import { useState, useEffect } from 'react'

const cache = {}
const cacheTime = {}

const CACHE_DURATION = 60000 // 1 minute

export function useCache(key, fetchFn, dependencies = []) {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const loadData = async () => {
            // Check cache
            if (cache[key] && (Date.now() - cacheTime[key]) < CACHE_DURATION) {
                setData(cache[key])
                setLoading(false)
                return
            }

            try {
                setLoading(true)
                const result = await fetchFn()
                cache[key] = result
                cacheTime[key] = Date.now()
                setData(result)
                setError(null)
            } catch (err) {
                setError(err)
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, dependencies)

    const refresh = async () => {
        cacheTime[key] = 0 // Force refresh
        const result = await fetchFn()
        cache[key] = result
        cacheTime[key] = Date.now()
        setData(result)
    }

    return { data, loading, error, refresh }
}