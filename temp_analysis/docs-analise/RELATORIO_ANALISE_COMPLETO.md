# RELATÓRIO DE ANÁLISE CRÍTICA: Documentos Gerados vs Templates Oficiais Equatorial GO

**Data:** 04/12/2025  
**Projeto:** Sistema de Automação de Projetos Solares Equatorial GO  
**Status:** 🚨 **CRÍTICO - DOCUMENTOS NÃO CONFORMES**

---

## RESUMO EXECUTIVO

A análise comparativa entre os documentos gerados automaticamente pelo sistema e os templates oficiais da Equatorial GO revelou **diferenças estruturais críticas** que tornam os documentos atuais **INADEQUADOS** para submissão à concessionária.

### Conclusão Geral

**O sistema atual NÃO está gerando documentos no formato correto da Equatorial GO.** Os documentos gerados são versões extremamente simplificadas que não correspondem à estrutura, formatação e conteúdo exigidos pela concessionária.

### Impacto

- ⛔ **ALTO RISCO DE REJEIÇÃO** pela Equatorial GO
- ⛔ Documentos não atendem aos requisitos normativos (NT.00020.EQTL)
- ⛔ Falta de informações obrigatórias em todos os três documentos

---

## 1. ANÁLISE DO FORMULÁRIO EXCEL (Anexo I)

### 1.1. Estrutura do Template Oficial

**Arquivo:** `NT.00020-05-Anexo-I-Formulario-de-Solicitacao-de-Orcamento-de-Microgeracao-Distribuida-Grupo-BHerikson.xlsx`

**Estrutura:**
- **5 abas:** ROTEIRO, 0, 1, 2, FONTES
- **Aba 0 (Equipamentos):** 1.275 linhas × 73 colunas, 574 células mescladas
- **Aba 1 (Dados Cadastrais):** 1.293 linhas × 101 colunas, 191 células mescladas
- **Aba 2 (Rateio):** 405 linhas × 27 colunas, 197 células mescladas
- **Aba ROTEIRO:** Instruções de preenchimento
- **Aba FONTES:** Lista de tipos de fontes primárias

### 1.2. Estrutura do Documento Gerado

**Arquivo:** `Formulario_30001.xlsx`

**Estrutura:**
- **2 abas:** 0, 1 (faltam 3 abas)
- **Aba 0:** 10 linhas × 26 colunas, 1 célula mesclada
- **Aba 1:** 34 linhas × 26 colunas, 1 célula mesclada

### 1.3. Diferenças Críticas Identificadas

#### 🚨 CRÍTICO: Estrutura Incompleta

| Aspecto | Template Oficial | Documento Gerado | Status |
|---------|------------------|------------------|--------|
| Número de abas | 5 | 2 | ❌ Faltam 3 abas |
| Aba ROTEIRO | ✅ Presente | ❌ Ausente | ❌ CRÍTICO |
| Aba 2 (Rateio) | ✅ Presente | ❌ Ausente | ❌ CRÍTICO |
| Aba FONTES | ✅ Presente | ❌ Ausente | ❌ CRÍTICO |

#### ⚠️ ALTO: Dimensões Incorretas

**Aba 0 (Equipamentos):**
- Template: 1.275 linhas × 73 colunas
- Gerado: 10 linhas × 26 colunas
- **Redução:** 99,2% menor em linhas, 64% menor em colunas

**Aba 1 (Dados Cadastrais):**
- Template: 1.293 linhas × 101 colunas
- Gerado: 34 linhas × 26 colunas
- **Redução:** 97,4% menor em linhas, 74% menor em colunas

#### ⚡ MÉDIO: Formatação Ausente

**Células Mescladas:**
- Template Aba 0: 574 células mescladas (formatação complexa)
- Gerado Aba 0: 1 célula mesclada (apenas cabeçalho)
- **Perda:** 99,8% da formatação

**Células Mescladas:**
- Template Aba 1: 191 células mescladas
- Gerado Aba 1: 1 célula mesclada
- **Perda:** 99,5% da formatação

### 1.4. Conteúdo Faltante na Aba 0 (Equipamentos)

O template oficial possui:

1. **Seção 1: Solar Fotovoltaica**
   - Espaço para até 10 arranjos de módulos
   - Colunas: Item, Potência do Módulo, Quantidade, Potência de Pico, Área do arranjo, Fabricante, Modelo
   - Linha TOTAL com fórmulas automáticas

