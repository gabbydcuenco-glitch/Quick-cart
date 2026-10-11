export async function servicesAvailable(fetcher = fetch) {
  try {
    await Promise.all(['catalog', 'orders', 'payment'].map(async service => {
      const response = await fetcher(`/api/${service}/health`, {
        cache: 'no-store', signal: AbortSignal.timeout(5000),
      })
      if (!response.ok || (await response.json()).status !== 'ok') throw new Error('Unavailable')
    }))
    return true
  } catch {
    return false
  }
}
