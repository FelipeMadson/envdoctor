import path from "node:path";
import { DiagnosticEngine } from "./core/engine.ts";
import { generateManifest } from "./core/generator.ts";
import { formatTerminalReport } from "./formatters/terminal.ts";

export async function runCli(args: string[] = process.argv.slice(2)): Promise<void> {
  const command = args[0] || "check";
  const isJson = args.includes("--json");
  const manifestArgIdx = args.indexOf("--manifest");
  const customManifestPath = manifestArgIdx !== -1 && args[manifestArgIdx + 1] ? args[manifestArgIdx + 1] : undefined;

  const projectDir = process.cwd();
  const manifestPath = customManifestPath
    ? path.resolve(projectDir, customManifestPath)
    : path.join(projectDir, "env.manifest.json");

  switch (command) {
    case "init": {
      console.log(`\n🔍 Analisando repositório em ${projectDir}...`);
      const { manifestPath: createdPath, manifest } = generateManifest(projectDir);
      console.log(`✔ Manifesto criado com sucesso: ${createdPath}`);
      console.log(`  - Nome do Projeto: ${manifest.name}`);
      console.log(`  - Runtimes verificados: ${manifest.runtimes.length}`);
      console.log(`  - Portas declaradas: ${manifest.ports.length}`);
      console.log(`  - Variáveis detectadas: ${manifest.envVars.length}`);
      console.log(`\nExecute agora "envdoctor check" para validar seu ambiente.\n`);
      process.exit(0);
      break;
    }

    case "check": {
      const engine = new DiagnosticEngine();
      try {
        const report = await engine.runChecks(manifestPath, projectDir);

        if (isJson) {
          console.log(JSON.stringify(report, null, 2));
        } else {
          console.log(formatTerminalReport(report));
        }

        process.exit(report.passed ? 0 : 1);
      } catch (err: any) {
        console.error(`\n❌ Erro ao executar diagnóstico: ${err.message}\n`);
        process.exit(1);
      }
      break;
    }

    case "--help":
    case "-h":
    case "help":
    default: {
      console.log(`
🩺 EnvDoctor — Validador Determinístico de Ambientes Dev

Uso:
  envdoctor [comando] [opções]

Comandos:
  check               Executa a validação do ambiente atual com base no manifesto
  init                Gera um arquivo env.manifest.json inspecionando o repositório

Opções:
  --manifest <path>   Caminho personalizado para o arquivo de manifesto (padrão: ./env.manifest.json)
  --json              Emite o relatório em formato JSON estruturado (ideal para CI/CD)
  --help, -h          Exibe esta mensagem de ajuda
      `);
      process.exit(0);
    }
  }
}

// Execução direta via CLI
if (process.argv[1]?.endsWith("cli.ts") || process.argv[1]?.endsWith("cli.js")) {
  runCli().catch((err) => {
    console.error("Erro fatal:", err);
    process.exit(1);
  });
}