2. **Seção 2: Dados dos Inversores**
   - Espaço para até 30 inversores
   - Colunas: Item, Fabricante, Modelo, Potência Nominal, Faixa de tensão, Corrente Nominal, Fator de Potência, Rendimento, DHT de Corrente
   - Linha TOTAL com fórmulas

3. **Seções 3-5:** Eólica, Hidráulica, Biomassa (não preenchidas mas presentes no template)

**Documento gerado:** Possui apenas uma versão simplificada com 1 linha de dados.

### 1.5. Conteúdo Faltante na Aba 1 (Dados Cadastrais)

O template oficial possui estrutura detalhada com:

1. **Seção 1: Identificação e Dados Cadastrais da UC**
   - Nome/Razão Social
   - CPF/CNPJ, RG, Data Expedição
   - Endereço completo (CEP, Município, UF)
   - Tipo de orçamento (selecionável)
   - Tipo de Solicitação (6 opções selecionáveis)
   - Conta Contrato
   - Cargas Especiais
   - Ramo de Atividade
   - Classe (selecionável com validação)
   - Tipo de Ligação (selecionável: MONOFÁSICO/BIFÁSICO/TRIFÁSICO)
   - Tensão de Atendimento
   - Carga Declarada, Disjuntor de Entrada, Potência Disponibilizada
   - Tipo de Ramal (AÉREO/SUBTERRÂNEO)
   - Nº do poste/transformador
   - Coordenadas UTM (X, Y)

2. **Seção 2: Dados do Responsável Técnico**
   - Nome Completo
   - Título Profissional
   - Registro Profissional (Nº e UF)
   - E-mail, Telefone Fixo, Celular, Fax
   - Endereço de Correspondência completo

3. **Seção 3: Características da Microgeração Distribuída**
   - Tipo de Fonte Primária (selecionável)
   - Tipo de Geração (selecionável)
   - Enquadramento (selecionável: AUTOCONSUMO LOCAL/REMOTO/GERAÇÃO COMPARTILHADA/EMUC)
   - Data de Início da Operação
   - Potência Instalada Total (calculada automaticamente)
   - Número de Inversores (calculado)
   - Número de Módulos (calculado)
   - Área Total dos Arranjos (calculada)

**Documento gerado:** Possui apenas campos básicos sem a estrutura completa.

### 1.6. Abas Completamente Ausentes

#### Aba 2 (Rateio)

**Finalidade:** Lista de rateio para UC participantes do sistema de compensação (Autoconsumo Remoto, Geração Compartilhada, EMUC)

**Conteúdo:**
- Conta Contrato da UC geradora
- Local da solicitação
- Forma de alocação dos créditos (Ordem de Prioridade ou Percentual do Excedente)
- Tabela com até 43 UCs participantes
- Colunas: Ordem, % kWh, Conta Contrato, Classe de Consumo, Endereço

**Status:** ❌ Completamente ausente no documento gerado

#### Aba ROTEIRO

**Finalidade:** Instruções detalhadas de preenchimento do formulário

**Conteúdo:**
- Passo a passo para preenchimento de cada aba
- Orientações específicas por tipo de fonte (Solar, Eólica, Hidráulica, Biomassa)
- Observações sobre campos selecionáveis e validações

**Status:** ❌ Completamente ausente no documento gerado

#### Aba FONTES

**Finalidade:** Lista de referência de tipos de fontes primárias

**Conteúdo:**
- Biomassa (Floresta, Resíduos sólidos urbanos, Resíduos animais, Biocombustíveis líquidos, Agroindustriais)
- Eólica (Cinética do vento)
- Fóssil (Petróleo, Carvão mineral, Gás natural, Outros Fósseis)
- Hídrica (Potencial hidráulico)
- Nuclear (Urânio)
- Solar (Radiação solar)
- Undi-Elétrica (Cinética da água)

**Status:** ❌ Completamente ausente no documento gerado

---

## 2. ANÁLISE DO MEMORIAL TÉCNICO WORD (Anexo III)

### 2.1. Estrutura do Template Oficial

**Arquivo:** `NT.00020.EQTL-05-Anexo-III-Modelo-de-Memorial-Tecnico-DescritivoHerikson).docx`

