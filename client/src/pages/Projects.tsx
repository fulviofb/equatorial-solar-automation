import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Plus, Search, Eye, Download, Trash2, Edit } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Projects() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: projects, isLoading } = trpc.projects.list.useQuery();
  const utils = trpc.useUtils();

  const deleteMutation = trpc.projects.delete.useMutation({
    onSuccess: () => {
      utils.projects.list.invalidate();
      toast.success("Projeto excluído com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir projeto: " + error.message);
    },
  });

  const generateExcelMutation = trpc.documents.generateExcel.useMutation({
    onSuccess: (data) => {
      const blob = new Blob(
        [Uint8Array.from(atob(data.data), c => c.charCodeAt(0))],
        { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Formulário Excel gerado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao gerar Excel: " + error.message);
    },
  });

  const generateWordMutation = trpc.documents.generateWord.useMutation({
    onSuccess: (data) => {
      const blob = new Blob(
        [Uint8Array.from(atob(data.data), c => c.charCodeAt(0))],
        { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Memorial Técnico gerado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao gerar Word: " + error.message);
    },
  });

  const generatePDFMutation = trpc.documents.generatePDF.useMutation({
    onSuccess: (data) => {
      const blob = new Blob(
        [Uint8Array.from(atob(data.data), c => c.charCodeAt(0))],
        { type: 'application/pdf' }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Diagrama Unifilar gerado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao gerar PDF: " + error.message);
    },
  });

  const filtered = projects?.filter((project) =>
    project.id.toString().includes(searchTerm) ||
    project.accountContract?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "RASCUNHO": return "bg-gray-100 text-gray-800";
      case "COMPLETO": return "bg-blue-100 text-blue-800";
      case "ENVIADO": return "bg-yellow-100 text-yellow-800";
      case "APROVADO": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Projetos</h1>
            <p className="text-gray-600 mt-1">
              Gerencie os projetos de microgeração distribuída
            </p>
          </div>
          <Button onClick={() => setLocation("/projetos/novo")}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Projeto
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Lista de Projetos</CardTitle>
                <CardDescription>
                  {projects?.length || 0} projeto(s) cadastrado(s)
                </CardDescription>
              </div>
              <div className="w-72">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por ID, conta contrato ou status..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filtered && filtered.length > 0 ? (
              <div className="space-y-4">
                {filtered.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-900">
                          Projeto #{project.id}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                          {project.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                        <span>{project.primarySourceType}</span>
                        <span>•</span>
                        <span>{project.classification}</span>
                        <span>•</span>
                        <span>{(project.totalInstalledPower / 1000).toFixed(2)} kWp</span>
                        {project.accountContract && (
                          <>
                            <span>•</span>
                            <span>CC: {project.accountContract}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLocation(`/projetos/${project.id}/editar`)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLocation(`/projetos/${project.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Detalhes
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-1" />
                            Documentos
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => generateExcelMutation.mutate({ projectId: project.id })}
                            disabled={generateExcelMutation.isPending}
                          >
                            📊 Formulário Excel
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => generateWordMutation.mutate({ projectId: project.id })}
                            disabled={generateWordMutation.isPending}
                          >
                            📄 Memorial Técnico
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => generatePDFMutation.mutate({ projectId: project.id })}
                            disabled={generatePDFMutation.isPending}
                          >
                            📐 Diagrama Unifilar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm("Tem certeza que deseja excluir este projeto?")) {
                            deleteMutation.mutate({ id: project.id });
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">
                  {searchTerm
                    ? "Nenhum projeto encontrado."
                    : "Nenhum projeto cadastrado ainda."}
                </p>
                {!searchTerm && (
                  <Button onClick={() => setLocation("/projetos/novo")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Primeiro Projeto
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
