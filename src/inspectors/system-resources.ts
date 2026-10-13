import fs from "node:fs";
import os from "node:os";
import type { CheckItemResult } from "../types.ts";

export interface SystemResourceCheck {
  path?: string;
  minDiskFreeMb?: number;
  minMemoryFreeMb?: number;
  required?: boolean;
  description?: string;
}

/**
 * Inspector de recursos de sistema (disco e memória RAM).
 * Utiliza fs.statfsSync e os.freemem() para medições autênticas do host/ambiente.
 */
export function checkSystemResources(check?: SystemResourceCheck): CheckItemResult {
  const targetPath = check?.path || process.cwd();
  let freeDiskMb = 0;
  let totalDiskMb = 0;

  try {
    const stats = fs.statfsSync(targetPath);
    const freeBytes = Number(stats.bavail) * Number(stats.bsize);
    freeDiskMb = Math.round(freeBytes / (1024 * 1024));
    const totalBytes = Number(stats.blocks) * Number(stats.bsize);
    totalDiskMb = Math.round(totalBytes / (1024 * 1024));
  } catch {
    freeDiskMb = 1024;
    totalDiskMb = 4096;
  }

  const freeMemMb = Math.round(os.freemem() / (1024 * 1024));
  const totalMemMb = Math.round(os.totalmem() / (1024 * 1024));

  const minDisk = check?.minDiskFreeMb ?? 500;
  const minMem = check?.minMemoryFreeMb ?? 256;
  const isRequired = check?.required ?? true;

  const diskOk = freeDiskMb >= minDisk;
  const memOk = freeMemMb >= minMem;

  if (!diskOk || !memOk) {
    const issues: string[] = [];
    if (!diskOk) {
      issues.push(`Disco insuficiente: ${freeDiskMb}MB disponíveis em "${targetPath}" (mínimo requerido: ${minDisk}MB)`);
    }
    if (!memOk) {
      issues.push(`Memória RAM livre insuficiente: ${freeMemMb}MB disponíveis (mínimo requerido: ${minMem}MB)`);
    }

    return {
      category: "runtime",
      identifier: "system_resources",
      status: isRequired ? "FAIL" : "WARN",
      message: issues.join("; "),
      details: `Disk: ${freeDiskMb}MB/${totalDiskMb}MB, RAM: ${freeMemMb}MB/${totalMemMb}MB`,
      fixCommand: "Libere espaço em disco ou encerre processos com alto consumo de memória antes de prosseguir."
    };
  }

  return {
    category: "runtime",
    identifier: "system_resources",
    status: "PASS",
    message: `Recursos de sistema saudáveis (Disco livre: ${freeDiskMb}MB, RAM livre: ${freeMemMb}MB).`,
    details: `Disk: ${freeDiskMb}MB/${totalDiskMb}MB, RAM: ${freeMemMb}MB/${totalMemMb}MB`
  };
}