**Estrutura:** 12 páginas com formatação profissional

**Conteúdo:**

1. **Capa (Página 1)**
   - Data e Revisão (Data:07/10/2025, Rev:05)
   - Título: MODELO DE MEMORIAL TÉCNICO DESCRITIVO
   - Descrição do sistema (em destaque com cores)
   - Nome do cliente e RG
   - Nome do responsável técnico, título e registro
   - Local e data

2. **Lista de Siglas e Abreviaturas (Página 2)**
   - 35+ siglas técnicas definidas (ABNT, ANEEL, BT, C.A, C.C, CD, CI, DSP, DSV, FP, FV, GD, HSP, IEC, etc.)

3. **Sumário (Página 3)**
   - 12 seções principais numeradas
   - Subseções detalhadas
   - Numeração de páginas

4. **Página em branco (Página 4)**

5. **Seção 1: OBJETIVO (Página 5)**
   - Texto descritivo detalhado
   - Referências à EQUATORIAL GO em destaque
   - Especificações técnicas do sistema (potência, módulos, inversores)
   - Tipo de enquadramento

6. **Seção 2: REFERÊNCIAS NORMATIVAS E REGULATÓRIA**
   - Lista de 13 normas aplicáveis (ABNT, EQUATORIAL, ANEEL, IEC)

7. **Seção 3: DADOS DA UNIDADE CONSUMIDORA**

8. **Seção 4: LEVANTAMENTO DE CARGA**

9. **Seção 5: PADRÃO DE ENTRADA**
   - 5.1. Tipo de Ligação e Tensão de Atendimento
   - 5.2. Disjuntor de Entrada
   - 5.3. Potência Disponibilizada
   - 5.4. Caixa de Medição
   - 5.5. Ramal de Entrada

10. **Seção 6: ESTIMATIVA DE GERAÇÃO**

11. **Seção 7: DIMENSIONAMENTO DO GERADOR**
    - 7.1. Dimensionamento do gerador

12. **Seção 8: DIMENSIONAMENTO DO INVERSOR (SE HOUVER)**

13. **Seção 9: DIMENSIONAMENTO DA PROTEÇÃO**
    - 9.1. Fusíveis
    - 9.2. Disjuntores
    - 9.3. Dispositivo de seccionamento visível (quando houver)
    - 9.4. DPS
    - 9.5. Aterramento
    - 9.6. Requisitos de Proteção

14. **Seção 10: DIMENSIONAMENTO DOS CABOS**

15. **Seção 11: PLACA DE ADVERTÊNCIA**

16. **Seção 12: ANEXOS**

### 2.2. Estrutura do Documento Gerado

**Arquivo:** `Memorial_Tecnico_30001.docx`

**Estrutura:** 2 páginas com formatação básica

**Conteúdo:**

1. **Página 1**
   - Título: MEMORIAL TÉCNICO DESCRITIVO
   - Subtítulo: SISTEMA DE MICROGERAÇÃO DISTRIBUÍDA
   - Seção 1: IDENTIFICAÇÃO (dados do cliente)
   - Seção 2: RESPONSÁVEL TÉCNICO
   - Seção 3: CARACTERÍSTICAS DO SISTEMA DE MICROGERAÇÃO
   - Seção 4: MÓDULOS FOTOVOLTAICOS (vazio)
   - Seção 5: INVERSORES (vazio)
   - Seção 6: DESCRIÇÃO DO SISTEMA (texto genérico)

2. **Página 2**
   - Continuação da Seção 6
   - Assinatura do responsável técnico

### 2.3. Diferenças Críticas Identificadas

#### 🚨 CRÍTICO: Conteúdo Incompleto

