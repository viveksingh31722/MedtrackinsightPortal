const { execSync } = require('child_process');

function runCmd(cmd) {
  console.log(`Running: ${cmd}`);
  try {
    execSync(cmd, { stdio: 'inherit' });
  } catch (err) {
    console.error(`Failed executing: ${cmd}`);
    process.exit(1);
  }
}

// 1. Prisma Migrate Deploy
runCmd('npx prisma migrate deploy');

// 2. Database seeding
runCmd('npx prisma db seed');

// 3. Elasticsearch reindexing
runCmd('npx ts-node prisma/reindex.ts');

// 4. Start Server
console.log('Starting backend Express server...');
require('./dist/server.js');
