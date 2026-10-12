# @felipemadson/envdoctor

Validador Determinístico de Ambientes de Desenvolvimento Local e Sonda de Saúde CLI.

## Visão Geral
O `@felipemadson/envdoctor` é uma ferramenta de linha de comando para diagnóstico determinístico e inspeção pré-voo de estações de trabalho e ambientes de integração contínua (CI). O utilitário elimina discrepâncias operacionais validando versões de runtimes, disponibilidade de portas TCP e conformidade de variáveis de ambiente antes da inicialização dos serviços.

## Funcionalidades e Diagnósticos
- **Verificação de Runtimes**: Inspeciona ferramentas instaladas (Node.js, Docker, Python) contra requisitos mínimos de versão, fornecendo comandos de correção (`fixCommand`).
- **Inspetor de Conflitos de Portas TCP**: Identifica portas ocupadas antecipadamente e sugere encerramento gracioso dos processos conflitantes.
- **Validação de Variáveis com Zero Vazamento**: Aplica esquemas rigorosos com Zod para variáveis em arquivos `.env`, garantindo mascaramento estrito de chaves secretas em relatórios.
- **Renderizador CLI de Alta Fidelidade**: Canvas com double-buffering ANSI, parser de sequências VT100/xterm e cálculo de largura para emojis.
- **Resiliência e Testes de Fuzzing**: Validado com suíte de 1.000 iterações de fuzzing de invariantes e estabilidade sob concorrência.

## Instruções Verificadas de Execução
```bash
# Executa a suíte de testes unitários e de integração (16 testes)
npm test

# Executa checagem rigorosa de tipos TypeScript
npm run typecheck

# Inicializa um novo manifesto de ambiente
node --experimental-strip-types src/cli.ts init

# Executa a bateria de diagnóstico contra env.manifest.json
node --experimental-strip-types src/cli.ts check
```

## Arquitetura e Governança
- `src/core/engine.ts`: Motor de diagnóstico concorrente que executa verificações completas em menos de 2 segundos.
- `src/inspectors/`: Módulos especializados em inspeção de runtimes, portas TCP, variáveis de ambiente e serviços.
- `src/renderers/cli-renderer.ts`: Renderizador de terminal com interpolação de cursor e cálculo de deltas de tela.
- `src/types.ts`: Esquemas tipados com Zod para contratos de runtimes, portas e variáveis.

## Limitações Técnicas
- Requer Node.js >= 22 com suporte a `--experimental-strip-types` para execução direta sem etapa de build.
- A inspeção de portas restringe-se ao namespace de rede do sistema operacional hospedeiro.
