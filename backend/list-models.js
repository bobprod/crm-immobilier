const m = require('./node_modules/.prisma/client/index.js');
const P = m.PrismaClient;
const p = new P();
const keys = Object.getOwnPropertyNames(p).filter((k) => !k.startsWith('_'));
console.log(keys.slice(0, 30).join('\n'));
p.$disconnect();