| Seção | Template Oficial | Documento Gerado | Status |
|-------|------------------|------------------|--------|
| Páginas | 12 | 2 | ❌ 83% menor |
| Capa formatada | ✅ Sim | ❌ Não | ❌ CRÍTICO |
| Lista de Siglas | ✅ Sim (35+ siglas) | ❌ Não | ❌ CRÍTICO |
| Sumário | ✅ Sim (12 seções) | ❌ Não | ❌ CRÍTICO |
| Seções principais | 12 | 6 | ❌ Faltam 6 seções |
| Referências Normativas | ✅ 13 normas | ❌ Ausente | ❌ CRÍTICO |
| Levantamento de Carga | ✅ Sim | ❌ Não | ❌ CRÍTICO |
| Padrão de Entrada | ✅ 5 subseções | ❌ Não | ❌ CRÍTICO |
| Estimativa de Geração | ✅ Sim | ❌ Não | ❌ CRÍTICO |
| Dimensionamento Proteção | ✅ 6 subseções | ❌ Não | ❌ CRÍTICO |
| Dimensionamento Cabos | ✅ Sim | ❌ Não | ❌ CRÍTICO |
| Placa de Advertência | ✅ Sim | ❌ Não | ❌ CRÍTICO |
| Anexos | ✅ Sim | ❌ Não | ❌ CRÍTICO |

#### ⚠️ ALTO: Formatação Inadequada

**Template Oficial:**
- Capa com destaque visual (cores, negrito, centralização)
- Cabeçalho com Data e Revisão em todas as páginas
- Formatação profissional com espaçamento adequado
- Textos em destaque com cores (vermelho para informações importantes)
- Sumário com numeração de páginas
- Estrutura hierárquica clara (seções e subseções)

**Documento Gerado:**
- Formatação básica sem destaque visual
- Sem cabeçalho/rodapé
- Sem cores ou destaques
- Sem sumário
- Estrutura simplificada

#### ⚡ MÉDIO: Seções Vazias

As seções "4. MÓDULOS FOTOVOLTAICOS" e "5. INVERSORES" estão presentes mas completamente vazias, sem nenhuma especificação técnica.

---

## 3. ANÁLISE DO DIAGRAMA UNIFILAR PDF (Anexo IV)

### 3.1. Template de Referência

**Arquivo:** `DiagramadeBlocos-Herikson.xlsx`

**Observação:** O template fornecido é um arquivo Excel, não um PDF. Aparentemente, o diagrama unifilar deve ser criado a partir de dados estruturados e depois exportado para PDF.

**Estrutura do Excel:**
- 1 aba: Planilha1
- Dimensões: 43 linhas × 10 colunas
- Contém dados estruturados sobre o sistema (módulos, inversores, proteções)

### 3.2. Documento Gerado

**Arquivo:** `Diagrama_Unifilar_30001.pdf`

**Estrutura:** 1 página com diagrama básico

**Conteúdo:**
- Título: DIAGRAMA UNIFILAR - SISTEMA DE MICROGERAÇÃO FOTOVOLTAICA
- Dados do cliente e endereço
- Potência Instalada: 4.20 kWp
- Diagrama simplificado mostrando:
  - Quadro de Proteção CA (Disjuntor 40A)
  - Medidor Bidirecional (Rede Equatorial 220V)
- Responsável técnico e data
- Notas de rodapé (2 itens)

### 3.3. Diferenças Críticas Identificadas

#### 🚨 CRÍTICO: Diagrama Incompleto

**Elementos Faltantes:**

1. **Lado CC (Corrente Contínua):**
   - ❌ Módulos fotovoltaicos (representação gráfica)
   - ❌ Strings de módulos
   - ❌ Caixas de junção (string boxes)
   - ❌ Proteção CC (fusíveis, disjuntores, DPS)
   - ❌ Cabeamento CC (especificações)

2. **Inversores:**
   - ❌ Representação gráfica dos inversores
   - ❌ Especificações técnicas (modelo, potência)
   - ❌ Conexões entrada/saída

3. **Lado CA (Corrente Alternada):**
   - ✅ Quadro de Proteção CA (presente mas simplificado)
   - ❌ Disjuntores específicos por inversor
   - ❌ DPS CA
   - ❌ Cabeamento CA (especificações)

4. **Aterramento:**
   - ❌ Sistema de aterramento
   - ❌ Hastes de aterramento
   - ❌ Conexões de aterramento

5. **Medição:**
   - ✅ Medidor bidirecional (presente)
   - ❌ Especificações do medidor

6. **Informações Técnicas:**
   - ❌ Tabela com especificações dos módulos
   - ❌ Tabela com especificações dos inversores
   - ❌ Tabela com especificações dos cabos
   - ❌ Tabela com especificações das proteções
   - ❌ Legenda de símbolos

