import { useEffect } from 'react'

/**
 * Custom hook to dynamically update document title and favicon
 */
export function useDocumentTitle(title: string, faviconHref = '/logo.png') {
  useEffect(() => {
    const prevTitle = document.title
    document.title = title

    // Update favicon if provided
    let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']")
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    link.type = 'image/png'
    link.href = faviconHref

    return () => {
      document.title = prevTitle
    }
  }, [title, faviconHref])
}

export default useDocumentTitle
