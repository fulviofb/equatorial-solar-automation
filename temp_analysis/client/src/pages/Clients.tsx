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
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Clients() {
  const [open, setOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: clients, isLoading } = trpc.clients.list.useQuery();
  const utils = trpc.useUtils();

  const createMutation = trpc.clients.create.useMutation({
    onSuccess: () => {
      utils.clients.list.invalidate();
      setOpen(false);
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      name: formData.get("name") as string,
      cpfCnpj: formData.get("cpfCnpj") as string,
      rg: formData.get("rg") as string || undefined,
      address: formData.get("address") as string,
      cep: formData.get("cep") as string || undefined,
      city: formData.get("city") as string,
      state: formData.get("state") as string,
      phone: formData.get("phone") as string || undefined,
      landline: formData.get("landline") as string || undefined,
      email: formData.get("email") as string || undefined,
      activityType: formData.get("activityType") as string || undefined,
      consumptionClass: formData.get("consumptionClass") as any,
    };

    if (editingClient) {
      updateMutation.mutate({ id: editingClient.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredClients = clients?.filter((client) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.cpfCnpj.includes(searchTerm) ||
    client.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
            <p className="text-gray-600 mt-1">
              Gerencie os clientes titulares das unidades consumidoras
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingClient(null)}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingClient ? "Editar Cliente" : "Novo Cliente"}
                </DialogTitle>
                <DialogDescription>
                  Preencha os dados do cliente titular da unidade consumidora
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nome Completo / Razão Social *</Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={editingClient?.name}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="cpfCnpj">CPF/CNPJ *</Label>
                      <Input
                        id="cpfCnpj"
                        name="cpfCnpj"
                        defaultValue={editingClient?.cpfCnpj}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="rg">RG</Label>
                      <Input
                        id="rg"
                        name="rg"
                        defaultValue={editingClient?.rg}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="address">Endereço Completo *</Label>
                    <Input
                      id="address"
                      name="address"
                      defaultValue={editingClient?.address}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="cep">CEP</Label>
                      <Input
                        id="cep"
                        name="cep"
                        defaultValue={editingClient?.cep}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="city">Município *</Label>
                      <Input
                        id="city"
                        name="city"
                        defaultValue={editingClient?.city}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="state">UF *</Label>
                      <Input
                        id="state"
                        name="state"
                        maxLength={2}
                        defaultValue={editingClient?.state}
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
                        defaultValue={editingClient?.phone}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="landline">Telefone Fixo</Label>
                      <Input
                        id="landline"
                        name="landline"
                        defaultValue={editingClient?.landline}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      defaultValue={editingClient?.email}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="activityType">Ramo de Atividade</Label>
                    <Input
                      id="activityType"
                      name="activityType"
                      defaultValue={editingClient?.activityType}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="consumptionClass">Classe de Consumo *</Label>
                    <Select
                      name="consumptionClass"
                      defaultValue={editingClient?.consumptionClass}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a classe" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Residencial">Residencial</SelectItem>
                        <SelectItem value="Industrial">Industrial</SelectItem>
                        <SelectItem value="Comércio, serviços e outras atividades">
                          Comércio, serviços e outras atividades
                        </SelectItem>
                        <SelectItem value="Rural">Rural</SelectItem>
                        <SelectItem value="Poder Público">Poder Público</SelectItem>
                        <SelectItem value="Iluminação Pública">
                          Iluminação Pública
                        </SelectItem>
                        <SelectItem value="Serviço Público">
                          Serviço Público
                        </SelectItem>
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
                        onClick={() => {
                          setEditingClient(client);
                          setOpen(true);
                        }}
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