#### ⚠️ ALTO: Não Atende Normas Técnicas

Um diagrama unifilar completo conforme ABNT NBR 5410 e NT.00020.EQTL deve conter:

1. **Representação completa do sistema:**
   - Geração (módulos FV)
   - Conversão (inversores)
   - Proteção (fusíveis, disjuntores, DPS)
   - Medição (medidor bidirecional)
   - Conexão à rede (ponto de entrega)
   - Aterramento (SPDA)

2. **Especificações técnicas:**
   - Potências nominais
   - Tensões e correntes
   - Seções de cabos
   - Correntes de proteção
   - Distâncias e comprimentos

3. **Simbologia normalizada:**
   - Conforme ABNT NBR 5444
   - Legenda de símbolos

**Documento gerado:** Possui apenas 20% do conteúdo necessário.

---

## 4. ANÁLISE DO CÓDIGO GERADOR DE DOCUMENTOS

### 4.1. Localização

**Arquivo:** `/home/ubuntu/equatorial-solar-automation/src/lib/documentGenerators.ts`

### 4.2. Problemas Identificados

#### Abordagem Incorreta

O código atual está **criando documentos do zero** ao invés de **preencher os templates oficiais** da Equatorial GO.

**Código atual:**
```typescript
// Cria novo workbook do zero
const workbook = new ExcelJS.Workbook();
const worksheet = workbook.addWorksheet('Formulário');
```

**Abordagem correta:**
```typescript
// Deve carregar o template oficial e preencher
const workbook = new ExcelJS.Workbook();
await workbook.xlsx.readFile('templates/NT.00020-05-Anexo-I-...');
const worksheet = workbook.getWorksheet('1'); // Aba específica
// Preencher células específicas mantendo formatação
```

#### Falta de Mapeamento

O código não possui mapeamento das células específicas do template oficial. É necessário:

1. Identificar a célula exata de cada campo no template
2. Preservar toda a formatação existente
3. Preencher apenas os dados variáveis
4. Manter fórmulas e validações

#### Documentação Ausente

Não há documentação sobre:
- Quais células devem ser preenchidas em cada aba
- Quais campos são obrigatórios vs opcionais
- Quais campos possuem validação/dropdown
- Quais campos são calculados automaticamente

---

## 5. PLANO DE AÇÃO RECOMENDADO

### 5.1. Avaliação de Viabilidade

#### Opção 1: Corrigir Geradores Existentes (RECOMENDADO)

**Viabilidade:** ✅ **VIÁVEL**

**Esforço estimado:** Alto (40-60 horas de desenvolvimento)

**Abordagem:**
1. Carregar templates oficiais como base
2. Mapear todas as células que precisam ser preenchidas
3. Preservar 100% da formatação original
4. Implementar lógica de preenchimento célula por célula
5. Testar exaustivamente com casos reais

**Vantagens:**
- Garante conformidade total com templates oficiais
- Mantém todas as validações e fórmulas da Equatorial
- Reduz risco de rejeição a praticamente zero

**Desvantagens:**
- Trabalho manual intenso de mapeamento
- Código mais complexo e frágil (dependente de posições específicas)
- Manutenção difícil se a Equatorial atualizar templates

#### Opção 2: Reescrever do Zero

**Viabilidade:** ✅ **VIÁVEL** (mas não recomendado)

**Esforço estimado:** Muito Alto (80-100 horas)

**Abordagem:**
1. Engenharia reversa completa dos templates
2. Recriar toda a estrutura, formatação e lógica
3. Implementar todas as validações e fórmulas

**Vantagens:**
- Controle total sobre o código
- Possibilidade de otimizações

**Desvantagens:**
- Esforço muito maior
- Alto risco de divergências sutis
- Difícil garantir conformidade 100%

#### Opção 3: Desistir do Projeto

**Viabilidade:** ❌ **NÃO RECOMENDADO**

**Justificativa:** O problema é solucionável. A funcionalidade de automação é valiosa e o esforço de correção é justificável.

### 5.2. Recomendação Final

**✅ PROSSEGUIR COM OPÇÃO 1: Corrigir geradores usando templates oficiais como base**

**Justificativa:**
- É a abordagem mais segura para garantir conformidade
- Esforço é alto mas gerenciável
- Valor entregue ao usuário justifica o investimento
- Sistema já possui toda a lógica de negócio funcionando (cadastros, validações)

