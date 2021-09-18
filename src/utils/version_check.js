// Ensures we're running on a supported NodeJS ver
const versionCheck = () => {
    const major = parseInt(process.version.match(/v([0-9]+)/)[1]);
    if (major < 14) {
        console.error(`NodeJS version ${process.version} is too old. Download a version of NodeJS >= v14.0.0 from https://nodejs.org/en/download/current/`)
        if (process.argv.includes('-ignore-version-check')) console.warn('Ignoring version check, run at your own risk!');
        else {
            console.warn("Run with -ignore-version-check to ignore this check, but don't say I didn't warn you!");
            process.exit(1);
        }
    }
}

module.exports = versionCheck;