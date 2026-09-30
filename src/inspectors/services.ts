import net from "node:net";
import type { ServiceCheck, CheckItemResult } from "../types.ts";

/**
 * Executa uma sonda TCP (probe) para verificar se um serviço local/remoto está ativo e respondendo.
 */
export async function checkService(check: ServiceCheck): Promise<CheckItemResult> {
  const isOnline = await probeTcp(check.host, check.port, check.timeoutMs);

  if (isOnline) {
    return {
      category: "service",
      identifier: `${check.name} (${check.host}:${check.port})`,
      status: "PASS",
      message: `Serviço "${check.name}" está ativo e aceitando conexões em ${check.host}:${check.port}.`
    };
  }

  return {
    category: "service",
    identifier: `${check.name} (${check.host}:${check.port})`,
    status: check.required ? "FAIL" : "WARN",
    message: `Serviço "${check.name}" inacessível em ${check.host}:${check.port}.`,
    details: `Tentativa de conexão TCP esgotou o tempo limite de ${check.timeoutMs}ms.`,
    fixCommand: `Certifique-se de que o serviço "${check.name}" está em execução.`
  };
}

/**
 * Conexão rápida com timeout via socket TCP.
 */
function probeTcp(host: string, port: number, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let isResolved = false;

    const cleanup = () => {
      if (!socket.destroyed) {
        socket.destroy();
      }
    };

    socket.setTimeout(timeoutMs);

    socket.on("connect", () => {
      if (!isResolved) {
        isResolved = true;
        cleanup();
        resolve(true);
      }
    });

    socket.on("timeout", () => {
      if (!isResolved) {
        isResolved = true;
        cleanup();
        resolve(false);
      }
    });

    socket.on("error", () => {
      if (!isResolved) {
        isResolved = true;
        cleanup();
        resolve(false);
      }
    });

    socket.connect(port, host);
  });
}
