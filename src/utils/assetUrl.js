export function assetUrl(path) {
  if (!path) return path

  if (
    /^(?:[a-z]+:)?\/\//i.test(path) ||
    path.startsWith('data:') ||
    path.startsWith('blob:')
  ) {
    return path
  }

  const baseUrl = import.meta.env.BASE_URL || '/'
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`

  if (path.startsWith(normalizedBaseUrl)) {
    return path
  }

  return `${normalizedBaseUrl}${path.replace(/^\/+/, '')}`
}
