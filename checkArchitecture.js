const os = require('os');

console.log('Architecture:', os.arch()); // e.g., 'x64', 'arm', 'arm64'
console.log('Platform:', os.platform()); // e.g., 'linux', 'darwin', 'win32'
console.log('CPU Cores:', os.cpus().length);
console.log('Total Memory:', os.totalmem() / 1024 / 1024, 'MB');
console.log('Free Memory:', os.freemem() / 1024 / 1024, 'MB');