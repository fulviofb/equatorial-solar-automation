import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import { inverters } from "./drizzle/schema.js";

const db = drizzle(process.env.DATABASE_URL);

async function checkMicroinverter() {
  const result = await db
    .select()
    .from(inverters)
    .where(eq(inverters.model, "MX3000D"))
    .limit(1);

  if (result.length === 0) {
    console.log("❌ Inversor MX3000D não encontrado no banco");
    return;
  }

  const inverter = result[0];
  console.log("\n📊 Dados do Inversor MX3000D:");
  console.log("ID:", inverter.id);
  console.log("Fabricante:", inverter.manufacturer);
  console.log("Modelo:", inverter.model);
  console.log("É Microinversor?:", inverter.isMicroinverter);
  console.log("Corrente Máxima por Entrada:", inverter.maxCurrentPerInput);
  console.log("Quantidade de Entradas CC:", inverter.numberOfStrings);
  
  if (inverter.isMicroinverter) {
    console.log("\n✅ Inversor está marcado como MICROINVERSOR");
  } else {
    console.log("\n❌ Inversor NÃO está marcado como microinversor");
    console.log("   Você precisa editar o inversor e marcar o checkbox!");
  }
}

checkMicroinverter().catch(console.error);
