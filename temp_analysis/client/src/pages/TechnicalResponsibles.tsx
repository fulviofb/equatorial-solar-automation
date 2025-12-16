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
import { trpc } from "@/lib/trpc";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function TechnicalResponsibles() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: technicalResponsibles, isLoading } = trpc.technicalResponsibles.list.useQuery();
  const utils = trpc.useUtils();

  const createMutation = trpc.technicalResponsibles.create.useMutation({
    onSuccess: () => {
      utils.technicalResponsibles.list.invalidate();
      setOpen(false);
      toast.success("Responsável técnico cadastrado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao cadastrar: " + error.message);
    },
  });

  const updateMutation = trpc.technicalResponsibles.update.useMutation({
    onSuccess: () => {
      utils.technicalResponsibles.list.invalidate();
      setOpen(false);
      setEditing(null);
      toast.success("Responsável técnico atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar: " + error.message);
    },
  });

  const deleteMutation = trpc.technicalResponsibles.delete.useMutation({
    onSuccess: () => {
      utils.technicalResponsibles.list.invalidate();
      toast.success("Responsável técnico excluído com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      name: formData.get("name") as string,
      title: formData.get("title") as string,
      registrationNumber: formData.get("registrationNumber") as string,
      registrationState: formData.get("registrationState") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string || undefined,
      mobile: formData.get("mobile") as string || undefined,
      fax: formData.get("fax") as string || undefined,
      address: formData.get("address") as string || undefined,
      neighborhood: formData.get("neighborhood") as string || undefined,
      city: formData.get("city") as string || undefined,
      state: formData.get("state") as string || undefined,
      cep: formData.get("cep") as string || undefined,
    };

    if (editing) {
      updateMutation.mutate({ id: editing.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filtered = technicalResponsibles?.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.registrationNumber.includes(searchTerm) ||
    item.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Responsáveis Técnicos</h1>
            <p className="text-gray-600 mt-1">
              Gerencie os profissionais responsáveis pelos projetos
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditing(null)}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Responsável
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editing ? "Editar Responsável Técnico" : "Novo Responsável Técnico"}
                </DialogTitle>
                <DialogDescription>
                  Preencha os dados do profissional responsável
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nome Completo *</Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={editing?.name}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="title">Título Profissional *</Label>
                      <Input
                        id="title"
                        name="title"
                        placeholder="Ex: Engenheiro Eletricista"
                        defaultValue={editing?.title}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="registrationNumber">Nº Registro *</Label>
                      <Input
                        id="registrationNumber"
                        name="registrationNumber"
                        defaultValue={editing?.registrationNumber}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="registrationState">UF do Registro *</Label>
                    <Input
                      id="registrationState"
                      name="registrationState"
                      maxLength={2}
                      defaultValue={editing?.registrationState}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">E-mail *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      defaultValue={editing?.email}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="phone">Telefone Fixo</Label>
                      <Input
                        id="phone"
                        name="phone"
                        defaultValue={editing?.phone}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="mobile">Celular</Label>
                      <Input
                        id="mobile"
                        name="mobile"
                        defaultValue={editing?.mobile}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="fax">Fax</Label>
                      <Input
                        id="fax"
                        name="fax"
                        defaultValue={editing?.fax}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="address">Endereço de Correspondência</Label>
                    <Input
                      id="address"
                      name="address"
                      defaultValue={editing?.address}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="neighborhood">Bairro</Label>
                      <Input
                        id="neighborhood"
                        name="neighborhood"
                        defaultValue={editing?.neighborhood}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="city">Município</Label>
                      <Input
                        id="city"
                        name="city"
                        defaultValue={editing?.city}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="state">UF</Label>
                      <Input
                        id="state"
                        name="state"
                        maxLength={2}
                        defaultValue={editing?.state}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="cep">CEP</Label>
                      <Input
                        id="cep"
                        name="cep"
                        defaultValue={editing?.cep}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setOpen(false);
                      setEditing(null);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {editing ? "Atualizar" : "Cadastrar"}
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
                <CardTitle>Lista de Responsáveis Técnicos</CardTitle>
                <CardDescription>
                  {technicalResponsibles?.length || 0} profissional(is) cadastrado(s)
                </CardDescription>
              </div>
              <div className="w-72">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por nome, registro ou e-mail..."
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
                {filtered.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{item.name}</h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                        <span>{item.title}</span>
                        <span>•</span>
                        <span>Registro: {item.registrationNumber} ({item.registrationState})</span>
                        <span>•</span>
                        <span>{item.email}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditing(item);
                          setOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm("Tem certeza que deseja excluir este responsável técnico?")) {
                            deleteMutation.mutate({ id: item.id });
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
                    ? "Nenhum responsável técnico encontrado."
                    : "Nenhum responsável técnico cadastrado ainda."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
