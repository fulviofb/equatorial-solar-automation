# Automação Python: Geração de Diagrama Unifilar

Este módulo contém scripts Python para gerar automaticamente o Diagrama Unifilar (PDF) e o arquivo DXF editável a partir de um template padrão.

## Estrutura
- `foton_automator.py`: Script principal.
- `requirements.txt`: Dependências Python.
- `PROJETO FOXESS MICRO.dxf`: Template do AutoCAD.

## Como Usar (Linha de Comando / Node.js)

O script aceita um argumento `--json` contendo os dados do projeto.

Exemplo de chamada:
```bash
python foton_automator.py --json '{"nome_cliente": "Fulano", "potencia_total": "5 kWp", "qtd_modulos": "10 Módulos", "modelo_inversor": "Microinversor X"}' --output "./out"
```

## Integração via TypeScript (Recomendado)

Foi criado um módulo helper em `server/lib/pythonBridge.ts` para facilitar o uso.

Exemplo de uso no seu Controller/Router:

```typescript
import { PythonGenerator } from '../lib/pythonBridge';

// ... dentro da sua rota ...
const result = await PythonGenerator.generatePdf({
  nome_cliente: "Fulano",
  potencia_total: "5 kWp",
  // ...
});

if (result.success) {
  console.log("PDF gerado em:", result.filePath);
}
```

## Dependências
Instale as libs Python ambiente onde o server roda:
```bash
pip install -r requirements.txt
```
