import { buildRadarPolygonPoints, buildGridPolygonPoints, polarToCartesian } from './chartMath.js';
import { maturityLevels } from '../config/maturityLevels.js';

// Use this for every value inserted into text or an HTML/SVG attribute.
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}
const e = escapeHtml;
function dateLabel(value) {
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Date unavailable';
}

function radar(domains) {
  // A generous viewBox leaves room for full domain labels, wrapped into lines.
  const cx = 360; const cy = 220; const radius = 125;
  const grid = [25, 50, 75, 100].map((percent) =>
    `<polygon points="${e(buildGridPolygonPoints(percent, domains.length, cx, cy, radius))}" fill="none" stroke="#cbd5e1"/>`).join('');
  const axes = domains.map((domain, index) => {
    const end = polarToCartesian(cx, cy, radius, index, domains.length);
    const label = polarToCartesian(cx, cy, radius + 22, index, domains.length);
    const anchor = label.x < cx - 10 ? 'end' : label.x > cx + 10 ? 'start' : 'middle';
    const words = domain.name.split(' '); const lines = [''];
    for (const word of words) {
      if ((lines.at(-1) + word).length > 22 && lines.at(-1)) lines.push('');
      lines[lines.length - 1] += `${word} `;
    }
    return `<line x1="${cx}" y1="${cy}" x2="${e(end.x)}" y2="${e(end.y)}" stroke="#cbd5e1"/>
      <text x="${e(label.x)}" y="${e(label.y - (lines.length - 1) * 9)}" text-anchor="${anchor}">${lines.map((line, i) => `<tspan x="${e(label.x)}" dy="${i ? 18 : 0}">${e(line.trim())}</tspan>`).join('')}</text>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="420" viewBox="0 0 720 440" role="img" aria-label="Domain scores radar chart; values follow in the table">
    ${grid}${axes}<polygon points="${e(buildRadarPolygonPoints(domains.map((domain) => domain.percent), cx, cy, radius))}" fill="#dbeafe" fill-opacity="0.6" stroke="#1d4ed8" stroke-width="2"/>
  </svg>`;
}

// Pure document builder: scores and scan totals are supplied, never recalculated.
export function buildReportHtml({ assessment, result, scan, generatedAt }) {
  const { overall, domains, stats, recommendations } = result;
  const strongest = [...domains].sort((a, b) => b.percent - a.percent || a.order - b.order)[0];
  const weakest = [...domains].sort((a, b) => a.percent - b.percent || a.order - b.order)[0];
  const answers = { no: 'Not in place', partial: 'Partially in place', unsure: 'Not sure' };
  const badgeColor = { danger: '#991b1b', warning: '#854d0e', success: '#166534' }[overall.level.tone] || '#334155';
  const groups = ['High', 'Medium', 'Low'].map((priority) => {
    // Filtering preserves the engine's relative order within each priority group.
    const items = recommendations.filter((item) => item.priority === priority);
    return items.length ? `<h3>${priority}</h3>${items.map((item) => `<article class="card">
      <h4>${e(item.domainName)}</h4><p>${e(item.questionText)}</p>
      <p><strong>Recommendation:</strong> ${e(item.recommendation)}</p>
      <p><strong>Current answer:</strong> ${e(answers[item.answer])}</p></article>`).join('')}` : '';
  }).join('');
  const scanSection = scan == null ? '' : `<section><h2>Early-sign scan</h2>
    <p><strong>Folder:</strong> ${e(scan.rootPath)}</p>
    <p><strong>Scan date:</strong> ${e(dateLabel(scan.finishedAt))} · <strong>Status:</strong> ${e(scan.status)}</p>
    <p>Files scanned: ${e(scan.filesScanned)} · High: ${e(scan.counts.high)} · Medium: ${e(scan.counts.medium)} · Low: ${e(scan.counts.low)}</p>
    <p class="note">This scan checks file names only. It is a point-in-time check, is not part of the score above, and a clean result does not prove the computer is safe.</p>
    <p>Up to 25 retained findings are listed below. Counts above may include additional findings. Cancelled or limit-reached scans are partial; unreadable or skipped items are not checked.</p>
    <table><thead><tr><th>Severity</th><th>Relative path</th><th>Rule title</th></tr></thead><tbody>
      ${scan.findings.slice(0, 25).map((finding) => `<tr><td>${e(finding.severity)}</td><td>${e(finding.relativePath)}</td><td>${e(finding.title)}${finding.reason ? `<br>${e(finding.reason)}` : ''}</td></tr>`).join('')}
    </tbody></table></section>`;
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:">
<title>RansomReady Report</title>
<style>
@page { size: A4; margin: 16mm; }
* { box-sizing: border-box; }
body { margin: 0; color: #172033; background: white; font: 11pt/1.5 Arial, sans-serif; overflow-wrap: anywhere; }
h1 { font-size: 24pt; line-height: 1.2; } h2 { font-size: 17pt; margin-top: 24px; } h3 { font-size: 13pt; } h4, p { margin: 8px 0; }
h1, h2, h3, h4 { break-after: avoid; } section { margin-bottom: 24px; }
.cover { border-bottom: 3px solid #1d4ed8; padding-bottom: 20px; }
.card, .row, tr, .cover, .note { page-break-inside: avoid; break-inside: avoid; }
.card { border: 1px solid #cbd5e1; border-radius: 5px; padding: 12px; margin: 10px 0; }
.badge { color: white; background: ${badgeColor}; padding: 5px 10px; display: inline-block; border-radius: 4px; }
.note { border-left: 3px solid #64748b; padding: 10px; background: #f1f5f9; }
table { width: 100%; border-collapse: collapse; margin: 14px 0; table-layout: fixed; font-size: 10pt; }
th, td { border: 1px solid #cbd5e1; padding: 7px; text-align: left; vertical-align: top; } th { background: #f1f5f9; } thead { display: table-header-group; }
svg { display: block; width: 420px; max-width: 100%; height: auto; margin: auto; break-inside: avoid; } svg text { font: 16px Arial, sans-serif; fill: #172033; }
footer { border-top: 1px solid #cbd5e1; padding-top: 10px; font-size: 9pt; color: #475569; }
</style></head><body>
<header class="cover"><h1>RansomReady: Ransomware Readiness Assessment Report</h1>
<h2>${e(assessment.organisationName)}</h2>${assessment.assessorName ? `<p>Assessor: ${e(assessment.assessorName)}</p>` : ''}
<p>Assessment date: ${e(dateLabel(assessment.completedAt))}</p><p>Report generation date: ${e(dateLabel(generatedAt))}</p></header>
<section><h2>Executive summary</h2><p><strong>Overall readiness: ${e(overall.percent)}%</strong></p>
<p class="badge">Level ${e(overall.level.level)}: ${e(overall.level.name)}</p><p>${e(overall.level.description)}</p>
${overall.capped ? `<p class="note">${e(overall.cappedReason)}</p>` : ''}
<p>Yes: ${e(stats.yes)} · Partial: ${e(stats.partial)} · No: ${e(stats.no)} · Not sure: ${e(stats.unsure)}</p>
<p>Critical gaps: ${e(stats.criticalGaps)}</p>
<p>The strongest domain is ${e(strongest.name)} at ${e(strongest.percent)}%.</p>
<p>The weakest domain is ${e(weakest.name)} at ${e(weakest.percent)}%.</p></section>
<section><h2>Domain results</h2>${radar(domains)}
<table><thead><tr><th>Domain</th><th>Score %</th><th>Level</th><th>Gaps</th><th>Critical gaps</th></tr></thead><tbody>
${domains.map((domain) => `<tr><td>${e(domain.name)}</td><td>${e(domain.percent)}</td><td>Level ${e(domain.level.level)}: ${e(domain.level.name)}</td><td>${e(domain.gapCount)}</td><td>${e(domain.criticalGapCount)}</td></tr>`).join('')}
</tbody></table></section>
<section><h2>Prioritised recommendations</h2>${recommendations.length ? groups : '<p>No gaps found. Keep testing and improving.</p>'}</section>
${scanSection}
<section><h2>Methodology and limits</h2>
<p>Question weights: 3 = critical, 2 = important, 1 = good practice. Answer values: Yes = 1, Partial = 0.5, No = 0, Not sure = 0. Question points = weight × answer value. Overall percent = total points / total possible points × 100. Domain percentages use the same formula within each domain. Percentages are rounded once to one decimal place before level lookup.</p>
<ul>${maturityLevels.map((level) => `<li>Level ${e(level.level)}: ${e(level.name)} — ${e(level.min)}–${e(level.max)}%</li>`).join('')}</ul>
<p>A critical gap is a weight-3 answer of No or Not sure. With three or more critical gaps, the overall level is capped at Level 2 (Developing); the percentage is unchanged. Domain levels are not capped. Recommendations use weight × (1 − answer value), descending, then weight, domain order and question ID to break ties. This report groups them by High / Medium / Low while preserving their order within each group.</p>
<p>The questions are based on widely recommended good-practice guidance. Weights and thresholds are design choices for this project. This is a self-assessment and not a formal audit, certification or compliance statement. RansomReady is not an antivirus.</p></section>
<footer>Generated by RansomReady</footer></body></html>`;
}
