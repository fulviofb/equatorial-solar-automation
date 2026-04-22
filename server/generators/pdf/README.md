# Gerador de Diagrama Unifilar PDF

Este diretório contém a reescrita do `pdfGenerator.ts` seguindo a
**NT.00020.EQTL revisão 05 (2024)** da Equatorial Energia.

## Referência visual normativa

A biblioteca de símbolos e o layout do diagrama seguem fielmente a
**Figura 5 da NT.00020.EQTL**: "Modelo de diagrama unifilar de microgeração
conectada à rede de baixa tensão com uso de inversor e sem transformador
de acoplamento."

Para casos com transformador de acoplamento ou geração sem inversor, serão
criadas receitas de layout adicionais em fases posteriores, seguindo as
Figuras 6 (com transformador) e 7 (sem inversor) da mesma norma.

## Estrutura de diretórios

```
pdf/
├── symbols/      # Biblioteca de símbolos ABNT/IEC (disjuntor, DPS, módulo FV, ...)
├── layout/       # Elementos fixos da prancha (moldura, carimbo, legenda, notas)
├── diagram/      # Montagem do diagrama (roteamento, escolha de receita)
├── utils/        # Helpers de geometria, unidades, notação de cabos
└── index.ts      # Ponto de entrada
```

## Princípios de design

1. **Compatibilidade total com a API atual**: a função pública
   `generatePDFDiagram(data: ProjectData): Promise<Buffer>` mantém
   exatamente a mesma assinatura. Nenhuma alteração no frontend,
   tRPC ou schema é necessária.

2. **Símbolos como funções puras**: cada símbolo é uma função
   `drawXxx(page, options)` testável isoladamente. Snapshots PDF
   são gerados em `server/tests/__pdf_snapshots__/` para validação
   visual contra a Figura 5 da norma.

3. **Layout adaptativo**: o diagrama se ajusta ao número de módulos,
   strings e tipo de inversor (microinversor vs string).

4. **Ortogonalidade estrita**: cabos são sempre desenhados em linhas
   ortogonais (horizontal/vertical), nunca diagonais — convenção CAD.

## Unidades

- **Página**: A3 paisagem = 1191 × 842 pt (420 × 297 mm)
- **Grid técnico**: 5 mm ≈ 14.17 pt
- **Font**: Helvetica (built-in no pdf-lib, sem dependência externa)

## Status das fases

- [x] **Fase 1**: Fundação (esta entrega)
  - Estrutura de diretórios
  - `utils/geometry.ts`, `utils/units.ts`, `utils/notationCabo.ts`
  - `layout/frame.ts` (moldura A3 com divisões internas)
  - Script de snapshot gerando prancha em branco
- [ ] **Fase 2**: Símbolos essenciais (módulo FV, microinversor, disjuntor, DPS, medidor, aterramento)
- [ ] **Fase 3**: Símbolos complementares (stringbox, barramento terra, end cap, ...)
- [ ] **Fase 4**: Cabos e anotações normativas
- [ ] **Fase 5**: Layout principal microinversor (Figura 5)
- [ ] **Fase 6**: Elementos fixos da prancha (carimbo, legenda, notas, placa)
- [ ] **Fase 7**: Layout inversor string (Figura 6)
- [ ] **Fase 8**: Integração e polimento

## Como gerar um snapshot visual

Durante o desenvolvimento, para validar visualmente como a prancha está
ficando antes de ter os símbolos completos:

```bash
pnpm tsx server/tests/generatePdfSnapshot.ts
```

O arquivo gerado vai para `server/tests/__pdf_snapshots__/`.

## Referências normativas

- NT.00020.EQTL rev. 05 (2024), Equatorial Energia — Conexão de Micro e
  Minigeração Distribuída. Seção 5.12.2(c) define conteúdo mínimo do
  diagrama unifilar. Seção 6.3.3 e Figura 5 definem layout visual.
- ABNT NBR 16690:2019 — Instalações elétricas de arranjos fotovoltaicos
- ABNT NBR 16274 — Sistemas FV conectados à rede
- ABNT NBR 5444 — Símbolos gráficos para instalações elétricas
- IEC 60617 — Graphical symbols for diagrams
