#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const telaNome = process.argv[2];

if (!telaNome) {
  console.error('❌ Erro: Informe o nome da tela');
  console.error('Uso: npm run sync:lovable [nome-da-tela]');
  console.error('Ex:  npm run sync:lovable dashboard-novo');
  process.exit(1);
}

if (!fs.existsSync('docs')) {
  fs.mkdirSync('docs', { recursive: true });
}

const docsPath = 'docs/LOVABLE_UPDATES.md';
const timestamp = new Date().toISOString().split('T')[0];
const hora = new Date().toLocaleTimeString('pt-BR');

const content = `# 🔄 Update: ${telaNome}
**Data:** ${timestamp} ${hora}

## Informações
- **Nome da tela:** ${telaNome}
- **Status:** 🔄 Em sincronização

## Componentes Extraídos
- [ ] Button
- [ ] Input
- [ ] Card

## Cores Utilizadas
- Primária: #________
- Fundo: #________
- Texto: #________

## Próximo passo
\`\`\`bash
npm run sync:convert ${telaNome}
\`\`\`
`;

fs.writeFileSync(docsPath, content);
console.log('✅ Documentação criada!');
console.log(`📝 Arquivo: ${docsPath}`);
