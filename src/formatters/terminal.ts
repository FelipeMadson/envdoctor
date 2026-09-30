import type { DiagnosticReport } from "../types.ts";

// Cores ANSI compatíveis com Windows PowerShell e terminais modernos
const ANSI = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m"
};

export function formatTerminalReport(report: DiagnosticReport): string {
  const lines: string[] = [];

  lines.push(`\n${ANSI.bold}${ANSI.cyan}======================================================${ANSI.reset}`);
  lines.push(`${ANSI.bold}🩺 EnvDoctor — Diagnóstico de Ambiente: ${report.projectName}${ANSI.reset}`);
  lines.push(`${ANSI.gray}Executado em: ${new Date(report.timestamp).toLocaleTimeString()} (${report.durationMs}ms)${ANSI.reset}`);
  lines.push(`${ANSI.bold}${ANSI.cyan}======================================================${ANSI.reset}\n`);

  const categoryTitles: Record<string, string> = {
    runtime: "⚙️  Runtimes & Comandos do Sistema",
    port: "🔌 Portas de Rede (TCP Sockets)",
    env: "🔐 Variáveis de Ambiente (.env)",
    service: "🌐 Serviços & Dependências Locais"
  };

  const categories = ["runtime", "port", "env", "service"] as const;

  for (const cat of categories) {
    const items = report.results.filter((r) => r.category === cat);
    if (items.length === 0) continue;

    lines.push(`${ANSI.bold}${categoryTitles[cat]}${ANSI.reset}`);

    for (const item of items) {
      let icon = `${ANSI.green}✔ PASS${ANSI.reset}`;
      if (item.status === "FAIL") icon = `${ANSI.red}✖ FAIL${ANSI.reset}`;
      if (item.status === "WARN") icon = `${ANSI.yellow}⚠ WARN${ANSI.reset}`;

      lines.push(`  [${icon}] ${item.message}`);
      if (item.details) {
        lines.push(`         ${ANSI.gray}${item.details}${ANSI.reset}`);
      }
    }
    lines.push("");
  }

  // Seção de Correções Recomendadas
  const failedItems = report.results.filter((r) => r.status === "FAIL" && r.fixCommand);
  if (failedItems.length > 0) {
    lines.push(`${ANSI.bold}${ANSI.yellow}🛠️  Ações Recomendadas para Resolução:${ANSI.reset}`);
    for (let i = 0; i < failedItems.length; i++) {
      const item = failedItems[i];
      lines.push(`  ${i + 1}. [${item.identifier}] ${item.fixCommand}`);
    }
    lines.push("");
  }

  // Resumo Final
  const statusColor = report.passed ? ANSI.green : ANSI.red;
  const statusWord = report.passed ? "APROVADO (Ambiente Pronto)" : "BLOQUEADO (Ajustes Necessários)";

  lines.push(`${ANSI.bold}Status Final: ${statusColor}${statusWord}${ANSI.reset}`);
  lines.push(`Verificações: ${report.totalChecks} | Aprovados: ${report.passCount} | Falhas: ${report.failCount} | Avisos: ${report.warnCount}\n`);

  return lines.join("\n");
}
