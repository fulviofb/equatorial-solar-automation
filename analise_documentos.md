# Análise dos Documentos da Equatorial GO

## Documentos Analisados

### 1. Formulário de Solicitação de Orçamento (Excel)
**Arquivo:** NT.00020-05-Anexo-I-Formulario-de-Solicitacao-de-Orcamento-de-Microgeracao-Distribuida-Grupo-BHerikson.xlsx

**Estrutura:**
- **GUIA 0 - Informações das Unidades Geradoras:**
  - Seção 1: Solar Fotovoltaica (arranjos de módulos)
  - Seção 2: Dados dos Inversores (até 30 inversores)
  - Seções 3-5: Outras fontes (Eólica, Hidráulica, Biomassa)

- **GUIA 1 - Dados Cadastrais e Características:**
  - Seção 1: Identificação e Dados Cadastrais da UC
  - Seção 2: Dados do Responsável Técnico
  - Seção 3: Características da Microgeração Distribuída

- **GUIA 2 - Lista de Rateio:**
  - Para casos de Autoconsumo Remoto, Geração Compartilhada e EMUC

**Campos Principais Identificados:**
- Nome do Cliente/Razão Social
- CPF/CNPJ
- Endereço completo
- Conta Contrato
- Classe de consumo
- Tipo de ligação (Monofásico/Bifásico/Trifásico)
- Tensão de atendimento
- Potência disponibilizada
- Tipo de fonte primária
- Enquadramento (Autoconsumo Local/Remoto, Geração Compartilhada, EMUC)
- Dados dos módulos fotovoltaicos (fabricante, modelo, potência, quantidade)
- Dados dos inversores (fabricante, modelo, potência, quantidade)
- Coordenadas geográficas (UTM)

### 2. Memorial Técnico Descritivo (Word)
**Arquivo:** NT.00020.EQTL-05-Anexo-III-Modelo-de-Memorial-Tecnico-DescritivoHerikson).docx

**Estrutura do Documento (12 páginas):**
1. Objetivo
2. Referências Normativas e Regulatória
3. Dados da Unidade Consumidora
4. Levantamento de Carga
5. Padrão de Entrada
6. Estimativa de Geração
7. Dimensionamento do Gerador
8. Dimensionamento do Inversor
9. Dimensionamento da Proteção
10. Dimensionamento dos Cabos
11. Placa de Advertência
12. Anexos

**Informações Técnicas Detalhadas:**
- Tabelas de características técnicas dos equipamentos
- Cálculos de potência disponibilizada
- Especificações de proteção (disjuntores, DPS, fusíveis)
- Requisitos de aterramento
- Normas ABNT e ANEEL aplicáveis

### 3. Diagrama Unifilar (PDF)
**Arquivo:** PROJETOFOXESSMICRO-hERIKSONl.pdf

**Conteúdo:**
- Diagrama unifilar do sistema fotovoltaico
- Localização da unidade consumidora (mapa)
- Detalhes das strings de módulos (STRING01, STRING02)
- Esquema de conexão dos inversores
- Quadro geral de distribuição
- Detalhes das placas de advertência
- Notas obrigatórias sobre instalação
- Legenda e especificação dos equipamentos

### 4. Diagrama de Blocos (Excel)
**Arquivo:** DiagramadeBlocos-Herikson.xlsx

**Conteúdo:**
- Representação em blocos do sistema
- Fluxo de energia desde os painéis até a rede
- Conexões entre componentes

### 5. Datasheet do Inversor (PDF)
**Arquivo:** DATASHEET_MINVFX_MO_220V_2.5KW.pdf

**Especificações Técnicas:**
- Modelo: FOXESS Q Series (Q1-2500-E)
- Potência nominal: 2.5kW
- Tensão de entrada: 23.5-60V
- Corrente nominal AC: 11.36A
- Eficiência máxima: 95.5%
- Proteções integradas
- Certificações: IEC62109-1/2, PORTARIA Nº 140 2022

## Dados do Projeto Exemplo (Herikson)

