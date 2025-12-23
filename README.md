# Sistema de Automação - Projetos Solares Equatorial GO

Sistema web completo para automatizar o cadastro de projetos de energia solar fotovoltaica na concessionária Equatorial GO, gerando automaticamente os documentos exigidos no formato correto.

## 📋 Sobre o Projeto

Este sistema foi desenvolvido para eliminar o trabalho manual de preenchimento dos documentos técnicos exigidos pela Equatorial GO para aprovação de projetos de microgeração distribuída (energia solar fotovoltaica).

### Documentos Gerados Automaticamente

1. **Formulário Excel (Anexo I)** - NT.00020-05
   - Formulário de Solicitação de Orçamento de Microgeração Distribuída Grupo B
   
2. **Memorial Técnico Word (Anexo III)** - NT.00020.EQTL-05
   - Memorial Técnico Descritivo completo do sistema fotovoltaico

3. **Diagrama Unifilar PDF**
   - Representação gráfica do sistema elétrico

## 🚀 Funcionalidades

### Gestão Completa
- ✅ Cadastro de Clientes (CPF/CNPJ, endereço, dados cadastrais)
- ✅ Cadastro de Responsáveis Técnicos (CREA/CFT, contatos)
- ✅ Biblioteca de Módulos Fotovoltaicos (especificações técnicas)
- ✅ Biblioteca de Inversores (incluindo microinversores)
- ✅ Gestão de Projetos (vinculação de equipamentos e validações)

### Validações Automáticas
- ✅ Compatibilidade módulo-inversor (tensão, corrente, potência)
- ✅ Suporte para microinversores (validação individual por saída)
- ✅ Validação de oversizing (até 150%, warning não bloqueante)
- ✅ Validação de subdimensionamento
- ✅ Verificação de número de strings vs MPPTs

### Importação de Dados
- ✅ Importação automática de datasheets PDF (módulos e inversores)
- ✅ Extração inteligente de especificações técnicas
- ✅ Solução híbrida: pdftotext (dev) + LLM Manus Forge (produção)

## 🛠️ Tecnologias

### Backend
- **Node.js** + **TypeScript**
- **tRPC** - Type-safe API
- **Express** - Servidor HTTP
- **Drizzle ORM** - Database ORM
- **MySQL/TiDB** - Banco de dados

### Frontend
- **React 19** - Interface do usuário
- **Tailwind CSS 4** - Estilização
- **shadcn/ui** - Componentes UI
- **Wouter** - Roteamento

### Geração de Documentos
- **ExcelJS** - Geração de planilhas Excel
- **docx** - Geração de documentos Word
- **pdf-lib** - Geração de PDFs

## 📦 Instalação

```bash
# Clonar repositório
git clone https://github.com/fulviofb/equatorial-solar-automation.git
cd equatorial-solar-automation

# Instalar dependências
pnpm install

# Configurar banco de dados
pnpm db:push

# Iniciar servidor de desenvolvimento
pnpm dev
```

## 🔧 Configuração

O sistema utiliza variáveis de ambiente gerenciadas pela plataforma Manus. As seguintes variáveis são injetadas automaticamente:

- `DATABASE_URL` - String de conexão do banco de dados
- `JWT_SECRET` - Segredo para assinatura de tokens
- `OAUTH_SERVER_URL` - URL do servidor OAuth
- Outras variáveis de sistema (ver `server/_core/env.ts`)

## 📊 Status do Projeto

### ✅ Implementado (90%)

- Sistema CRUD completo para todas as entidades
- Validações técnicas de compatibilidade
- Suporte para microinversores
- Importação de datasheets PDF
- Interface completa e responsiva
- Geração automática de documentos

### ⚠️ Pendente - CRÍTICO

**IMPORTANTE:** Os documentos gerados atualmente **NÃO estão conformes** com os templates oficiais da Equatorial GO.

**Problema identificado:**
- O sistema está criando documentos do zero ao invés de preencher os templates oficiais
- Faltam seções, formatações e estruturas obrigatórias
- Alto risco de rejeição pela concessionária

**Solução planejada:**
- Reescrever geradores para carregar e preencher templates oficiais
- Preservar 100% da formatação original
- Esforço estimado: 60-70 horas

**Documentação completa da análise:**
- Ver: `docs-analise/RELATORIO_ANALISE_COMPLETO.md`

## 📁 Estrutura do Projeto

```
equatorial-solar-automation/
├── client/                    # Frontend React
│   ├── src/
│   │   ├── pages/            # Páginas da aplicação
│   │   ├── components/       # Componentes reutilizáveis
│   │   ├── lib/              # Utilitários e configurações
│   │   └── App.tsx           # Componente raiz
├── server/                    # Backend Node.js
│   ├── routers.ts            # Rotas tRPC
│   ├── db.ts                 # Queries do banco de dados
│   ├── templates/            # Templates oficiais da Equatorial
│   ├── parsers/              # Parsers de datasheets
│   └── _core/                # Infraestrutura (não editar)
├── drizzle/                   # Schema e migrações do banco
├── shared/                    # Tipos e constantes compartilhadas
├── docs-analise/             # Análise de conformidade dos documentos
└── todo.md                   # Lista de tarefas do projeto
```

## 🧪 Testes

```bash
# Executar testes unitários
pnpm test

# Executar testes em modo watch
pnpm test:watch
```

## 📝 Próximos Passos

1. **Fase 1: Mapeamento dos Templates** (8-12h)
   - Documentar células específicas de cada template
   
2. **Fase 2: Implementação - Formulário Excel** (16-20h)
   - Carregar template oficial e preencher células
   
3. **Fase 3: Implementação - Memorial Técnico Word** (12-16h)
   - Preencher template mantendo formatação
   
4. **Fase 4: Implementação - Diagrama Unifilar PDF** (12-16h)
   - Criar diagrama técnico completo
   
5. **Fase 5: Testes e Validação** (4-8h)
   - Validar documentos gerados
   
6. **Fase 6: Documentação** (2-4h)
   - Documentar código e processo

## 👤 Autor

**Fúlvio Ferreira Borges**  
Técnico em Eletrotécnica  
CREA-GO: 0212721133  
Email: fulvio@fotonengenharia.com

## 📄 Licença

Este projeto é privado e de uso exclusivo da Foton Engenharia.

## 🔗 Links Úteis

- [Repositório GitHub](https://github.com/fulviofb/equatorial-solar-automation)
- [Documentação Equatorial GO](https://www.equatorialenergia.com.br/goias/)
- [Normas ANEEL](https://www.aneel.gov.br/)

---

**Nota:** Este sistema está em desenvolvimento ativo. Para análise completa do status atual, consulte `docs-analise/RELATORIO_ANALISE_COMPLETO.md`.
