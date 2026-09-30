import fs from "node:fs";
import path from "node:path";
import { ManifestSchema, type EnvManifest, type CheckItemResult, type DiagnosticReport } from "../types.ts";
import { checkRuntime } from "../inspectors/runtime.ts";
import { checkPort } from "../inspectors/ports.ts";
import { checkEnvVar } from "../inspectors/env-vars.ts";
import { checkService } from "../inspectors/services.ts";

export class DiagnosticEngine {
  /**
   * Executa a bateria completa de verificações com base em um arquivo de manifesto.
   */
  public async runChecks(manifestPath: string, projectDir: string = path.dirname(manifestPath)): Promise<DiagnosticReport> {
    const startTime = Date.now();

    if (!fs.existsSync(manifestPath)) {
      throw new Error(`Manifesto "${manifestPath}" não encontrado. Execute "envdoctor init" para criar um.`);
    }

    const rawContent = fs.readFileSync(manifestPath, "utf8");
    let parsed: any;
    try {
      parsed = JSON.parse(rawContent);
    } catch (err: any) {
      throw new Error(`Erro de sintaxe no manifesto JSON: ${err.message}`);
    }

    const manifest: EnvManifest = ManifestSchema.parse(parsed);
    const checkPromises: Promise<CheckItemResult>[] = [];

    // 1. Agendar verificações de Runtimes
    for (const r of manifest.runtimes) {
      checkPromises.push(checkRuntime(r));
    }

    // 2. Agendar verificações de Portas
    for (const p of manifest.ports) {
      checkPromises.push(checkPort(p));
    }

    // 3. Agendar verificações de Variáveis de Ambiente
    for (const e of manifest.envVars) {
      checkPromises.push(checkEnvVar(e, projectDir));
    }

    // 4. Agendar verificações de Serviços
    for (const s of manifest.services) {
      checkPromises.push(checkService(s));
    }

    // Execução totalmente concorrente para máxima velocidade (<2s)
    const settled = await Promise.allSettled(checkPromises);
    const results: CheckItemResult[] = [];

    for (const item of settled) {
      if (item.status === "fulfilled") {
        results.push(item.value);
      } else {
        results.push({
          category: "runtime",
          identifier: "unexpected_error",
          status: "FAIL",
          message: `Erro interno durante a verificação: ${item.reason?.message || item.reason}`
        });
      }
    }

    const passCount = results.filter((r) => r.status === "PASS").length;
    const failCount = results.filter((r) => r.status === "FAIL").length;
    const warnCount = results.filter((r) => r.status === "WARN").length;
    const durationMs = Date.now() - startTime;

    return {
      projectName: manifest.name,
      timestamp: new Date().toISOString(),
      durationMs,
      passed: failCount === 0,
      totalChecks: results.length,
      passCount,
      failCount,
      warnCount,
      results
    };
  }
}
