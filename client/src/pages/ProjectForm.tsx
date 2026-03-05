import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Save, Plus, Trash2, AlertTriangle, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ProjectForm() {
  const [location, setLocation] = useLocation();
  const projectId = location.match(/\/projetos\/(\d+)\/editar/)?.[1];
  const isEditMode = !!projectId;
  const [moduleArrays, setModuleArrays] = useState<Array<{ moduleId: number; quantity: number }>>([]);
  const [inverters, setInverters] = useState<Array<{ inverterId: number; quantity: number }>>([]);
  const [ratioList, setRatioList] = useState<Array<{ targetUnit: string; percentage: number }>>([]);
  const [classification, setClassification] = useState<string>("AUTOCONSUMO LOCAL");
  const [compatibilityIssues, setCompatibilityIssues] = useState<Array<{ type: 'error' | 'warning'; field: string; message: string }>>([]);

  const { data: clients } = trpc.clients.list.useQuery();
  const { data: technicalResponsibles } = trpc.technicalResponsibles.list.useQuery();
  const { data: solarModules } = trpc.solarModules.list.useQuery();
  const { data: invertersList } = trpc.inverters.list.useQuery();
  const { data: projectData, isLoading: isLoadingProject } = trpc.projects.getById.useQuery(
    { id: parseInt(projectId!) },
    { enabled: isEditMode }
  );
  const utils = trpc.useUtils();

  const createMutation = trpc.projects.create.useMutation({
    onSuccess: () => {
      utils.projects.list.invalidate();
      toast.success("Projeto criado com sucesso!");
      setLocation("/projetos");
    },
    onError: (error) => {
      toast.error("Erro ao criar projeto: " + error.message);
    },
  });

  const updateMutation = trpc.projects.update.useMutation({
    onSuccess: () => {
      utils.projects.list.invalidate();
      toast.success("Projeto atualizado com sucesso!");
      setLocation("/projetos");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar projeto: " + error.message);
    },
  });

  const checkCompatibilityMutation = trpc.validation.checkCompatibility.useMutation({
    onSuccess: (data) => {
      setCompatibilityIssues(data.issues);
    },
  });

  // Hydrate form state from projectData
  useEffect(() => {
    if (projectData && isEditMode) {
      if (projectData.moduleArrays) {
        setModuleArrays(projectData.moduleArrays.map(ma => ({
          moduleId: ma.solarModuleId,
          quantity: ma.quantity
        })));
      }
      if (projectData.inverters) {
        setInverters(projectData.inverters.map(inv => ({
          inverterId: inv.inverterId,
          quantity: inv.quantity
        })));
      }
      if (projectData.ratioList) {
        setRatioList(projectData.ratioList.map((r: any) => ({
          targetUnit: r.accountContract || r.targetUnit,
          percentage: r.percentageKwh || r.percentage
        })));
      }
      if (projectData.classification) {
        setClassification(projectData.classification);
      }
    }
  }, [projectData, isEditMode]);

  // Validar compatibilidade sempre que módulos ou inversores mudarem
  useEffect(() => {
    if (moduleArrays.length > 0 && inverters.length > 0 && solarModules && invertersList) {
      // Pegar primeiro módulo e primeiro inversor para validação
      const firstModuleArray = moduleArrays[0];
      // ... rest of validation logic preserved implicitly by replacing up to line 112 ...
      // Wait, I am replacing lines 67-112? No I should Insert before line 67.
      // I can just Add proper useEffect before the existing one.

      const module = solarModules.find(m => m.id === firstModuleArray.moduleId);
      const firstInverter = inverters[0];
      const inverter = invertersList.find(i => i.id === firstInverter.inverterId);

      if (module && inverter) {
        console.log('[DEBUG] Inverter do banco:', inverter);
        console.log('[DEBUG] isMicroinverter:', inverter.isMicroinverter);
        console.log('[DEBUG] isMicroinverter === 1:', inverter.isMicroinverter === 1);

        const requestData = {
          modules: [{
            voc: module.voc,
            isc: module.isc,
            vmpp: module.vmpp,
            impp: module.impp,
            nominalPower: module.nominalPower,
          }],
          modulesPerString: firstModuleArray.quantity,
          numberOfStrings: moduleArrays.length,
          inverter: {
            maxVoltageDC: inverter.maxVoltageDC || undefined,
            maxCurrentDC: inverter.maxCurrentDC || undefined,
            mpptVoltageMax: inverter.mpptVoltageMax || undefined,
            mpptVoltageMin: inverter.mpptVoltageMin || undefined,
            startupVoltageDC: inverter.startupVoltageDC || undefined,
            nominalPowerDC: inverter.nominalPowerDC || undefined,
            maxPowerDC: inverter.maxPowerDC || undefined,
            nominalPowerAC: inverter.nominalPowerAC,
            numberOfMppt: inverter.numberOfMppt || undefined,
            numberOfStrings: inverter.numberOfStrings || undefined,
            isMicroinverter: Boolean(inverter.isMicroinverter),
            maxCurrentPerInput: inverter.maxCurrentPerInput || undefined,
          },
        };

        console.log('[DEBUG] Dados enviados para validação:', requestData);
        checkCompatibilityMutation.mutate(requestData);
      }
    } else {
      setCompatibilityIssues([]);
    }
  }, [moduleArrays, inverters, solarModules, invertersList]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    // Validações
    if (moduleArrays.length === 0) {
      toast.error("Adicione pelo menos um arranjo de módulos fotovoltaicos");
      return;
    }

    if (inverters.length === 0) {
      toast.error("Adicione pelo menos um inversor");
      return;
    }

    // Verificar erros de compatibilidade
    const hasErrors = compatibilityIssues.some(issue => issue.type === 'error');
    if (hasErrors) {
      toast.error("Corrija os erros de compatibilidade antes de salvar o projeto");
      return;
    }

    // Calcular potência total instalada
    let totalPower = 0;
    moduleArrays.forEach((array) => {
      const module = solarModules?.find(m => m.id === array.moduleId);
      if (module) {
        totalPower += module.nominalPower * array.quantity;
      }
    });

    const availablePower = parseFloat(formData.get("availablePower") as string);
    // Nota: Oversizing é permitido e comum em projetos solares
    // A validação de compatibilidade já alerta sobre oversizing excessivo

    const data = {
      clientId: parseInt(formData.get("clientId") as string),
      technicalResponsibleId: parseInt(formData.get("technicalResponsibleId") as string),
      accountContract: formData.get("accountContract") as string || undefined,
      connectionType: formData.get("connectionType") as any,
      serviceVoltage: parseInt(formData.get("serviceVoltage") as string),
      entryBreakerCurrent: parseInt(formData.get("entryBreakerCurrent") as string),
      availablePower: parseFloat(formData.get("availablePower") as string),
      declaredLoad: formData.get("declaredLoad") as string || undefined,
      branchType: formData.get("branchType") as any,
      nearestPoleNumber: formData.get("nearestPoleNumber") as string || undefined,
      coordinateX: formData.get("coordinateX") as string || undefined,
      coordinateY: formData.get("coordinateY") as string || undefined,
      requestType: formData.get("requestType") as any,
      primarySourceType: formData.get("primarySourceType") as any,
      generationType: formData.get("generationType") as any,
      classification: formData.get("classification") as any,
      totalInstalledPower: totalPower,
      status: "RASCUNHO" as any,
      moduleArrays,
      inverters,
      ratioList,
    };

    if (isEditMode) {
      updateMutation.mutate({ id: parseInt(projectId!), data });
    } else {
      createMutation.mutate(data);
    }
  };

  const addModuleArray = () => {
    if (!solarModules || solarModules.length === 0) {
      toast.error("Cadastre módulos fotovoltaicos primeiro");
      return;
    }
    setModuleArrays([...moduleArrays, { moduleId: solarModules[0].id, quantity: 1 }]);
  };

  const removeModuleArray = (index: number) => {
    setModuleArrays(moduleArrays.filter((_, i) => i !== index));
  };

  const addInverter = () => {
    if (!invertersList || invertersList.length === 0) {
      toast.error("Cadastre inversores primeiro");
      return;
    }
    setInverters([...inverters, { inverterId: invertersList[0].id, quantity: 1 }]);
  };

  const removeInverter = (index: number) => {
    setInverters(inverters.filter((_, i) => i !== index));
  };

  const calculateTotalPower = () => {
    let total = 0;
    moduleArrays.forEach((array) => {
      const module = solarModules?.find(m => m.id === array.moduleId);
      if (module) {
        total += module.nominalPower * array.quantity;
      }
    });
    return (total / 1000).toFixed(2);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/projetos")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{isEditMode ? "Editar Projeto" : "Novo Projeto"}</h1>
            <p className="text-gray-600 mt-1">
              {isEditMode ? "Atualize os dados do projeto de microgeração distribuída" : "Preencha os dados do projeto de microgeração distribuída"}
            </p>
          </div>
        </div>



        {isEditMode && isLoadingProject ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            <span className="ml-2">Carregando dados do projeto...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Alertas de Compatibilidade */}
            {compatibilityIssues.length > 0 && (
              <div className="space-y-2">
                {compatibilityIssues.map((issue, index) => (
                  <Alert key={index} variant={issue.type === 'error' ? 'destructive' : 'default'}>
                    {issue.type === 'error' ? (
                      <AlertCircle className="h-4 w-4" />
                    ) : (
                      <AlertTriangle className="h-4 w-4" />
                    )}
                    <AlertTitle>{issue.type === 'error' ? 'Erro de Compatibilidade' : 'Aviso de Compatibilidade'}</AlertTitle>
                    <AlertDescription>{issue.message}</AlertDescription>
                  </Alert>
                ))}
              </div>
            )}

            {/* 1. Dados Básicos */}
            <Card>
              <CardHeader>
                <CardTitle>1. Dados Básicos</CardTitle>
                <CardDescription>
                  Informações gerais do projeto
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="clientId">Cliente *</Label>
                    <Select name="clientId" required defaultValue={projectData?.clientId.toString()}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients?.map((client) => (
                          <SelectItem key={client.id} value={client.id.toString()}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="technicalResponsibleId">Responsável Técnico *</Label>
                    <Select name="technicalResponsibleId" required defaultValue={projectData?.technicalResponsibleId.toString()}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o responsável" />
                      </SelectTrigger>
                      <SelectContent>
                        {technicalResponsibles?.map((resp) => (
                          <SelectItem key={resp.id} value={resp.id.toString()}>
                            {resp.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="requestType">Tipo de Solicitação *</Label>
                    <Select name="requestType" required defaultValue={projectData?.requestType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LIGAÇÃO NOVA DE UNIDADE CONSUMIDORA COM GERAÇÃO DISTRIBUÍDA">
                          Ligação Nova com GD
                        </SelectItem>
                        <SelectItem value="CONEXÃO DE GD EM UNIDADE CONSUMIDORA EXISTENTE SEM AUMENTO DE POTÊNCIA DISPONIBILIZADA">
                          Conexão GD sem Aumento de Potência
                        </SelectItem>
                        <SelectItem value="CONEXÃO DE GD EM UNIDADE CONSUMIDORA EXISTENTE COM AUMENTO DE POTÊNCIA DISPONIBILIZADA">
                          Conexão GD com Aumento de Potência
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="accountContract">Conta Contrato (se UC existente)</Label>
                    <Input
                      id="accountContract"
                      name="accountContract"
                      placeholder="Ex: 123456789"
                      defaultValue={projectData?.accountContract || ''}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="connectionType">Tipo de Ligação *</Label>
                    <Select name="connectionType" required defaultValue={projectData?.connectionType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MONOFÁSICO">Monofásico</SelectItem>
                        <SelectItem value="BIFÁSICO">Bifásico</SelectItem>
                        <SelectItem value="TRIFÁSICO">Trifásico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="serviceVoltage">Tensão de Atendimento (V) *</Label>
                    <Input
                      id="serviceVoltage"
                      name="serviceVoltage"
                      type="number"
                      placeholder="220"
                      required
                      defaultValue={projectData?.serviceVoltage}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="entryBreakerCurrent">Disjuntor de Entrada (A) *</Label>
                    <Input
                      id="entryBreakerCurrent"
                      name="entryBreakerCurrent"
                      type="number"
                      placeholder="40"
                      required
                      defaultValue={projectData?.entryBreakerCurrent}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="availablePower">Potência Disponibilizada (kW) *</Label>
                    <Input
                      id="availablePower"
                      name="availablePower"
                      type="number"
                      step="0.01"
                      placeholder="10.00"
                      required
                      defaultValue={projectData?.availablePower}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="declaredLoad">Carga Declarada (kW)</Label>
                    <Input
                      id="declaredLoad"
                      name="declaredLoad"
                      placeholder="8.00"
                      defaultValue={projectData?.declaredLoad || ''}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="branchType">Tipo de Ramal *</Label>
                    <Select name="branchType" required defaultValue={projectData?.branchType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AÉREO">Aéreo</SelectItem>
                        <SelectItem value="SUBTERRÂNEO">Subterrâneo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="nearestPoleNumber">Nº Poste/Transformador Próximo</Label>
                    <Input
                      id="nearestPoleNumber"
                      name="nearestPoleNumber"
                      placeholder="Ex: 12345"
                      defaultValue={projectData?.nearestPoleNumber || ''}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="coordinateX">Coordenada X</Label>
                    <Input
                      id="coordinateX"
                      name="coordinateX"
                      placeholder="Ex: -16.123456"
                      defaultValue={projectData?.coordinateX || ''}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="coordinateY">Coordenada Y</Label>
                    <Input
                      id="coordinateY"
                      name="coordinateY"
                      placeholder="Ex: -48.123456"
                      defaultValue={projectData?.coordinateY || ''}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 2. Características da Microgeração */}
            <Card>
              <CardHeader>
                <CardTitle>2. Características da Microgeração</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="primarySourceType">Tipo de Fonte Primária *</Label>
                    <Select name="primarySourceType" required defaultValue={projectData?.primarySourceType || "SOLAR FOTOVOLTAICA"}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SOLAR FOTOVOLTAICA">Solar Fotovoltaica</SelectItem>
                        <SelectItem value="EÓLICA">Eólica</SelectItem>
                        <SelectItem value="HIDRÁULICA">Hidráulica</SelectItem>
                        <SelectItem value="BIOMASSA">Biomassa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="generationType">Tipo de Geração *</Label>
                    <Select name="generationType" required defaultValue={projectData?.generationType || "EMPREGANDO CONVERSOR ELETRÔNICO/INVERSOR"}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EMPREGANDO CONVERSOR ELETRÔNICO/INVERSOR">
                          Conversor Eletrônico/Inversor
                        </SelectItem>
                        <SelectItem value="EMPREGANDO MÁQUINA SÍNCRONA SEM CONVERSOR">
                          Máquina Síncrona sem Conversor
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="classification">Enquadramento *</Label>
                  <Select
                    name="classification"
                    required
                    value={classification}
                    onValueChange={setClassification}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AUTOCONSUMO LOCAL">Autoconsumo Local</SelectItem>
                      <SelectItem value="AUTOCONSUMO REMOTO">Autoconsumo Remoto</SelectItem>
                      <SelectItem value="GERAÇÃO COMPARTILHADA">Geração Compartilhada</SelectItem>
                      <SelectItem value="EMPREENDIMENTO DE MÚLTIPLAS UNIDADES CONSUMIDORAS">
                        EMUC
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>



            {/* 3. Lista de Rateio (Condicional) */}
            {(classification === "AUTOCONSUMO REMOTO" ||
              classification === "GERAÇÃO COMPARTILHADA" ||
              classification === "EMPREENDIMENTO DE MÚLTIPLAS UNIDADES CONSUMIDORAS") && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>3. Lista de Rateio de Créditos</CardTitle>
                        <CardDescription>
                          Beneficiárias dos excedentes de energia
                        </CardDescription>
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={() => setRatioList([...ratioList, { targetUnit: "", percentage: 0 }])}>
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {ratioList.map((ratio, index) => (
                      <div key={index} className="flex gap-4 items-end border p-4 rounded-md">
                        <div className="grid gap-2 flex-1">
                          <Label>Unidade Consumidora (Conta Contrato)</Label>
                          <Input
                            value={ratio.targetUnit}
                            onChange={(e) => {
                              const newList = [...ratioList];
                              newList[index].targetUnit = e.target.value;
                              setRatioList(newList);
                            }}
                            placeholder="Ex: 123456789"
                          />
                        </div>
                        <div className="grid gap-2 w-32">
                          <Label>% Rateio</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={ratio.percentage}
                            onChange={(e) => {
                              const newList = [...ratioList];
                              newList[index].percentage = parseFloat(e.target.value) || 0;
                              setRatioList(newList);
                            }}
                          />
                        </div>
                        <Button type="button" variant="ghost" onClick={() => setRatioList(ratioList.filter((_, i) => i !== index))}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    ))}
                    {ratioList.length === 0 && <p className="text-sm text-gray-500 text-center">Nenhuma beneficiária cadastrada.</p>}
                  </CardContent>
                </Card>
              )}

            {/* 4. Módulos Fotovoltaicos */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>3. Módulos Fotovoltaicos</CardTitle>
                    <CardDescription>
                      Adicione os arranjos de módulos do projeto
                    </CardDescription>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addModuleArray}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Arranjo
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {moduleArrays.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum arranjo adicionado. Clique em "Adicionar Arranjo" para começar.
                  </div>
                ) : (
                  moduleArrays.map((array, index) => (
                    <div key={index} className="flex items-end gap-4 p-4 border rounded-lg">
                      <div className="flex-1 grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label>Módulo Fotovoltaico</Label>
                          <Select
                            value={array.moduleId.toString()}
                            onValueChange={(value) => {
                              const newArrays = [...moduleArrays];
                              newArrays[index].moduleId = parseInt(value);
                              setModuleArrays(newArrays);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {solarModules?.map((module) => (
                                <SelectItem key={module.id} value={module.id.toString()}>
                                  {module.manufacturer} {module.model} ({module.nominalPower}W)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid gap-2">
                          <Label>Quantidade</Label>
                          <Input
                            type="number"
                            min="1"
                            value={array.quantity}
                            onChange={(e) => {
                              const newArrays = [...moduleArrays];
                              newArrays[index].quantity = parseInt(e.target.value) || 1;
                              setModuleArrays(newArrays);
                            }}
                          />
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeModuleArray(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  ))
                )}

                {moduleArrays.length > 0 && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">
                      Potência Total Instalada: {calculateTotalPower()} kWp
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 4. Inversores */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>4. Inversores</CardTitle>
                    <CardDescription>
                      Adicione os inversores do projeto
                    </CardDescription>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addInverter}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Inversor
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {inverters.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum inversor adicionado. Clique em "Adicionar Inversor" para começar.
                  </div>
                ) : (
                  inverters.map((inv, index) => (
                    <div key={index} className="flex items-end gap-4 p-4 border rounded-lg">
                      <div className="flex-1 grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label>Inversor</Label>
                          <Select
                            value={inv.inverterId.toString()}
                            onValueChange={(value) => {
                              const newInverters = [...inverters];
                              newInverters[index].inverterId = parseInt(value);
                              setInverters(newInverters);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {invertersList?.map((inverter) => (
                                <SelectItem key={inverter.id} value={inverter.id.toString()}>
                                  {inverter.manufacturer} {inverter.model} ({(inverter.nominalPowerAC / 1000).toFixed(1)}kW)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid gap-2">
                          <Label>Quantidade</Label>
                          <Input
                            type="number"
                            min="1"
                            value={inv.quantity}
                            onChange={(e) => {
                              const newInverters = [...inverters];
                              newInverters[index].quantity = parseInt(e.target.value) || 1;
                              setInverters(newInverters);
                            }}
                          />
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeInverter(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Botões de Ação */}
            <div className="flex items-center justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/projetos")}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isEditMode ? updateMutation.isPending : createMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                {(isEditMode ? updateMutation.isPending : createMutation.isPending) ? "Salvando..." : "Salvar Projeto"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout >
  );
}
