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
import { Plus, Pencil, Trash2, Search, Zap, Upload } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";

// Limite máximo do PDF considerando o teto de 4.5MB da Vercel para funções serverless.
// Base64 aumenta o tamanho em ~33%, então 3MB × 1.33 ≈ 4MB (margem segura).
const MAX_PDF_SIZE = 3 * 1024 * 1024; // 3MB

export default function SolarModules() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  const parseMutation = trpc.datasheet.parse.useMutation({
    onSuccess: (result) => {
      if (result.type === 'module') {
        setEditing(result.data);
        setOpen(true);
        toast.success("Dados importados do datasheet com sucesso!");
      } else {
        toast.error("Este datasheet parece ser de um inversor, não de um módulo fotovoltaico.");
      }
      setIsImporting(false);
    },
    onError: (error) => {
      toast.error("Erro ao processar datasheet: " + error.message);
      setIsImporting(false);
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Resetar input para permitir selecionar o mesmo arquivo novamente
    e.target.value = "";

    if (file.type !== 'application/pdf') {
      toast.error("Por favor, selecione um arquivo PDF");
      return;
    }

    if (file.size > MAX_PDF_SIZE) {
      toast.error(
        `PDF muito grande (${(file.size / 1024 / 1024).toFixed(1)}MB). ` +
        `O limite é 3MB. Reduza o PDF usando uma ferramenta como ilovepdf.com ou smallpdf.com e tente novamente.`
      );
      return;
    }

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      const fileBase64 = base64.split(',')[1];
      parseMutation.mutate({ fileBase64 });
    };
    reader.readAsDataURL(file);
  };

  const { data: modules, isLoading } = trpc.solarModules.list.useQuery();
  const utils = trpc.useUtils();

  const createMutation = trpc.solarModules.create.useMutation({
    onSuccess: () => {
      utils.solarModules.list.invalidate();
      setOpen(false);
      toast.success("Módulo fotovoltaico cadastrado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao cadastrar: " + error.message);
    },
  });

  const updateMutation = trpc.solarModules.update.useMutation({
    onSuccess: () => {
      utils.solarModules.list.invalidate();
      setOpen(false);
      setEditing(null);
      toast.success("Módulo fotovoltaico atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar: " + error.message);
    },
  });

  const deleteMutation = trpc.solarModules.delete.useMutation({
    onSuccess: () => {
      utils.solarModules.list.invalidate();
      toast.success("Módulo fotovoltaico excluído com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const data = {
      manufacturer: formData.get("manufacturer") as string,
      model: formData.get("model") as string,
      nominalPower: parseInt(formData.get("nominalPower") as string),
      voc: formData.get("voc") as string,
      isc: formData.get("isc") as string,
      vmpp: formData.get("vmpp") as string,
      impp: formData.get("impp") as string,
      efficiency: formData.get("efficiency") as string || undefined,
      length: formData.get("length") as string || undefined,
      width: formData.get("width") as string || undefined,
      area: formData.get("area") as string || undefined,
      weight: formData.get("weight") as string || undefined,
      datasheetUrl: formData.get("datasheetUrl") as string || undefined,
    };

    if (editing && editing.id) {
      updateMutation.mutate({ id: editing.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filtered = modules?.filter((item) =>
    item.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Módulos Fotovoltaicos</h1>
            <p className="text-gray-600 mt-1">
              Biblioteca de módulos fotovoltaicos disponíveis
            </p>
          </div>
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              title="Importar datasheet PDF (máx. 3MB). PDFs maiores podem ser reduzidos em ilovepdf.com"
            >
              <Upload className="mr-2 h-4 w-4" />
              {isImporting ? "Importando..." : "Importar Datasheet"}
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditing(null)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Módulo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editing && editing.id ? "Editar Módulo Fotovoltaico" : "Novo Módulo Fotovoltaico"}
                  </DialogTitle>
                  <DialogDescription>
                    Preencha as especificações técnicas do módulo
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="manufacturer">Fabricante *</Label>
                        <Input
                          id="manufacturer"
                          name="manufacturer"
                          placeholder="Ex: TRINA"
                          defaultValue={editing?.manufacturer}
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="model">Modelo *</Label>
                        <Input
                          id="model"
                          name="model"
                          placeholder="Ex: TSM-NEG21C.20"
                          defaultValue={editing?.model}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="nominalPower">Potência Nominal (W) *</Label>
                        <Input
                          id="nominalPower"
                          name="nominalPower"
                          type="number"
                          placeholder="700"
                          defaultValue={editing?.nominalPower}
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="voc">Voc (V) *</Label>
                        <Input
                          id="voc"
                          name="voc"
                          placeholder="48.6"
                          defaultValue={editing?.voc}
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="isc">Isc (A) *</Label>
                        <Input
                          id="isc"
                          name="isc"
                          placeholder="18.32"
                          defaultValue={editing?.isc}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="vmpp">Vmpp (V) *</Label>
                        <Input
                          id="vmpp"
                          name="vmpp"
                          placeholder="40.5"
                          defaultValue={editing?.vmpp}
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="impp">Impp (A) *</Label>
                        <Input
                          id="impp"
                          name="impp"
                          placeholder="17.29"
                          defaultValue={editing?.impp}
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="efficiency">Eficiência (%)</Label>
                        <Input
                          id="efficiency"
                          name="efficiency"
                          placeholder="22.9"
                          defaultValue={editing?.efficiency}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="length">Comprimento (m)</Label>
                        <Input
                          id="length"
                          name="length"
                          placeholder="2.384"
                          defaultValue={editing?.length}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="width">Largura (m)</Label>
                        <Input
                          id="width"
                          name="width"
                          placeholder="1.303"
                          defaultValue={editing?.width}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="area">Área (m²)</Label>
                        <Input
                          id="area"
                          name="area"
                          placeholder="3.106"
                          defaultValue={editing?.area}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="weight">Peso (kg)</Label>
                        <Input
                          id="weight"
                          name="weight"
                          placeholder="38.3"
                          defaultValue={editing?.weight}
                        />
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="datasheetUrl">URL do Datasheet</Label>
                      <Input
                        id="datasheetUrl"
                        name="datasheetUrl"
                        type="url"
                        placeholder="https://..."
                        defaultValue={editing?.datasheetUrl}
                      />
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
                      {editing && editing.id ? "Atualizar" : "Cadastrar"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Biblioteca de Módulos</CardTitle>
                <CardDescription>
                  {modules?.length || 0} modelo(s) cadastrado(s)
                </CardDescription>
              </div>
              <div className="w-72">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por fabricante ou modelo..."
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((item) => (
                  <Card key={item.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="p-2 bg-yellow-50 rounded-lg">
                            <Zap className="h-5 w-5 text-yellow-600" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{item.manufacturer}</CardTitle>
                            <CardDescription className="text-sm">{item.model}</CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">Potência:</span>
                          <p className="font-semibold">{item.nominalPower}W</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Eficiência:</span>
                          <p className="font-semibold">{item.efficiency || "-"}%</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Voc:</span>
                          <p className="font-semibold">{item.voc}V</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Isc:</span>
                          <p className="font-semibold">{item.isc}A</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            setEditing(item);
                            setOpen(true);
                          }}
                        >
                          <Pencil className="h-3 w-3 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm("Tem certeza que deseja excluir este módulo?")) {
                              deleteMutation.mutate({ id: item.id });
                            }
                          }}
                        >
                          <Trash2 className="h-3 w-3 text-red-600" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  {searchTerm
                    ? "Nenhum módulo encontrado."
                    : "Nenhum módulo cadastrado ainda."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
