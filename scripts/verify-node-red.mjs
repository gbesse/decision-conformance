// Purpose: Publish the exact native host conformance evidence and fail CI when any scenario fails.
import {writeFile} from 'node:fs/promises';import {verifyNodeRed} from '../adapters/node-red.mjs';
const report=await verifyNodeRed();await writeFile(new URL('../reports/node-red.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));if(!report.passed)process.exitCode=1;
