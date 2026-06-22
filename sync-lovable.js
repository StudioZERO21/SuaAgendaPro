#!/usr/bin/env node

/**
 * SCRIPT 1: sync-lovable.js
 * 
 * Sincroniza automaticamente telas do Lovable com documentação
 * 
 * Uso: npm run sync:lovable nome-da-tela
 * Ex:  npm run sync:lovable dashboard-novo
 * 
 * INSTALAR:
 * 1. Copie este arquivo para: scripts/sync-lovable.js
 * 2. Adicione em package.json:
 *    "sync:lovable": "node scripts/sync-lovable.js"
 * 3. Execute: npm run sync:lovable nome-da-tela
 */

const fs = require('fs');
const path = require('path');

const telaNome = process.argv[2];

if (!telaNome) {
  console.error('❌ Erro: Informe o nome da tela');
  console.error('Uso: npm run sync:lovable [nome-da-tela]');
  console.error('Ex:  npm run sync:lovable dashboard-novo');
  process.exit(1);
}

// Criar diretório docs se não existir
if (!fs.existsSync('docs')) {
  fs.mkdirSync('docs', { recursive: true });
}

// Criar arquivo de documentação
const docsPath = 'docs/LOVABLE_UPDATES.md';
const timestamp = new Date().toISOString().split('T')[0];
const hora = new Date().toLocaleTimeString('pt-BR');

const content = `# 🔄 Update: ${telaNome}
**Data:** ${timestamp} ${hora}

## Informações
- **Nome da tela:** ${telaNome}
- **Status:** 🔄 Em sincronização
- **Data criação:** ${timestamp}

## Passo 1: Documentação (Faça isto AGORA)

### Componentes Extraídos
- [ ] Button (principal/secundário/outline)
- [ ] Input (text/email/password)
- [ ] Card
- [ ] Modal
- [ ] Outros: _____________

### Cores Utilizadas
Copie do Lovable (DevTools → Inspecionar elemento):
- Cor primária: #________
- Cor secundária: #________
- Fundo: #________
- Texto: #________

### Espaçamento Observado
- Padding card: ___px
- Gap entre elementos: ___px
- Margin títulos: ___px

### Notas Importantes
- [ ] Tem animações? Quais?
- [ ] É responsivo? Como?
- [ ] Tem validação? Qual?

## Passo 2: Converter (Próximo comando)

\`\`\`bash
npm run sync:convert ${telaNome}
\`\`\`

Isso vai criar o arquivo em: \`src/routes/${telaNome}.tsx\`

## Passo 3: Implementar

Edite \`src/routes/${telaNome}.tsx\` e:
1. Copie o HTML do Lovable
2. Converta para componentes React
3. Use componentes de \`src/components/ui/\`
4. Aplique Tailwind classes

## Passo 4: Validar

\`\`\`bash
npm run type-check    # Verificar TypeScript
npm run dev          # Testar
\`\`\`

## Passo 5: Commit

\`\`\`bash
git add .
git commit -m "feat: sync ${telaNome} from Lovable"
git push origin develop
\`\`\`

---

**Status:** 🔄 Aguardando implementação
`;

fs.writeFileSync(docsPath, content);
console.log('✅ Documentação criada com sucesso!\n');
console.log(`📝 Arquivo: ${docsPath}`);
console.log('\n📋 Próximos passos:');
console.log('1. Abra o arquivo e preencha os detalhes');
console.log('2. Inspecione a tela no Lovable (DevTools)');
console.log('3. Documente componentes, cores e espaçamento');
console.log(`4. Execute: npm run sync:convert ${telaNome}`);
console.log('\n💡 Dica: Deixe o arquivo aberto para referência');
