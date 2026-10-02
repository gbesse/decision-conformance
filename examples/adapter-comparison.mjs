import assert from 'node:assert/strict';
import { evaluate } from '@gbesse/decisionpacks';
import { runConformance } from '../src/index.mjs';

const reference = await runConformance({
  invoke: (pack, state, options) => evaluate(pack, state, options),
  host: 'reference-library', version: '0.1.0', adapterVersion: 'example-1',
});
const broken = await runConformance({
  invoke: async () => ({ outcome: 'review' }),
  host: 'synthetic-broken-adapter', version: '1', adapterVersion: 'example-1',
});
assert.equal(reference.passed, true);
assert.equal(broken.passed, false);
console.log(JSON.stringify({
  reference: { passed: reference.passed, scenarios: reference.scenarios.length },
  broken: { passed: broken.passed, failedScenarios: broken.scenarios.filter((scenario) => !scenario.passed).map(({ id, error }) => ({ id, error })) },
  scope: 'Synthetic library-level comparison; not vendor certification',
}, null, 2));
