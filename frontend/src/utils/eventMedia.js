export function getEventImage(event) {
  const text = `${event?.category?.name || ''} ${event?.title || ''}`.toLowerCase()

  if (/academic|research|science/.test(text)) return '/images/academic.jpg'
  if (/workshop|tech|coding|hackathon/.test(text)) return '/images/workshop.jpg'
  if (/seminar|conference|summit|talk/.test(text)) return '/images/conference.jpg'
  if (/career|network|startup|club/.test(text)) return '/images/career.jpg'

  return '/images/campus-default.jpg'
}

export function normalizeArray(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.data?.data)) return payload.data.data
  return []
}

export function normalizeObject(payload, key) {
  const candidate = payload?.[key] ?? payload?.data?.[key] ?? payload?.data ?? payload
  return candidate && typeof candidate === 'object' && !Array.isArray(candidate) ? candidate : null
}
