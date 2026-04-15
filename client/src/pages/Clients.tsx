import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Plus, Pencil, Trash2, Search, FileText, Zap } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";

// Limite seguro: 3MB × 1.33 base64 ≈ 4MB (teto Vercel = 4.5MB)
const MAX_PDF_SIZE = 3 * 1024 * 1024;

const CONSUMPTION_CLASSES = [
  "Residencial",
  "Industrial",
  "Comércio, serviços e outras atividades",
  "Rural",
  "Poder Público",
  "Iluminação Pública",
  "Serviço Público",
] as const;

type ConsumptionClass = typeof CONSUMPTION_CLASSES[number];

// Dados importados da conta — usados para pré-preencher o formulário
interface ImportedBillData {
  name?: string;
  cpfCnpj?: string;
  address?: string;
  neighborhood?: string;
  cep?: string;
  city?: string;
  state?: string;
  accountContract?: string;
  connectionType?: string;
  serviceVoltage?: string;
  consumptionClass?: string;
}

export default function Clients() {
  const [open, setOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  // Dados pré-preenchidos pela importação da conta
  const [importedData, setImportedData] = useState<ImportedBillData | null>(null);
  // Controla select de classe de consumo
  const [selectedClass, setSelectedClass] = useState<ConsumptionClass>("Residencial");

  const billInputRef = useRef<HTMLInputElement>(null);

  const { data: clients, isLoading } = trpc.clients.list.useQuery();
  const utils = trpc.useUtils();

  const parseEnergyBillMutation = trpc.clients.parseEnergyBill.useMutation({
    onSuccess: (data) => {
      setImportedData(data);
      // Definir classe de consumo extraída
      if (data.consumptionClass && CONSUMPTION_CLASSES.includes(data.consumptionClass as ConsumptionClass)) {
        setSelectedClass(data.consumptionClass as ConsumptionClass);
      } else {
        setSelectedClass("Residencial");
      }
      setEditingClient(null);
      setOpen(true);
      setIsImporting(false);
      toast.success("Dados importados da conta de energia! Revise e salve.");
    },
    onError: (error) => {
      toast.error("Erro ao importar conta: " + error.message);
      setIsImporting(false);
    },
  });

  const createMutation = trpc.clients.create.useMutation({
    onSuccess: () => {
      utils.clients.list.invalidate();
      setOpen(false);
      setImportedData(null);
      toast.success("Cliente cadastrado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao cadastrar cliente: " + error.message);
    },
  });

  const updateMutation = trpc.clients.update.useMutation({
    onSuccess: () => {
      utils.clients.list.invalidate();
      setOpen(false);
      setEditingClient(null);
      setImportedData(null);
      toast.success("Cliente atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar cliente: " + error.message);
    },
  });

  const deleteMutation = trpc.clients.delete.useMutation({
    onSuccess: () => {
      utils.clients.list.invalidate();
      toast.success("Cliente excluído com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir cliente: " + error.message);
    },
  });

  const handleBillUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    if (file.type !== "application/pdf") {
      toast.error("Selecione um arquivo PDF");
      return;
    }
    if (file.size > MAX_PDF_SIZE) {
      toast.error(
        `PDF muito grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Limite: 3MB. Reduza em ilovepdf.com e tente novamente.`
      );
      return;
    }

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      parseEnergyBillMutation.mutate({ fileBase64: base64.split(",")[1] });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const data = {
      name: formData.get("name") as string,
      cpfCnpj: formData.get("cpfCnpj") as string,
      rg: (formData.get("rg") as string) || undefined,
      address: formData.get("address") as string,
      cep: (formData.get("cep") as string) || undefined,
      city: formData.get("city") as string,
      state: formData.get("state") as string,
      phone: (formData.get("phone") as string) || undefined,
      landline: (formData.get("landline") as string) || undefined,
      email: (formData.get("email") as string) || undefined,
      activityType: (formData.get("activityType") as string) || undefined,
      consumptionClass: selectedClass,
    };

    if (editingClient) {
      updateMutation.mutate({ id: editingClient.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleOpenNew = () => {
    setEditingClient(null);
    setImportedData(null);
    setSelectedClass("Residencial");
    setOpen(true);
  };

  const handleOpenEdit = (client: any) => {
    setEditingClient(client);
    setImportedData(null);
    setSelectedClass(client.consumptionClass || "Residencial");
    setOpen(true);
  };

  const filteredClients = clients?.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.cpfCnpj.includes(searchTerm) ||
      client.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Valor padrão: importado > editando > vazio
  const defaultVal = (importedKey: keyof ImportedBillData, editKey?: string) => {
    if (importedData) return importedData[importedKey] ?? "";
    if (editingClient) return editingClient[editKey ?? importedKey] ?? "";
    return "";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
            <p className="text-gray-600 mt-1">
              Gerencie os clientes titulares das unidades consumidoras
            </p>
          </div>
          <div className="flex gap-2">
            {/* Input oculto para conta de energia */}
            <input
              ref={billInputRef}
              type="file"
              accept=".pdf"
              onChange={handleBillUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => billInputRef.current?.click()}
              disabled={isImporting}
              title="Importar conta de energia PDF (máx. 3MB) para pré-preencher o cadastro"
            >
              <Zap className="mr-2 h-4 w-4" />
              {isImporting ? "Importando..." : "Importar Conta de Energia"}
            </Button>

            <Dialog open={open} onOpenChange={(v) => {
              setOpen(v);
              if (!v) { setImportedData(null); setEditingClient(null); }
            }}>
              <DialogTrigger asChild>
                <Button onClick={handleOpenNew}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Cliente
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {importedData
                      ? "Revisar Dados da Conta de Energia"
                      : editingClient
                      ? "Editar Cliente"
                      : "Novo Cliente"}
                  </DialogTitle>
                  <DialogDescription>
                    {importedData
                      ? "Verifique os dados extraídos da conta e complete as informações faltantes antes de salvar."
                      : "Preencha os dados do cliente titular da unidade consumidora"}
                  </DialogDescription>
                </DialogHeader>

                {importedData && (
                  <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-800 flex items-start gap-2">
                    <FileText className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>
                      Dados importados da conta de energia. UC: <strong>{importedData.accountContract}</strong>
                      {importedData.serviceVoltage && <> · Tensão: <strong>{importedData.serviceVoltage}V</strong></>}
                      {importedData.connectionType && <> · <strong>{importedData.connectionType}</strong></>}
                    </span>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Nome Completo / Razão Social *</Label>
                      <Input
                        key={`name-${importedData?.name}-${editingClient?.id}`}
                        id="name"
                        name="name"
                        defaultValue={defaultVal("name")}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="cpfCnpj">CPF/CNPJ *</Label>
                        <Input
                          key={`cpf-${importedData?.cpfCnpj}-${editingClient?.id}`}
                          id="cpfCnpj"
                          name="cpfCnpj"
                          defaultValue={defaultVal("cpfCnpj")}
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="rg">RG</Label>
                        <Input
                          id="rg"
                          name="rg"
                          defaultValue={editingClient?.rg ?? ""}
                        />
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="address">Endereço *</Label>
                      <Input
                        key={`addr-${importedData?.address}-${editingClient?.id}`}
                        id="address"
                        name="address"
                        placeholder="Rua, número, complemento"
                        defaultValue={defaultVal("address")}
                        required
                      />
                    </div>

                    {/* Bairro vem da conta mas não é campo do cliente — mostrar apenas se importado */}
                    {importedData?.neighborhood && (
                      <div className="grid gap-2">
                        <Label className="text-gray-500 text-xs">
                          Bairro (da conta — inclua no endereço se necessário)
                        </Label>
                        <p className="text-sm text-gray-700 bg-gray-50 rounded px-3 py-2 border">
                          {importedData.neighborhood}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="cep">CEP</Label>
                        <Input
                          key={`cep-${importedData?.cep}-${editingClient?.id}`}
                          id="cep"
                          name="cep"
                          defaultValue={defaultVal("cep")}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="city">Município *</Label>
                        <Input
                          key={`city-${importedData?.city}-${editingClient?.id}`}
                          id="city"
                          name="city"
                          defaultValue={defaultVal("city")}
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="state">UF *</Label>
                        <Input
                          key={`state-${importedData?.state}-${editingClient?.id}`}
                          id="state"
                          name="state"
                          maxLength={2}
                          defaultValue={defaultVal("state")}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="phone">Telefone Celular</Label>
                        <Input
                          id="phone"
                          name="phone"
                          defaultValue={editingClient?.phone ?? ""}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="landline">Telefone Fixo</Label>
                        <Input
                          id="landline"
                          name="landline"
                          defaultValue={editingClient?.landline ?? ""}
                        />
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="email">E-mail</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        defaultValue={editingClient?.email ?? ""}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="activityType">Ramo de Atividade</Label>
                      <Input
                        id="activityType"
                        name="activityType"
                        defaultValue={editingClient?.activityType ?? ""}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="consumptionClass">Classe de Consumo *</Label>
                      <Select
                        value={selectedClass}
                        onValueChange={(v) => setSelectedClass(v as ConsumptionClass)}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a classe" />
                        </SelectTrigger>
                        <SelectContent>
                          {CONSUMPTION_CLASSES.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setOpen(false);
                        setEditingClient(null);
                        setImportedData(null);
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending}
                    >
                      {editingClient ? "Atualizar" : "Cadastrar"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Lista */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Lista de Clientes</CardTitle>
                <CardDescription>
                  {clients?.length || 0} cliente(s) cadastrado(s)
                </CardDescription>
              </div>
              <div className="w-72">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por nome, CPF/CNPJ ou cidade..."
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
            ) : filteredClients && filteredClients.length > 0 ? (
              <div className="space-y-4">
                {filteredClients.map((client) => (
                  <div
                    key={client.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{client.name}</h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                        <span>CPF/CNPJ: {client.cpfCnpj}</span>
                        <span>•</span>
                        <span>{client.consumptionClass}</span>
                        {client.city && (
                          <>
                            <span>•</span>
                            <span>{client.city}/{client.state}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(client)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm("Tem certeza que deseja excluir este cliente?")) {
                            deleteMutation.mutate({ id: client.id });
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
                <p className="text-gray-500">
                  {searchTerm
                    ? "Nenhum cliente encontrado com os critérios de busca."
                    : "Nenhum cliente cadastrado ainda."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
