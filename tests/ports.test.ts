import { test, describe } from "node:test";
import assert from "node:assert";
import net from "node:net";
import { checkPort } from "../src/inspectors/ports.ts";

describe("EnvDoctor - Inspector de Portas TCP", () => {
  const TEST_PORT = 49234;

  test("deve validar porta livre quando nenhum processo estiver escutando", async () => {
    const result = await checkPort({
      port: TEST_PORT,
      expectedStatus: "free",
      serviceName: "Teste Servidor Livre",
      required: true
    });

    assert.strictEqual(result.status, "PASS");
    assert.ok(result.message.includes("está livre"));
  });

  test("deve detectar porta ocupada e emitir recomendação de encerramento de processo", async () => {
    // 1. Criar um servidor TCP mock escutando na porta
    const mockServer = net.createServer();
    await new Promise<void>((resolve) => {
      mockServer.listen(TEST_PORT, "127.0.0.1", () => resolve());
    });

    try {
      const result = await checkPort({
        port: TEST_PORT,
        expectedStatus: "free",
        serviceName: "Servidor Conflitante",
        required: true
      });

      assert.strictEqual(result.status, "FAIL");
      assert.ok(result.message.includes("já está ocupada"));
      assert.ok(result.fixCommand !== undefined, "Deveria sugerir comando de liberação");
    } finally {
      // 2. Fechar o servidor mock
      await new Promise<void>((resolve) => {
        mockServer.close(() => resolve());
      });
    }
  });
});
