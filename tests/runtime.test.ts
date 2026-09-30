import { test, describe } from "node:test";
import assert from "node:assert";
import { checkRuntime } from "../src/inspectors/runtime.ts";

describe("EnvDoctor - Inspector de Runtimes", () => {
  test("deve aprovar runtime existente que atende à versão mínima (Node.js)", async () => {
    const result = await checkRuntime({
      command: "node",
      minVersion: "20.0.0",
      required: true
    });

    assert.strictEqual(result.status, "PASS");
    assert.strictEqual(result.identifier, "node");
    assert.ok(result.message.includes("está pronto"));
  });

  test("deve reprovar comando inexistente com mensagem clara e fixCommand", async () => {
    const result = await checkRuntime({
      command: "nonexistent_command_xyz_123",
      required: true
    });

    assert.strictEqual(result.status, "FAIL");
    assert.ok(result.message.includes("não encontrado"));
    assert.ok(result.fixCommand?.includes("Instale"));
  });

  test("deve emitir WARN em vez de FAIL se comando opcional não existir", async () => {
    const result = await checkRuntime({
      command: "nonexistent_optional_xyz",
      required: false
    });

    assert.strictEqual(result.status, "WARN");
  });
});
