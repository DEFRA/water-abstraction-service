const { promisify } = require('util');
const { exec } = require('child_process');

const execAsync = promisify(exec);

(async () => {
  console.log('Running AB1 test...');
  const { stdout: ab1Output } = await execAsync('npm run test:integration integration-tests/billing/tests/annual/AB1.js');
  console.log('Completed AB1 test...');
  console.log(ab1Output);

  console.log('Running AB2 test...');
  const { stdout: ab2Output } = await execAsync('npm run test:integration integration-tests/billing/tests/annual/AB2.js');
  console.log('Completed AB2 test...');
  console.log(ab2Output);

  console.log('Running SB1 test...');
  const { stdout: sb1Output } = await execAsync('npm run test:integration integration-tests/billing/tests/supplementary/SB1.js');
  console.log('Completed SB1 test...');
  console.log(sb1Output);

  console.log('Running SB2 test...');
  const { stdout: sb2Output } = await execAsync('npm run test:integration integration-tests/billing/tests/supplementary/SB2.js');
  console.log('Completed SB2 test...');
  console.log(sb2Output);

  console.log('Running 2PT1 test...');
  const { stdout: TPT1Output } = await execAsync('npm run test:integration integration-tests/billing/tests/two-part-tarrif/2PT1.js');
  console.log('Completed 2PT1 test...');
  console.log(TPT1Output);

  console.log('Running 2PT2 test...');
  const { stdout: TPT2Output } = await execAsync('npm run test:integration integration-tests/billing/tests/two-part-tarrif/2PT2.js');
  console.log('Completed 2PT2 test...');
  console.log(TPT2Output);
})();
