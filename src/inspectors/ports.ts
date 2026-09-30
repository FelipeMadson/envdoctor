import net from "node:net";
import type { PortCheck, CheckItemResult } from "../types.ts";

/**
 * Inspeciona o estado de uma porta TCP (livre vs escutando).
 */
export async function checkPort(check: PortCheck): Promise<CheckItemResult> {
  const isPortAvailable = await testPortAvailable(check.port);

  if (check.expectedStatus === "free") {
    if (isPortAvailable) {
      return {
        category: "port",
        identifier: `port:${check.port}`,
        status: "PASS",
        message: `Porta ${check.port} está livre para ${check.serviceName}.`
      };
    } else {
      return {
        category: "port",
        identifier: `port:${check.port}`,
        status: check.required ? "FAIL" : "WARN",
        message: `Porta ${check.port} já está ocupada por outro processo.`,
        details: `O serviço "${check.serviceName}" não conseguirá iniciar na porta ${check.port}.`,
        fixCommand: process.platform === "win32"
          ? `Stop-Process -Id (Get-NetTCPConnection -LocalPort ${check.port} -ErrorAction SilentlyContinue).OwningProcess -Force`
          : `npx kill-port ${check.port} ou lsof -ti:${check.port} | xargs kill -9`
      };
    }
  } else {
    // expectedStatus === "listening"
    if (!isPortAvailable) {
      return {
        category: "port",
        identifier: `port:${check.port}`,
        status: "PASS",
        message: `Serviço ${check.serviceName} está ativo e escutando na porta ${check.port}.`
      };
    } else {
      return {
        category: "port",
        identifier: `port:${check.port}`,
        status: check.required ? "FAIL" : "WARN",
        message: `Nenhum processo escutando na porta ${check.port} (${check.serviceName} parece desligado).`,
        fixCommand: `Inicie o serviço ${check.serviceName} antes de rodar o projeto.`
      };
    }
  }
}

/**
 * Testa se uma porta TCP está disponível para bind no localhost.
 */
function testPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", (err: any) => {
      if (err.code === "EADDRINUSE" || err.code === "EACCES") {
        resolve(false);
      } else {
        resolve(false);
      }
    });

    server.once("listening", () => {
      server.close(() => resolve(true));
    });

    server.listen(port, "127.0.0.1");
  });
}
