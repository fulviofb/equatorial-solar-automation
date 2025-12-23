import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, FileSpreadsheet, Download, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function ProjectDetails() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const projectId = params.id ? parseInt(params.id) : null;

  const { data: project, isLoading } = trpc.projects.getById.useQuery(
    { id: projectId! },
    { enabled: !!projectId }
  );

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
        <div className="container py-8">
          <h1 className="text-2xl font-bold">Projeto não encontrado</h1>
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
              <h1 className="text-3xl font-bold">Projeto #{project.id}</h1>
              <p className="text-muted-foreground">SOLAR FOTOVOLTAICA - AUTOCONSUMO LOCAL</p>
            </div>
          </div>
          <Badge className={statusColors[project.status] || "bg-gray-500"}>
            {project.status.replace("_", " ")}
          </Badge>
        </div>

        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do Projeto</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Potência Total</p>
              <p className="text-lg font-semibold">{(project.totalInstalledPower / 1000).toFixed(2)} kWp</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tipo de Conexão</p>
              <p className="text-lg font-semibold">{project.connectionType}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tipo de Conexão</p>
              <p className="text-lg font-semibold">{project.connectionType}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Data de Criação</p>
              <p className="text-lg font-semibold">{new Date(project.createdAt).toLocaleDateString('pt-BR')}</p>
            </div>
          </CardContent>
        </Card>

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
                <FileSpreadsheet className="h-8 w-8 text-green-600 mb-2" />
                <CardTitle className="text-lg">Formulário (Anexo I)</CardTitle>
                <CardDescription className="text-sm">
                  Planilha Excel com dados técnicos do projeto
                </CardDescription>
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
                <FileText className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle className="text-lg">Memorial Técnico</CardTitle>
                <CardDescription className="text-sm">
                  Documento Word com descrição técnica completa
                </CardDescription>
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
