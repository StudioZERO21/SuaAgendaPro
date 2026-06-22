#!/usr/bin/env node

import fs from 'fs';
import { execSync } from 'child_process';

console.log('🔍 Validando sincronização...\n');

console.log('📁 Verificando estrutura...');
const dirs = ['src', 'src/routes', 'src/components', 'docs'];
dirs.forEach(dir => {
  console.log(fs.existsSync(dir) ? `  ✅ ${dir}` : `  ❌ ${dir}`);
});

console.log('\n📄 Verificando arquivos...');
const files = ['package.json', 'tsconfig.json', 'src/styles.css'];
files.forEach(file => {
  console.log(fs.existsSync(file) ? `  ✅ ${file}` : `  ❌ ${file}`);
});

console.log('\n✅ Validação completa!\n');
console.log('💡 Próximos passos:');
console.log('  1. npm run dev');
console.log('  2. npm run sync:lovable nome-tela');
console.log('  3. npm run sync:convert nome-tela\n');
