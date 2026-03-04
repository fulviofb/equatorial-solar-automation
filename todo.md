# TODO - Sistema de Automação de Projetos Solares Equatorial GO

## Fase 1: Estrutura de Dados e Backend
- [ ] Criar schema do banco de dados (clientes, projetos, equipamentos, responsáveis técnicos)
- [ ] Implementar rotas tRPC para CRUD de clientes
- [ ] Implementar rotas tRPC para CRUD de projetos
- [ ] Implementar rotas tRPC para CRUD de equipamentos (módulos e inversores)
- [ ] Implementar rotas tRPC para CRUD de responsáveis técnicos

## Fase 2: Geração de Documentos
- [ ] Implementar geração do Formulário Excel (Anexo I)
- [ ] Implementar geração do Memorial Técnico Word (Anexo III)
- [ ] Implementar geração do Diagrama Unifilar PDF
- [ ] Implementar geração do Diagrama de Blocos

## Fase 3: Interface do Usuário
- [ ] Criar página inicial com dashboard
- [ ] Criar formulário de cadastro de clientes
- [ ] Criar formulário de cadastro de projetos
- [ ] Criar biblioteca de equipamentos (módulos e inversores)
- [ ] Criar cadastro de responsáveis técnicos
- [ ] Implementar visualização e download dos documentos gerados

## Fase 4: Validações e Cálculos
- [ ] Implementar validação de potência de geração vs potência disponibilizada
- [ ] Implementar cálculos automáticos (potência de pico, área dos arranjos, etc.)
- [ ] Implementar validação de campos obrigatórios
- [ ] Implementar validação de coordenadas geográficas

## Fase 5: Testes e Refinamentos
- [ ] Testar geração de documentos com dados reais
- [ ] Validar formatação exata dos documentos
- [ ] Ajustar templates conforme necessário
- [ ] Documentar sistema para o usuário


## Progresso Atual
- [x] Schema do banco de dados criado
- [x] Rotas tRPC para clientes implementadas
- [x] Rotas tRPC para responsáveis técnicos implementadas
- [x] Interface de cadastro de clientes
- [x] Interface de cadastro de responsáveis técnicos
- [x] Interface de cadastro de módulos fotovoltaicos
- [x] Interface de cadastro de inversores
- [x] Interface de cadastro de projetos (formulário completo)
- [x] Interface de detalhes do projeto com botões de download
- [x] Validações automáticas de projeto
- [x] Vincular módulos e inversores aos projetos
- [x] Módulo de geração do Formulário Excel (Anexo I)
- [x] Módulo de geração do Memorial Técnico Word (Anexo III)
- [x] Módulo de geração do Diagrama Unifilar PDF

## Ajustes Solicitados
- [x] Ajustar campos do cadastro de inversores para corresponder às fichas técnicas reais
- [x] Atualizar labels e nomenclaturas dos campos de inversores

## Novas Melhorias
- [x] Adicionar campo de Eficiência EU (%) no cadastro de inversores
- [x] Implementar validação de compatibilidade módulo-inversor
- [x] Criar funcionalidade de importação de dados de datasheets PDF

## Implementação Adicional
- [x] Adicionar funcionalidade de importação de datasheet para módulos fotovoltaicos

## Correções
- [x] Corrigir erro de tags <a> aninhadas na página Home

## Correções Urgentes
- [x] Corrigir erro de parsing de datasheet (Unexpected token '.' is not valid JSON)

## Debug Urgente
- [x] Investigar erro persistente de JSON no parser de datasheet
- [x] Verificar endpoint tRPC de parseDatasheet
- [x] Testar parser diretamente com PDF do Tsuness
- [x] Aumentar limite de tamanho de upload (erro 413 Payload Too Large)

## Correção Crítica
- [x] Substituir pdftotext por biblioteca JavaScript (pdf-parse) para funcionar em produção
- [x] Adicionar limite de 5MB no frontend para upload de datasheets
- [ ] Testar parser com PDF reduzido

