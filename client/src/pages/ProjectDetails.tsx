import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, FileSpreadsheet, Download, ArrowLeft, Edit } from "lucide-react";
import { toast } from "sonner";

export default function ProjectDetails() {
  const [location, setLocation] = useLocation();
  const projectIdMatch = location.match(/\/projetos\/(\d+)(?!\/editar)/);
  const projectId = projectIdMatch ? parseInt(projectIdMatch[1], 10) : null;

  const { data: project, isLoading } = trpc.projects.getById.useQuery(
    { id: projectId! },
    { enabled: !!projectId }
  );

  const { data: client } = trpc.clients.getById.useQuery(
    { id: project?.clientId! },
    { enabled: !!project?.clientId }
  );

  const { data: technicalResponsible } = trpc.technicalResponsibles.getById.useQuery(
    { id: project?.technicalResponsibleId! },
    { enabled: !!project?.technicalResponsibleId }
  );

  const { data: solarModules } = trpc.solarModules.list.useQuery();
  const { data: invertersList } = trpc.inverters.list.useQuery();

  const generateExcel = trpc.documents.generateExcel.useMutation({
    onSuccess: (result: { data: string; filename: string }) => {
      // Download do arquivo
      const link = document.createElement('a');
      link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${result.data}`;
      link.download = result.filename;
      link.click();
      toast.success("Excel gerado com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao gerar Excel: ${error.message}`);
    }
  });

  const generateWord = trpc.documents.generateWord.useMutation({
    onSuccess: (result: { data: string; filename: string }) => {
      const link = document.createElement('a');
      link.href = `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${result.data}`;
      link.download = result.filename;
      link.click();
      toast.success("Memorial Técnico gerado com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao gerar Word: ${error.message}`);
    }
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout>
        <div className="container py-8 flex flex-col items-center">
          <h1 className="text-2xl font-bold mb-4">Projeto não encontrado</h1>
          <Button onClick={() => setLocation("/projetos")}>Voltar para Projetos</Button>
        </div>
      </DashboardLayout>
    );
  }

  const statusColors: Record<string, string> = {
    "RASCUNHO": "bg-gray-500",
    "EM_ANALISE": "bg-blue-500",
    "APROVADO": "bg-green-500",
    "REJEITADO": "bg-red-500",
    "INSTALADO": "bg-purple-500"
  };

  return (
    <DashboardLayout>
      <div className="container py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/projetos")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold">Projeto #{project.id}</h1>
                <Badge className={statusColors[project.status] || "bg-gray-500"}>
                  {project.status.replace("_", " ")}
                </Badge>
              </div>
              <p className="text-muted-foreground">{project.primarySourceType} - {project.classification}</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => setLocation(`/projetos/${project.id}/editar`)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar Projeto
          </Button>
        </div>

        {/* Informações Básicas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Dados Gerais</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Cliente</p>
                <p className="font-semibold">{client?.name || "Carregando..."}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Responsável Técnico</p>
                <p className="font-semibold">{technicalResponsible?.name || "Carregando..."}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Potência Total</p>
                <p className="font-semibold">{(project.totalInstalledPower / 1000).toFixed(2)} kWp</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tipo de Conexão</p>
                <p className="font-semibold">{project.connectionType}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tensão de Atendimento</p>
                <p className="font-semibold">{project.serviceVoltage}V</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data de Criação</p>
                <p className="font-semibold">{new Date(project.createdAt).toLocaleDateString('pt-BR')}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Equipamentos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-2">Módulos Fotovoltaicos</h4>
                {project.moduleArrays && project.moduleArrays.length > 0 ? (
                  <ul className="space-y-1">
                    {project.moduleArrays.map((arr, idx) => {
                      const moduleObj = solarModules?.find(m => m.id === arr.solarModuleId);
                      return (
                        <li key={idx} className="text-sm">
                          {arr.quantity}x {moduleObj ? `${moduleObj.manufacturer} ${moduleObj.model} (${moduleObj.nominalPower}W)` : 'Carregando...'}
                        </li>
                      )
                    })}
                  </ul>
                ) : <p className="text-sm text-gray-500">Nenhum módulo cadastrado.</p>}
              </div>

              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-2">Inversores</h4>
                {project.inverters && project.inverters.length > 0 ? (
                  <ul className="space-y-1">
                    {project.inverters.map((inv, idx) => {
                      const invObj = invertersList?.find(i => i.id === inv.inverterId);
                      return (
                        <li key={idx} className="text-sm">
                          {inv.quantity}x {invObj ? `${invObj.manufacturer} ${invObj.model} (${invObj.nominalPowerAC / 1000}kW)` : 'Carregando...'}
                        </li>
                      )
                    })}
                  </ul>
                ) : <p className="text-sm text-gray-500">Nenhum inversor cadastrado.</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rateio (Se aplicável) */}
        {project.ratioList && project.ratioList.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Lista de Rateio de Créditos</CardTitle>
              <CardDescription>Beneficiárias cadastradas neste projeto</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {project.ratioList.map((ratio, idx) => (
                  <div key={idx} className="p-3 border rounded-md">
                    <p className="text-sm text-muted-foreground">Conta Contrato</p>
                    <p className="font-semibold">{ratio.targetUnit || ratio.accountContract}</p>
                    <p className="text-sm text-muted-foreground mt-2">Porcentagem</p>
                    <p className="font-semibold">{ratio.percentage || ratio.percentageKwh}%</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Geração de Documentos */}
        <Card>
          <CardHeader>
            <CardTitle>Documentos do Projeto</CardTitle>
            <CardDescription>
              Gere os documentos necessários para submissão à Equatorial GO
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {/* Excel - Anexo I */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <FileSpreadsheet className="h-8 w-8 text-green-600" />
                  <div>
                    <CardTitle className="text-lg">Formulário (Anexo I)</CardTitle>
                    <CardDescription className="text-sm">
                      Planilha Excel com dados técnicos
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  onClick={() => generateExcel.mutate({ projectId: project.id })}
                  disabled={generateExcel.isPending}
                >
                  {generateExcel.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Gerar Excel
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Word - Memorial Técnico */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div>
                    <CardTitle className="text-lg">Memorial Técnico</CardTitle>
                    <CardDescription className="text-sm">
                      Documento Word descritivo completo
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  onClick={() => generateWord.mutate({ projectId: project.id })}
                  disabled={generateWord.isPending}
                >
                  {generateWord.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Gerar Word
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
}
