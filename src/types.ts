import { z } from "zod";

// Schema para verificação de ferramentas de linha de comando / runtimes
export const RuntimeCheckSchema = z.object({
  command: z.string().min(1),
  minVersion: z.string().optional(),
  required: z.boolean().default(true),
  description: z.string().optional()
});

// Schema para verificação de portas TCP
export const PortCheckSchema = z.object({
  port: z.number().int().min(1).max(65535),
  expectedStatus: z.enum(["free", "listening"]).default("free"),
  serviceName: z.string().min(1),
  required: z.boolean().default(true)
});

// Schema para verificação de variáveis de ambiente
export const EnvVarCheckSchema = z.object({
  key: z.string().min(1),
  required: z.boolean().default(true),
  pattern: z.string().optional(), // Regex opcional para validar formato (ex: URL, boolean)
  description: z.string().optional()
});

// Schema para probes de serviços locais (PostgreSQL, Redis, Ollama, etc.)
export const ServiceCheckSchema = z.object({
  name: z.string().min(1),
  host: z.string().default("localhost"),
  port: z.number().int().min(1).max(65535),
  timeoutMs: z.number().int().default(1000),
  required: z.boolean().default(true)
});

// Schema completo do arquivo de manifesto (env.manifest.json)
export const ManifestSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  runtimes: z.array(RuntimeCheckSchema).default([]),
  ports: z.array(PortCheckSchema).default([]),
  envVars: z.array(EnvVarCheckSchema).default([]),
  services: z.array(ServiceCheckSchema).default([])
});

export type EnvManifest = z.infer<typeof ManifestSchema>;
export type RuntimeCheck = z.infer<typeof RuntimeCheckSchema>;
export type PortCheck = z.infer<typeof PortCheckSchema>;
export type EnvVarCheck = z.infer<typeof EnvVarCheckSchema>;
export type ServiceCheck = z.infer<typeof ServiceCheckSchema>;

export type CheckStatus = "PASS" | "FAIL" | "WARN";
export type CheckCategory = "runtime" | "port" | "env" | "service";

export interface CheckItemResult {
  category: CheckCategory;
  identifier: string;
  status: CheckStatus;
  message: string;
  details?: string;
  fixCommand?: string;
}

export interface DiagnosticReport {
  projectName: string;
  timestamp: string;
  durationMs: number;
  passed: boolean;
  totalChecks: number;
  passCount: number;
  failCount: number;
  warnCount: number;
  results: CheckItemResult[];
}
