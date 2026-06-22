#!/usr/bin/env node

/**
 * Setup automático para adicionar script convert:lovable
 * 
 * Uso:
 * node scripts-setup.mjs
 */

import fs from 'fs';

console.log('\n🔧 Setup - Adicionar Script ao package.json\n');
console.log('='.repeat(50));

// Ler package.json
const packageJsonPath = 'package.json';
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

// Verificar se já existe
if (packageJson.scripts['convert:lovable']) {
  console.log('\n✅ Script "convert:lovable" já existe!');
  console.log('Você pode usar: npm run convert:lovable\n');
  process.exit(0);
}

// Adicionar script
packageJson.scripts['convert:lovable'] = 'node scripts/convert-lovable.mjs';

// Salvar
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

console.log('\n✅ Script adicionado com sucesso!\n');
console.log('📋 Script adicionado:');
console.log('  "convert:lovable": "node scripts/convert-lovable.mjs"\n');

console.log('🚀 Você pode usar:\n');
console.log('  npm run convert:lovable\n');

console.log('='.repeat(50) + '\n');
