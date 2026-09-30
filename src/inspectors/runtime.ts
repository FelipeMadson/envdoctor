import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { RuntimeCheck, CheckItemResult } from "../types.ts";

const execFileAsync = promisify(execFile);

/**
 * Inspeciona se um binário/runtime está acessível no PATH e atende aos requisitos de versão.
 */
export async function checkRuntime(check: RuntimeCheck): Promise<CheckItemResult> {
  const versionArg = check.command === "python" || check.command === "python3" ? "--version" : "--version";

  const isWin = process.platform === "win32";
  let stdout = "";
  let stderr = "";

  try {
    const res = await execFileAsync(check.command, [versionArg], {
      timeout: 3000,
      windowsHide: true
    });
    stdout = res.stdout;
    stderr = res.stderr;
  } catch (err: any) {
    if (isWin && (err.code === "ENOENT" || err.message?.includes("ENOENT"))) {
      try {
        const resWin = await execFileAsync("cmd.exe", ["/d", "/s", "/c", `${check.command} ${versionArg}`], {
          timeout: 3000,
          windowsHide: true
        });
        stdout = resWin.stdout;
        stderr = resWin.stderr;
      } catch (errWin: any) {
        return {
          category: "runtime",
          identifier: check.command,
          status: check.required ? "FAIL" : "WARN",
          message: `Comando "${check.command}" não encontrado no PATH do sistema.`,
          fixCommand: `Instale "${check.command}" e certifique-se de adicioná-lo ao PATH do sistema.`
        };
      }
    } else {
      const isNotFound = err.code === "ENOENT" || err.message?.includes("ENOENT");
      return {
        category: "runtime",
        identifier: check.command,
        status: check.required ? "FAIL" : "WARN",
        message: isNotFound
          ? `Comando "${check.command}" não encontrado no PATH do sistema.`
          : `Falha ao inspecionar "${check.command}": ${err.message}`,
        fixCommand: `Instale "${check.command}" e certifique-se de adicioná-lo ao PATH do sistema.`
      };
    }
  }

  const output = (stdout || stderr).trim();
    const versionMatch = output.match(/(\d+\.\d+(\.\d+)?)/);
    const detectedVersion = versionMatch ? versionMatch[0] : output;

    if (check.minVersion && versionMatch) {
      const isSatisfied = compareSemver(detectedVersion, check.minVersion) >= 0;
      if (!isSatisfied) {
        return {
          category: "runtime",
          identifier: check.command,
          status: check.required ? "FAIL" : "WARN",
          message: `${check.command}: versão detectada (${detectedVersion}) inferior à mínima requerida (${check.minVersion}).`,
          details: `Requisito: >= ${check.minVersion}. Instalada: ${detectedVersion}`,
          fixCommand: `Atualize ${check.command} para a versão ${check.minVersion} ou superior.`
        };
      }
    }

    return {
      category: "runtime",
      identifier: check.command,
      status: "PASS",
      message: `${check.command} está pronto (${detectedVersion}).`,
      details: check.description
    };
}

/**
 * Comparador simples de semver para evitar dependências externas pesadas.
 */
function compareSemver(v1: string, v2: string): number {
  const p1 = v1.split(".").map(Number);
  const p2 = v2.split(".").map(Number);
  for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
    const num1 = p1[i] || 0;
    const num2 = p2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}
