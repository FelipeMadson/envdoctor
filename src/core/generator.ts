import fs from "node:fs";
import path from "node:path";
import type { EnvManifest } from "../types.ts";

/**
 * Inspeciona o repositório atual e gera um arquivo de manifesto env.manifest.json inicial.
 */
export function generateManifest(projectDir: string = process.cwd()): { manifestPath: string; manifest: EnvManifest } {
  const pkgPath = path.join(projectDir, "package.json");
  const envExamplePath = path.join(projectDir, ".env.example");
  const envPath = path.join(projectDir, ".env");

  let projectName = path.basename(projectDir);
  let nodeMinVersion: string | undefined = "20.0.0";

  // 1. Inspecionar package.json se existir
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
      if (pkg.name) projectName = pkg.name;
      if (pkg.engines?.node) {
        const match = pkg.engines.node.match(/(\d+\.\d+(\.\d+)?)/);
        if (match) nodeMinVersion = match[0];
      }
    } catch {
      // Ignora erro de parsing no package.json
    }
  }

  // 2. Extrair chaves do .env.example ou .env
  const detectedEnvVars: Array<{ key: string; required: boolean; description?: string }> = [];
  const targetEnvFile = fs.existsSync(envExamplePath) ? envExamplePath : fs.existsSync(envPath) ? envPath : null;

  if (targetEnvFile) {
    const lines = fs.readFileSync(targetEnvFile, "utf8").split("\n");
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const equalsIdx = line.indexOf("=");
      if (equalsIdx > 0) {
        const key = line.substring(0, equalsIdx).trim();
        detectedEnvVars.push({
          key,
          required: true,
          description: `Variável requerida detectada em ${path.basename(targetEnvFile)}`
        });
      }
    }
  }

  const manifest: EnvManifest = {
    name: projectName,
    description: `Manifesto de ambiente para o projeto ${projectName}`,
    runtimes: [
      {
        command: "node",
        minVersion: nodeMinVersion,
        required: true,
        description: "Ambiente de execução JavaScript/TypeScript"
      },
      {
        command: "npm",
        minVersion: "9.0.0",
        required: true,
        description: "Gerenciador de pacotes"
      },
      {
        command: "git",
        required: true,
        description: "Controle de versão"
      }
    ],
    ports: [
      {
        port: 3000,
        expectedStatus: "free",
        serviceName: "Servidor Web / Aplicação",
        required: true
      }
    ],
    envVars: detectedEnvVars.length > 0 ? detectedEnvVars : [
      {
        key: "PORT",
        required: false,
        description: "Porta padrão do servidor HTTP"
      }
    ],
    services: []
  };

  const manifestPath = path.join(projectDir, "env.manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");

  return { manifestPath, manifest };
}
