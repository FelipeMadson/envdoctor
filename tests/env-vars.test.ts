import { test, describe, before, after } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { checkEnvVar } from "../src/inspectors/env-vars.ts";

const TEMP_DIR = path.join(process.cwd(), "temp_test_env_dir");

describe("EnvDoctor - Inspector de Variáveis .env (Zero Vazamento)", () => {
  before(() => {
    if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });
    // Criar um .env de teste contendo um segredo
    fs.writeFileSync(path.join(TEMP_DIR, ".env"), `
      DATABASE_URL="postgres://user:super_secret_password@localhost:5432/mydb"
      PORT=3000
    `, "utf8");
  });

  after(() => {
    try {
      fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    } catch {
      // Cleanup best-effort
    }
  });

  test("deve validar variável presente sem jamais expor o valor secreto no relatório", async () => {
    const result = await checkEnvVar({
      key: "DATABASE_URL",
      required: true
    }, TEMP_DIR);

    assert.strictEqual(result.status, "PASS");
    // GARANTIA DE SEGURANÇA: A senha jamais pode constar em nenhum campo do resultado
    const serialized = JSON.stringify(result);
    assert.ok(!serialized.includes("super_secret_password"), "Vazamento de segredo detectado no relatório!");
    assert.ok(!serialized.includes("postgres://"), "URL com credenciais vazada no relatório!");
  });

  test("deve acusar falha quando variável obrigatória não existir", async () => {
    const result = await checkEnvVar({
      key: "STRIPE_SECRET_KEY",
      required: true
    }, TEMP_DIR);

    assert.strictEqual(result.status, "FAIL");
    assert.ok(result.message.includes("não está definida"));
    assert.ok(result.fixCommand?.includes("STRIPE_SECRET_KEY"));
  });
});
