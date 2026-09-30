import { test, describe } from "node:test";
import assert from "node:assert";
import path from "node:path";
import { DiagnosticEngine } from "../src/core/engine.ts";

describe("EnvDoctor - DiagnosticEngine Ponta a Ponta", () => {
  const manifestPath = path.join(process.cwd(), "env.manifest.json");

  test("deve carregar manifesto e executar verificações concorrentemente em menos de 2s", async () => {
    const engine = new DiagnosticEngine();
    const report = await engine.runChecks(manifestPath);

    assert.ok(report.totalChecks >= 3, "Deveria ter executado pelo menos 3 verificações");
    assert.strictEqual(report.projectName, "EnvDoctor Test Suite");
    assert.ok(report.durationMs < 2000, `Execução demorou ${report.durationMs}ms, deveria ser < 2000ms`);
    assert.strictEqual(report.passed, true, "Manifesto de teste padrão deveria passar");
  });

  test("deve falhar adequadamente se caminho do manifesto for inválido", async () => {
    const engine = new DiagnosticEngine();
    await assert.rejects(
      async () => {
        await engine.runChecks("caminho_inexistente_xyz.json");
      },
      /não encontrado/
    );
  });
});
