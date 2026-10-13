import test from "node:test";
import assert from "node:assert/strict";
import { checkSystemResources } from "../src/inspectors/system-resources.ts";

test("System Resources Inspector: Valida recursos de sistema com limiares normais (PASS)", () => {
  const result = checkSystemResources({ minDiskFreeMb: 10, minMemoryFreeMb: 10 });
  assert.equal(result.status, "PASS");
  assert.ok(result.message.includes("Recursos de sistema saudáveis"));
  assert.equal(result.identifier, "system_resources");
});

test("System Resources Inspector: Detecta limiar de disco impossivelmente alto e acusa FAIL", () => {
  const result = checkSystemResources({ minDiskFreeMb: 999999999, required: true });
  assert.equal(result.status, "FAIL");
  assert.ok(result.message.includes("Disco insuficiente"));
  assert.ok(result.fixCommand && result.fixCommand.includes("Libere espaço em disco"));
});

test("System Resources Inspector: Respeita required: false emitindo status WARN", () => {
  const result = checkSystemResources({ minDiskFreeMb: 999999999, required: false });
  assert.equal(result.status, "WARN");
  assert.ok(result.message.includes("Disco insuficiente"));
});
