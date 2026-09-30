import fs from "node:fs";
import path from "node:path";
import type { EnvVarCheck, CheckItemResult } from "../types.ts";

/**
 * Inspeciona se as variáveis de ambiente necessárias estão configuradas no .env
 * com garantia estrita de NÃO VAZAMENTO de credenciais e valores sensíveis.
 */
export async function checkEnvVar(check: EnvVarCheck, projectDir: string = process.cwd()): Promise<CheckItemResult> {
  const envPath = path.join(projectDir, ".env");
  const envExamplePath = path.join(projectDir, ".env.example");

  if (!fs.existsSync(envPath)) {
    return {
      category: "env",
      identifier: check.key,
      status: check.required ? "FAIL" : "WARN",
      message: `Arquivo .env não encontrado no diretório do projeto.`,
      details: fs.existsSync(envExamplePath)
        ? `Existe um arquivo .env.example que pode ser usado como base.`
        : undefined,
      fixCommand: fs.existsSync(envExamplePath)
        ? process.platform === "win32"
          ? "Copy-Item .env.example .env"
          : "cp .env.example .env"
        : `touch .env`
    };
  }

  const envContent = fs.readFileSync(envPath, "utf8");
  const envMap = parseDotenv(envContent);

  const value = envMap.get(check.key);

  if (value === undefined || value.trim() === "") {
    return {
      category: "env",
      identifier: check.key,
      status: check.required ? "FAIL" : "WARN",
      message: `Variável obrigatória "${check.key}" não está definida ou está vazia no .env.`,
      details: check.description,
      fixCommand: `Adicione "${check.key}=<seu_valor>" ao seu arquivo .env.`
    };
  }

  // Se houver validação de formato por regex
  if (check.pattern) {
    try {
      const regex = new RegExp(check.pattern);
      if (!regex.test(value)) {
        return {
          category: "env",
          identifier: check.key,
          status: "FAIL",
          message: `Valor da variável "${check.key}" não corresponde ao formato esperado.`,
          details: `Formato esperado: ${check.pattern} (o valor real foi omitido por segurança).`,
          fixCommand: `Ajuste o valor de "${check.key}" no arquivo .env.`
        };
      }
    } catch {
      // Ignora regex malformada no manifesto
    }
  }

  return {
    category: "env",
    identifier: check.key,
    status: "PASS",
    message: `Variável "${check.key}" configurada corretamente no .env.`,
    details: check.description
  };
}

/**
 * Parser simples de .env em conformidade com o padrão chave=valor,
 * desconsiderando comentários e espaços em branco.
 */
function parseDotenv(content: string): Map<string, string> {
  const map = new Map<string, string>();
  const lines = content.split("\n");

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const equalsIdx = line.indexOf("=");
    if (equalsIdx > 0) {
      const key = line.substring(0, equalsIdx).trim();
      let val = line.substring(equalsIdx + 1).trim();

      // Remove aspas simples ou duplas envolventes
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }

      map.set(key, val);
    }
  }

  return map;
}