## Correção Urgente - Servidor Travando
- [x] Remover pdf-parse que está causando erro ENOENT ao iniciar
- [x] Implementar solução alternativa para parsing de PDF (pdftotext + LLM)

## Bug Reportado - Erro ao Atualizar Inversor
- [x] Corrigir erro "Invalid input: expected number, received undefined" no campo id ao atualizar inversor

## Bug Reportado - Validação Incorreta para Microinversores
- [x] Adicionar campo "isMicroinverter" (boolean) no schema de inversores
- [x] Adicionar checkbox "É microinversor?" no formulário de cadastro
- [x] Ajustar validação de compatibilidade para microinversores (tensão individual por saída)
- [x] Testar com Tsuness MX3000D (6 saídas, 3000W)

## Bug Urgente - Checkbox de Microinversor Não Aparece
- [x] Verificar por que o checkbox "É microinversor?" não está sendo renderizado no formulário
- [x] Corrigir o código do formulário de inversores
- [x] Atualizar inversor Tsuness MX3000D marcando como microinversor

## Bug Crítico - Validação de Microinversor Não Funciona no Projeto
- [x] Investigar por que a validação ainda calcula tensão em série (288V) para microinversor
- [x] Verificar se o campo isMicroinverter está sendo passado corretamente para a função de validação
- [x] Corrigir lógica de validação para detectar microinversor no contexto do projeto

## Bug Persistente - Erro de Validação Ainda Aparece
- [x] Verificar se o inversor está sendo carregado corretamente do banco com isMicroinverter
- [x] Verificar se o frontend está enviando os campos corretos na requisição de validação
- [x] Adicionar campos isMicroinverter e maxCurrentPerInput no ProjectForm.tsx

## Debug Urgente - Validação Ainda Falha
- [x] Adicionar logs no frontend para ver dados enviados na validação
- [x] Adicionar logs no backend para ver dados recebidos
- [x] Melhorar conversão de isMicroinverter usando Boolean()
- [ ] Aguardando teste do usuário com logs de debug

## Bug - Erro 404 ao Ver Detalhes do Projeto
- [x] Verificar se a rota /projetos/:id existe no App.tsx
- [x] Criar página de detalhes do projeto se não existir (Refatorado ProjectDetails.tsx para arrumar extração de ID da URL e adicionar detalhes completos de componentes)
- [x] Testar navegação para detalhes do projeto

## Permitir Edição em Projetos
- [x] Mudar validação de oversizing de 'error' para 'warning'
- [x] Permitir salvar projeto mesmo com warnings (apenas bloquear em caso de errors)
- [x] Adicionar rota /projetos/:id/editar (Já implementado)
- [x] Criar página de edição de projeto (Resolvido reutilizando ProjectForm)
- [x] Testar fluxo completo com microinversor

## CRÍTICO - Documentos Gerados Não Correspondem aos Templates da Equatorial
- [x] Analisar documentos gerados atualmente (Excel, Word, PDF)
- [x] Comparar com templates oficiais da Equatorial GO
- [x] Identificar todas as diferenças
- [x] Avaliar viabilidade de ajuste vs reescrita completa
- [x] Apresentar plano de ação detalhado

## URGENTE - Python não encontrado em produção
- [x] Diagnosticar qual Python está disponível no ambiente de produção
- [x] Migrar geradores para Node.js (exceljs + docxtemplater)
- [x] Excel funcionando perfeitamente
- [x] Implementar gerador Word com substituição direta (fallback)
- [x] Testar geração de documentos via interface web
- [x] Validar Excel e Word funcionando 100%

## Otimização - Corrigir Template Word para Docxtemplater
- [x] Extrair XML do template Word atual
- [x] Identificar tags quebradas por formatação
- [x] Limpar formatações ocultas das tags
- [x] Configurar delimitadores duplos {{}} no docxtemplater
- [x] Testar docxtemplater com novo template
- [x] Validar performance melhorada - SUCESSO!
