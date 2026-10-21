import assert from 'node:assert/strict';
import { polarToCartesian, buildRadarPolygonPoints, buildGridPolygonPoints,
  arcDashArray, filterRecommendations, getWeakestDomains } from '../src/utils/chartMath.js';

let failures = 0;
function test(name, check) {
  try { check(); console.log(`PASS ${name}`); }
  catch (error) { failures += 1; console.error(`FAIL ${name}: ${error.message}`); }
}
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 0.000001);

test('axis zero is straight above the centre', () => {
  assert.deepEqual(polarToCartesian(50, 50, 20, 0, 8), { x: 50, y: 30 });
});
test('four axes run clockwise: right, below, then left', () => {
  assert.deepEqual(polarToCartesian(50, 50, 20, 1, 4), { x: 70, y: 50 });
  assert.deepEqual(polarToCartesian(50, 50, 20, 2, 4), { x: 50, y: 70 });
  assert.deepEqual(polarToCartesian(50, 50, 20, 3, 4), { x: 30, y: 50 });
});
test('coordinates round to two decimals', () => {
  assert.deepEqual(polarToCartesian(0, 0, 10, 1, 8), { x: 7.07, y: -7.07 });
});
test('zero is the centre; 100 is the outer ring', () => {
  assert.equal(buildRadarPolygonPoints([0, 100, 0, 100], 50, 50, 20), '50,50 70,50 50,50 30,50');
});
test('radar values clamp to 0 through 100 without mutation', () => {
  const values = [-20, 120, 0, 100];
  assert.equal(buildRadarPolygonPoints(values, 50, 50, 20), '50,50 70,50 50,50 30,50');
  assert.deepEqual(values, [-20, 120, 0, 100]);
});
test('grid rings use the requested percentage', () => {
  assert.equal(buildGridPolygonPoints(50, 4, 50, 50, 20), '50,40 60,50 50,60 40,50');
});
for (const percent of [0, 50, 100]) {
  test(`gauge arc at ${percent} percent`, () => {
    const { circumference, dash, gap } = arcDashArray(percent, 10);
    close(circumference, 20 * Math.PI);
    close(dash, 20 * Math.PI * percent / 100);
    close(gap, 20 * Math.PI * (1 - percent / 100));
    close(dash + gap, circumference);
  });
}
test('gauge clamps out-of-range values', () => {
  assert.deepEqual(arcDashArray(-10, 10), arcDashArray(0, 10));
  assert.deepEqual(arcDashArray(110, 10), arcDashArray(100, 10));
});
const recommendations = [
  { questionId: 'a', priority: 'Medium', domainId: 'backup' },
  { questionId: 'b', priority: 'High', domainId: 'access' },
  { questionId: 'c', priority: 'High', domainId: 'backup' },
  { questionId: 'd', priority: 'Low', domainId: 'backup' },
];
const original = structuredClone(recommendations);
test('filter by priority only, preserving order', () => {
  assert.deepEqual(filterRecommendations(recommendations, { priority: 'High', domainId: 'all' }), [recommendations[1], recommendations[2]]);
});
test('filter by domain only, preserving order', () => {
  assert.deepEqual(filterRecommendations(recommendations, { priority: 'All', domainId: 'backup' }), [recommendations[0], recommendations[2], recommendations[3]]);
});
test('filter by both priority and domain', () => {
  assert.deepEqual(filterRecommendations(recommendations, { priority: 'High', domainId: 'backup' }), [recommendations[2]]);
});
test('All/all returns every item in a new array without reordering', () => {
  const result = filterRecommendations(recommendations, { priority: 'All', domainId: 'all' });
  assert.deepEqual(result, recommendations);
  assert.notEqual(result, recommendations);
  assert.deepEqual(recommendations, original);
});
test('unmatched filters and empty input return empty arrays', () => {
  assert.deepEqual(filterRecommendations(recommendations, { priority: 'Low', domainId: 'access' }), []);
  assert.deepEqual(filterRecommendations([], { priority: 'All', domainId: 'all' }), []);
});
test('weakest domains sort by percent then domain order, without mutation', () => {
  const domains = [{ id: 'a', percent: 50, order: 1 }, { id: 'b', percent: 25, order: 3 },
    { id: 'c', percent: 25, order: 2 }, { id: 'd', percent: 0, order: 4 }];
  const copy = structuredClone(domains);
  assert.deepEqual(getWeakestDomains(domains, 3).map((domain) => domain.id), ['d', 'c', 'b']);
  assert.deepEqual(domains, copy);
  assert.deepEqual(getWeakestDomains(domains, 0), []);
  assert.equal(getWeakestDomains(domains, 10).length, 4);
  assert.deepEqual(getWeakestDomains([], 3), []);
});
process.exitCode = failures ? 1 : 0;