---

## 6. ROTEIRO DETALHADO DE CORREÇÃO

### 6.1. Fase 1: Mapeamento dos Templates (8-12 horas)

**Objetivo:** Documentar exatamente quais células devem ser preenchidas em cada template.

**Tarefas:**

1. **Formulário Excel (Anexo I)**
   - Criar planilha de mapeamento com colunas: Aba, Célula, Campo, Tipo, Obrigatório, Validação
   - Mapear todas as células editáveis da Aba 0 (Equipamentos)
   - Mapear todas as células editáveis da Aba 1 (Dados Cadastrais)
   - Mapear células da Aba 2 (Rateio) - se aplicável
   - Identificar células com fórmulas (não tocar)
   - Identificar células com validação/dropdown (preservar)

2. **Memorial Técnico Word (Anexo III)**
   - Identificar todos os placeholders/campos variáveis
   - Documentar estrutura de seções e subseções
   - Listar textos fixos vs variáveis
   - Mapear formatação de cada seção

3. **Diagrama Unifilar PDF**
   - Pesquisar exemplos reais de diagramas aprovados pela Equatorial
   - Identificar elementos obrigatórios
   - Definir layout padrão
   - Listar especificações técnicas necessárias

**Entregável:** Documento de mapeamento completo (Excel ou Markdown)

### 6.2. Fase 2: Implementação - Formulário Excel (16-20 horas)

**Arquivo:** `src/lib/generators/excelGenerator.ts` (novo arquivo)

**Tarefas:**

1. **Carregar template oficial**
   ```typescript
   const workbook = new ExcelJS.Workbook();
   await workbook.xlsx.readFile(TEMPLATE_PATH);
   ```

2. **Implementar preenchimento da Aba 0 (Equipamentos)**
   - Seção 1: Solar Fotovoltaica
     - Iterar sobre módulos do projeto
     - Preencher células: potência, quantidade, fabricante, modelo
     - Deixar células calculadas intactas (Potência de Pico, Área, TOTAL)
   - Seção 2: Dados dos Inversores
     - Iterar sobre inversores do projeto
     - Preencher células: fabricante, modelo, potência, tensão, corrente, FP, rendimento, DHT
     - Deixar célula TOTAL intacta

3. **Implementar preenchimento da Aba 1 (Dados Cadastrais)**
   - Seção 1: Identificação da UC
     - Preencher dados do cliente (nome, CPF, endereço, CEP, município, UF)
     - Preencher tipo de orçamento, tipo de solicitação, conta contrato
     - Preencher classe, tipo de ligação, tensão
     - Preencher carga declarada, disjuntor, potência disponibilizada
     - Preencher tipo de ramal, coordenadas
   - Seção 2: Responsável Técnico
     - Preencher nome, título, registro, UF
     - Preencher e-mail, telefones
   - Seção 3: Características da Microgeração
     - Preencher tipo de fonte, tipo de geração, enquadramento
     - Preencher data de início
     - Deixar campos calculados intactos (potência total, nº inversores, nº módulos, área)

4. **Implementar preenchimento da Aba 2 (Rateio) - se aplicável**
   - Verificar se projeto é Autoconsumo Remoto/Geração Compartilhada/EMUC
   - Se sim, preencher lista de UCs participantes

5. **Preservar Abas ROTEIRO e FONTES**
   - Não modificar essas abas

6. **Salvar arquivo**
   ```typescript
   await workbook.xlsx.writeFile(outputPath);
   ```

**Testes:**
- Gerar documento com dados reais
- Abrir no Excel e verificar:
  - Todas as fórmulas funcionando
  - Validações preservadas
  - Formatação intacta
  - Células calculadas corretas

### 6.3. Fase 3: Implementação - Memorial Técnico Word (12-16 horas)

**Arquivo:** `src/lib/generators/wordGenerator.ts` (reescrever)

**Tarefas:**

1. **Carregar template oficial**
   ```typescript
   const templateBuffer = fs.readFileSync(TEMPLATE_PATH);
   const zip = new PizZip(templateBuffer);
   const doc = new Docxtemplater(zip, {
     paragraphLoop: true,
     linebreaks: true,
   });
   ```

