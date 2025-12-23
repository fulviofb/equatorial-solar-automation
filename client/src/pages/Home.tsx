import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Briefcase, Users, FileText, Zap, Cpu, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { data: projects, isLoading: loadingProjects } = trpc.projects.list.useQuery();
  const { data: clients, isLoading: loadingClients } = trpc.clients.list.useQuery();
  const { data: technicalResponsibles, isLoading: loadingTechnicalResponsibles } = trpc.technicalResponsibles.list.useQuery();
  const { data: solarModules, isLoading: loadingModules } = trpc.solarModules.list.useQuery();
  const { data: inverters, isLoading: loadingInverters } = trpc.inverters.list.useQuery();

  const stats = [
    {
      title: "Projetos",
      value: projects?.length || 0,
      icon: Briefcase,
      description: "Total de projetos cadastrados",
      href: "/projetos",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      loading: loadingProjects,
    },
    {
      title: "Clientes",
      value: clients?.length || 0,
      icon: Users,
      description: "Clientes cadastrados",
      href: "/clientes",
      color: "text-green-600",
      bgColor: "bg-green-50",
      loading: loadingClients,
    },
    {
      title: "Responsáveis Técnicos",
      value: technicalResponsibles?.length || 0,
      icon: FileText,
      description: "Profissionais cadastrados",
      href: "/responsaveis",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      loading: loadingTechnicalResponsibles,
    },
    {
      title: "Módulos Fotovoltaicos",
      value: solarModules?.length || 0,
      icon: Zap,
      description: "Modelos de módulos",
      href: "/modulos",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      loading: loadingModules,
    },
    {
      title: "Inversores",
      value: inverters?.length || 0,
      icon: Cpu,
      description: "Modelos de inversores",
      href: "/inversores",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      loading: loadingInverters,
    },
  ];

  const recentProjects = projects?.slice(0, 5) || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Bem-vindo ao sistema de automação de projetos solares da Equatorial GO
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link key={stat.title} href={stat.href}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {stat.title}
                      </CardTitle>
                      <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                        <Icon className={`h-4 w-4 ${stat.color}`} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      {stat.loading ? (
                        <div className="h-8 w-16 bg-gray-200 animate-pulse rounded" />
                      ) : (
                        <div className="text-2xl font-bold">{stat.value}</div>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {stat.description}
                      </p>
                    </CardContent>
                  </Card>
              </Link>
            );
          })}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>
              Comece criando os cadastros básicos ou inicie um novo projeto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link href="/projetos">
                <Button className="w-full" size="lg">
                  <Briefcase className="mr-2 h-5 w-5" />
                  Novo Projeto
                </Button>
              </Link>
              <Link href="/clientes">
                <Button variant="outline" className="w-full" size="lg">
                  <Users className="mr-2 h-5 w-5" />
                  Cadastrar Cliente
                </Button>
              </Link>
              <Link href="/modulos">
                <Button variant="outline" className="w-full" size="lg">
                  <Zap className="mr-2 h-5 w-5" />
                  Adicionar Módulo
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Projects */}
        {recentProjects.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Projetos Recentes</CardTitle>
                  <CardDescription>
                    Últimos projetos cadastrados no sistema
                  </CardDescription>
                </div>
                <Link href="/projetos">
                  <Button variant="ghost" size="sm">
                    Ver todos
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <Briefcase className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          Projeto #{project.id}
                        </p>
                        <p className="text-sm text-gray-500">
                          {project.primarySourceType} - {project.classification}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {(project.totalInstalledPower / 1000).toFixed(2)} kWp
                        </p>
                        <p className="text-xs text-gray-500">{project.status}</p>
                      </div>
                      <Link href={`/projetos/${project.id}`}>
                        <Button variant="ghost" size="sm">
                          Ver detalhes
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Getting Started */}
        {projects?.length === 0 && (
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle>Comece Agora!</CardTitle>
                  <CardDescription className="text-gray-700">
                    Siga estes passos para criar seu primeiro projeto
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                <li className="flex items-start space-x-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-semibold">
                    1
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">
                      Cadastre os equipamentos
                    </p>
                    <p className="text-sm text-gray-600">
                      Adicione módulos fotovoltaicos e inversores à biblioteca
                    </p>
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-semibold">
                    2
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">
                      Cadastre clientes e responsáveis técnicos
                    </p>
                    <p className="text-sm text-gray-600">
                      Adicione os dados dos clientes e profissionais responsáveis
                    </p>
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-semibold">
                    3
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">Crie um projeto</p>
                    <p className="text-sm text-gray-600">
                      Configure o projeto e gere os documentos automaticamente
                    </p>
                  </div>
                </li>
              </ol>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
