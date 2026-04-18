const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = process.cwd();
const androidDir = path.join(root, 'android');

function runGradleStop() {
  const isWin = process.platform === 'win32';
  const gradleCmd = isWin ? 'gradlew.bat' : './gradlew';

  const result = spawnSync(gradleCmd, ['--stop'], {
    cwd: androidDir,
    stdio: 'inherit',
    shell: isWin,
  });

  // Do not fail preflight if daemon stop fails; cache cleanup still helps.
  if (result.error) {
    console.warn('[preflight] Gradle stop warning:', result.error.message);
  }
}

function removeIfExists(targetPath) {
  if (fs.existsSync(targetPath)) {
    try {
      fs.rmSync(targetPath, {
        recursive: true,
        force: true,
        maxRetries: 5,
        retryDelay: 250,
      });
      console.log('[preflight] Removed', targetPath);
    } catch (error) {
      // Windows may keep Gradle checksum locks briefly; don't block cloud builds on local lock files.
      if (error && ['EBUSY', 'EPERM', 'ENOTEMPTY'].includes(error.code)) {
        console.warn(`[preflight] Skipped locked path: ${targetPath} (${error.code})`);
        return;
      }
      throw error;
    }
  }
}

function main() {
  console.log('[preflight] Starting EAS preflight cleanup...');

  if (fs.existsSync(androidDir)) {
    runGradleStop();
  }

  const cleanupTargets = [
    path.join(root, 'android', '.gradle'),
    path.join(root, 'android', 'build'),
    path.join(root, 'android', 'app', 'build'),
  ];

  cleanupTargets.forEach(removeIfExists);

  console.log('[preflight] Done.');
}

main();