2. **Preparar dados para preenchimento**
   - Criar objeto com todos os campos variáveis
   - Formatar datas, números, listas

3. **Preencher template**
   - Usar placeholders no template: `{nomeCliente}`, `{cpf}`, etc.
   - Ou usar busca/substituição de texto específico

4. **Gerar seções dinâmicas**
   - Seção 4: LEVANTAMENTO DE CARGA (calcular com base nos dados)
   - Seção 6: ESTIMATIVA DE GERAÇÃO (calcular HSP × potência)
   - Seção 7: DIMENSIONAMENTO DO GERADOR (listar módulos)
   - Seção 8: DIMENSIONAMENTO DO INVERSOR (listar inversores)
   - Seção 9: DIMENSIONAMENTO DA PROTEÇÃO (calcular proteções)
   - Seção 10: DIMENSIONAMENTO DOS CABOS (calcular seções)

5. **Preservar formatação**
   - Manter cores, negritos, tamanhos de fonte
   - Manter estrutura de seções
   - Manter sumário (atualizar se possível)

6. **Salvar arquivo**
   ```typescript
   const buffer = doc.getZip().generate({ type: 'nodebuffer' });
   fs.writeFileSync(outputPath, buffer);
   ```

**Testes:**
- Gerar documento com dados reais
- Abrir no Word e verificar:
  - Formatação preservada
  - Todas as seções presentes
  - Cálculos corretos
  - Sumário atualizado

### 6.4. Fase 4: Implementação - Diagrama Unifilar PDF (12-16 horas)

**Arquivo:** `src/lib/generators/pdfGenerator.ts` (reescrever)

**Abordagem:** Usar biblioteca de desenho vetorial (pdf-lib ou canvas)

**Tarefas:**

1. **Criar layout base**
   - Cabeçalho com título e dados do cliente
   - Área de diagrama
   - Rodapé com responsável técnico e notas

2. **Desenhar lado CC (Corrente Contínua)**
   - Representar módulos fotovoltaicos (retângulos com símbolo solar)
   - Desenhar strings (linhas conectando módulos em série)
   - Adicionar caixas de junção (se houver)
   - Desenhar proteção CC (fusíveis, disjuntores, DPS)
   - Adicionar especificações (tensão, corrente, seção de cabo)

3. **Desenhar inversores**
   - Retângulos com símbolo de inversor
   - Especificações (modelo, potência)
   - Conexões entrada CC / saída CA

4. **Desenhar lado CA (Corrente Alternada)**
   - Quadro de proteção CA
   - Disjuntores por inversor
   - DPS CA
   - Especificações (tensão, corrente, seção de cabo)

5. **Desenhar medição e conexão à rede**
   - Medidor bidirecional
   - Ponto de conexão à rede da concessionária
   - Especificações

6. **Desenhar aterramento**
   - Sistema de aterramento
   - Hastes
   - Conexões

7. **Adicionar tabelas de especificações**
   - Tabela de módulos
   - Tabela de inversores
   - Tabela de cabos
   - Tabela de proteções

8. **Adicionar legenda**
   - Símbolos utilizados
   - Convenções

**Alternativa:** Se desenho vetorial for muito complexo, considerar:
- Gerar diagrama em formato SVG e converter para PDF
- Usar biblioteca de diagramas elétricos (se existir para Node.js)
- Gerar em HTML/Canvas e converter para PDF

**Testes:**
- Gerar diagrama com dados reais
- Verificar legibilidade
- Verificar conformidade com normas
- Validar com engenheiro eletricista

### 6.5. Fase 5: Testes e Validação (4-8 horas)

**Tarefas:**

1. **Testes unitários**
   - Atualizar testes existentes em `src/lib/documentGenerators.test.ts`
   - Adicionar testes para cada gerador
   - Verificar geração sem erros
   - Verificar estrutura dos arquivos

2. **Testes de integração**
   - Criar projeto completo no sistema
   - Gerar os 3 documentos
   - Abrir cada documento e verificar manualmente

3. **Validação com usuário**
   - Enviar documentos gerados para o usuário
   - Usuário valida se estão conformes com expectativas da Equatorial
   - Coletar feedback e ajustar

4. **Teste com submissão real (opcional)**
   - Se possível, submeter documentos gerados para a Equatorial
   - Verificar se são aceitos
   - Ajustar com base em feedback da concessionária

