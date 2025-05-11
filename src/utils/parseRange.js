export function parseRange(rangeHeader, bufferLength) {
  const [start, end] = rangeHeader.replace(/bytes=/, '').split('-').map(Number);
  const s = isNaN(start) ? 0 : start;
  const e = isNaN(end) ? bufferLength - 1 : end;

  if (s > e || s >= bufferLength) return null;
  return { start: s, end: e };
}