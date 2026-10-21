// Place evenly spaced axes clockwise, starting directly above the centre.
export function polarToCartesian(cx, cy, radius, angleIndex, totalAxes) {
  const angle = angleIndex * 2 * Math.PI / totalAxes - Math.PI / 2;
  return { x: Math.round((cx + radius * Math.cos(angle)) * 100) / 100,
    y: Math.round((cy + radius * Math.sin(angle)) * 100) / 100 };
}

// Convert clamped percentages to the SVG polygon's space-separated points.
export function buildRadarPolygonPoints(values, cx, cy, maxRadius) {
  return values.map((value, index) => {
    const radius = Math.max(0, Math.min(100, value)) / 100 * maxRadius;
    const { x, y } = polarToCartesian(cx, cy, radius, index, values.length);
    return `${x},${y}`;
  }).join(' ');
}

// A grid ring is a radar polygon with the same percentage on every axis.
export function buildGridPolygonPoints(levelPercent, totalAxes, cx, cy, maxRadius) {
  return buildRadarPolygonPoints(Array(totalAxes).fill(levelPercent), cx, cy, maxRadius);
}

// Split a circle into the completed arc and the remaining gap.
export function arcDashArray(percent, radius) {
  const circumference = 2 * Math.PI * radius;
  const dash = circumference * Math.max(0, Math.min(100, percent)) / 100;
  return { circumference, dash, gap: circumference - dash };
}

// Filter without mutating the original priority order or array.
export function filterRecommendations(recommendations, { priority = 'All', domainId = 'all' } = {}) {
  return recommendations.filter((item) => (priority === 'All' || item.priority === priority)
    && (domainId === 'all' || item.domainId === domainId));
}

// Sort a copy by percent, using domain order to resolve equal scores.
export function getWeakestDomains(domains, count) {
  return [...domains].sort((a, b) => a.percent - b.percent || a.order - b.order)
    .slice(0, Math.max(0, count));
}