### 6.6. Fase 6: Documentação e Entrega (2-4 horas)

**Tarefas:**

1. **Documentar código**
   - Adicionar comentários explicativos
   - Documentar mapeamento de células
   - Documentar cálculos e fórmulas

2. **Atualizar README**
   - Documentar processo de geração de documentos
   - Adicionar exemplos
   - Listar requisitos e dependências

3. **Criar guia de manutenção**
   - Como atualizar se templates da Equatorial mudarem
   - Como adicionar novos campos
   - Como debugar problemas

4. **Checkpoint final**
   - Salvar checkpoint com todas as correções
   - Marcar tarefas como concluídas no todo.md

---

## 7. ESTIMATIVA DE ESFORÇO TOTAL

| Fase | Descrição | Horas Estimadas |
|------|-----------|-----------------|
| 1 | Mapeamento dos Templates | 8-12 |
| 2 | Implementação - Formulário Excel | 16-20 |
| 3 | Implementação - Memorial Técnico Word | 12-16 |
| 4 | Implementação - Diagrama Unifilar PDF | 12-16 |
| 5 | Testes e Validação | 4-8 |
| 6 | Documentação e Entrega | 2-4 |
| **TOTAL** | | **54-76 horas** |

**Estimativa conservadora:** 60-70 horas de trabalho focado

---

## 8. RISCOS E MITIGAÇÕES

### Risco 1: Templates da Equatorial podem mudar

**Probabilidade:** Média  
**Impacto:** Alto

**Mitigação:**
- Implementar código modular e bem documentado
- Manter mapeamento de células em arquivo separado (fácil de atualizar)
- Criar testes automatizados que detectem mudanças na estrutura
- Versionar templates oficiais

### Risco 2: Complexidade do diagrama unifilar

**Probabilidade:** Alta  
**Impacto:** Médio

**Mitigação:**
- Começar com layout simplificado mas completo
- Validar com engenheiro eletricista
- Considerar ferramentas especializadas de desenho elétrico
- Ter exemplos reais aprovados pela Equatorial como referência

### Risco 3: Casos especiais não cobertos

**Probabilidade:** Média  
**Impacto:** Médio

**Mitigação:**
- Implementar validações robustas
- Adicionar logs detalhados
- Criar mensagens de erro claras
- Documentar limitações conhecidas
- Permitir edição manual dos documentos gerados

### Risco 4: Performance com arquivos grandes

**Probabilidade:** Baixa  
**Impacto:** Baixo

**Mitigação:**
- Otimizar leitura/escrita de arquivos
- Usar streams quando possível
- Implementar cache se necessário

---

## 9. CONCLUSÃO

### Situação Atual

O sistema de automação de projetos solares está **90% completo** em termos de funcionalidade de negócio (cadastros, validações, banco de dados), mas os **documentos gerados estão 100% inadequados** para submissão à Equatorial GO.

### Viabilidade do Projeto

✅ **O PROJETO É VIÁVEL E VALE A PENA CONTINUAR**

**Justificativas:**
1. O problema é técnico e solucionável
2. A lógica de negócio já está implementada e funcionando
3. O esforço de correção (60-70 horas) é justificável pelo valor entregue
4. A automação economizará centenas de horas de trabalho manual no futuro
5. Reduzirá drasticamente erros e rejeições pela concessionária

### Próximos Passos Imediatos

1. **Decisão do usuário:** Confirmar se deseja prosseguir com a correção
2. **Priorização:** Definir ordem de implementação (Excel → Word → PDF)
3. **Início do mapeamento:** Começar Fase 1 imediatamente
4. **Validação incremental:** Gerar documentos a cada fase e validar

### Expectativa de Resultado

Após a implementação completa do plano de ação:
- ✅ Formulário Excel 100% conforme template oficial da Equatorial
- ✅ Memorial Técnico Word 100% conforme template oficial
- ✅ Diagrama Unifilar PDF conforme normas técnicas e padrões da concessionária
- ✅ Taxa de aceitação pela Equatorial GO próxima de 100%
- ✅ Sistema totalmente funcional e pronto para uso em produção

---

**Elaborado por:** Manus AI  
**Data:** 04/12/2025  
**Versão:** 1.0
