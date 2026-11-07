import assert from 'node:assert/strict';
import test from 'node:test';
import * as d3 from 'd3';

test('root-cause force graph resolves linked nodes and produces finite positions', () => {
  const nodes = [
    { id: 'topic-network', type: 'topic' },
    { id: 'cause-packet-loss', type: 'rootCause' },
  ];
  const links = [{ source: 'topic-network', target: 'cause-packet-loss', value: 2 }];

  const simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id(node => node.id).distance(110))
    .force('charge', d3.forceManyBody().strength(-200))
    .force('center', d3.forceCenter(200, 100))
    .stop();

  simulation.tick(25);

  assert.strictEqual(links[0].source, nodes[0]);
  assert.strictEqual(links[0].target, nodes[1]);

  for (const node of nodes) {
    assert.ok(Number.isFinite(node.x), 'node x must be finite');
    assert.ok(Number.isFinite(node.y), 'node y must be finite');
  }
});

test('incident timeline scales and generated paths remain usable', () => {
  const start = new Date('2026-11-01T00:00:00Z');
  const end = new Date('2026-11-03T00:00:00Z');
  const x = d3.scaleTime().domain([start, end]).range([0, 200]);
  const y = d3.scaleLinear().domain([0, 5]).range([100, 0]);

  const data = [
    { date: start, count: 1 },
    { date: new Date('2026-11-02T00:00:00Z'), count: 5 },
    { date: end, count: 2 },
  ];
  const path = d3.line().x(point => x(point.date)).y(point => y(point.count)).curve(d3.curveMonotoneX)(data);

  assert.equal(x(start), 0);
  assert.equal(x(end), 200);
  assert.equal(y(5), 0);
  assert.ok(typeof path === 'string' && path.startsWith('M') && path.includes('C'), 'D3 must generate a curve');
});