**Cliente:** HERIKSON DE MORAIS SANTIAGO
**CPF:** 017.900.191-41
**Conta Contrato:** 10039487472
**Endereço:** ALA LANTANA, QD. Q, L. 19, S/N, COND. ALPHAVILLE ANÁPOLIS, ANÁPOLIS - GO
**Classe:** Residencial
**Tipo de Ligação:** Trifásico
**Tensão:** 380V
**Potência Disponibilizada:** 38 kW
**Disjuntor de Entrada:** 63A

**Sistema Fotovoltaico:**
- **Potência Total:** 11,20 kWp
- **Módulos:** 16 unidades TRINA TSM-NEG21C.20 de 700W
- **Inversores:** 4 unidades FOXESS Q1-2500-E de 2.5kW
- **Enquadramento:** Autoconsumo Remoto
- **Tipo de Ramal:** Subterrâneo

**Responsável Técnico:**
- Nome: Fúlvio Ferreira Borges
- Título: Técnico em Eletrotécnica
- Registro: 2012721113 (GO)
- Email: fulvio@fotonengenharia.com

## Padrões Identificados

### Formatação e Estrutura
1. **Excel:** Células com validação de dados, fórmulas automáticas, campos obrigatórios em vermelho
2. **Word:** Formatação específica com tabelas, cabeçalhos, rodapés, numeração de páginas
3. **PDF:** Diagramas técnicos com layout específico, legendas, notas obrigatórias

### Campos Calculados Automaticamente
- Potência de pico total (kWp)
- Área total dos arranjos
- Potência disponibilizada (PD)
- Totais de inversores e módulos

### Validações e Regras
- Potência de geração ≤ Potência disponibilizada
- Campos obrigatórios por tipo de fonte
- Coordenadas geográficas em formato UTM
- Conformidade com normas ABNT e ANEEL

## Oportunidades de Automação

### Alta Prioridade
1. **Preenchimento automático do Formulário Excel**
   - Entrada de dados via interface web
   - Preenchimento automático das guias 0, 1 e 2
   - Validação de dados em tempo real
   - Geração do arquivo Excel final

2. **Geração automática do Memorial Técnico**
   - Template do Word com campos variáveis
   - Preenchimento automático de tabelas
   - Cálculos automáticos de dimensionamento
   - Exportação em formato .docx

3. **Geração do Diagrama Unifilar**
   - Template parametrizável
   - Ajuste automático de strings e inversores
   - Geração de PDF final

### Média Prioridade
4. **Banco de dados de equipamentos**
   - Cadastro de módulos fotovoltaicos
   - Cadastro de inversores
   - Datasheets associados
   - Busca e seleção rápida

5. **Gestão de projetos**
   - Cadastro de clientes
   - Histórico de projetos
   - Status de aprovação
   - Documentos gerados

### Baixa Prioridade
6. **Integração com APIs**
   - Consulta de dados cadastrais
   - Validação de conta contrato
   - Envio automático para Equatorial

## Tecnologias Recomendadas

### Backend
- **Python/FastAPI** ou **Node.js/Express**
- **Bibliotecas:**
  - `openpyxl` ou `xlsxwriter` (manipulação de Excel)
  - `python-docx` (manipulação de Word)
  - `reportlab` ou `weasyprint` (geração de PDF)
  - `Pillow` (manipulação de imagens)

### Frontend
- **React** ou **Vue.js**
- **Formulários dinâmicos** com validação
- **Upload de datasheets**
- **Preview de documentos**

### Banco de Dados
- **PostgreSQL** ou **MySQL**
- Tabelas: clientes, projetos, equipamentos, responsáveis técnicos

### Armazenamento
- **Sistema de arquivos** para documentos gerados
- **S3** ou similar para backup

## Próximos Passos

1. Definir escopo exato da automação
2. Criar protótipo da interface de entrada de dados
3. Desenvolver módulo de geração do Excel
4. Desenvolver módulo de geração do Word
5. Desenvolver módulo de geração do PDF (diagrama)
6. Testes com casos reais
7. Ajustes e validação com a Equatorial GO
