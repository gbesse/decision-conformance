# Decision Conformance

A reusable behavioral contract suite for Jev DecisionPack integrations. Reports state the exact host, addon version and scenarios exercised. Open-source alpha; no vendor certification or model-quality claim.

## Run the native host suite

Node 24: `npm ci --ignore-scripts`, `npm test`, `npm run verify:node-red`. The last command writes `reports/node-red.json` and exits nonzero on any mismatch. The shipped report covers **Node-RED 5.0.7**, **node-red-contrib-jev-decisions 0.2.0**, and eleven scenarios through the actual host node input/output/error events.

Scenarios check probability versus confidence, inclusive thresholds, review routing, invalid states before inference, missing answers, invalid probability mass, wrong models, provider errors, hanging providers and policy-version provenance. Synthetic providers make every scenario deterministic; this does not test live Jev availability, model quality or billing.

## Add a host adapter

```js
import { runConformance } from '@gbesse/decision-conformance';
const report = await runConformance({
  host: 'your-host', version: 'exact-version', adapterVersion: 'exact-version',
  level: 'host-runtime',
  invoke: async (pack, state, { provider, timeoutMs }) => {
    // Load your real host node, inject the trusted provider fixture,
    // deliver state through the host, and resolve its recorded decision.
    // Reject when the host signals an error. Do not call evaluate directly
    // while claiming host-runtime coverage.
  },
});
if (!report.passed) process.exitCode = 1;
```

Use `level: 'library'` for library-only checks. `adapters/node-red.mjs` is a working example. The harness enforces an outer deadline and checks policy/input fingerprints. Reports are inspectable evidence, not signed attestations: an adapter can lie and must itself be reviewed. Other hosts have not been verified by this release.

The suite reuses DecisionPacks rather than defining a competing policy format. Decision Blocks traces can then be reviewed in [Decision Workbench](https://github.com/gbesse/decision-workbench).

## Compare two adapters offline

Run `npm run demo:adapters` to compare the reference DecisionPacks adapter with a deliberately broken adapter. The output names failing scenarios, including provider errors and policy provenance. This is a synthetic library-level example, not a live Jev test or vendor certification.
