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
import { Plus, Pencil, Trash2, Search, Cpu, Upload } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";

// Limite máximo do PDF considerando o teto de 4.5MB da Vercel para funções serverless.
// Base64 aumenta o tamanho em ~33%, então 3MB × 1.33 ≈ 4MB (margem segura).
const MAX_PDF_SIZE = 3 * 1024 * 1024; // 3MB

export default function Inverters() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  const parseMutation = trpc.datasheet.parse.useMutation({
    onSuccess: (result) => {
      if (result.type === 'inverter') {
        setEditing(result.data);
        setOpen(true);
        toast.success("Dados importados do datasheet com sucesso!");
      } else {
        toast.error("Este datasheet parece ser de um módulo fotovoltaico, não de um inversor.");
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

  const { data: inverters, isLoading } = trpc.inverters.list.useQuery();
  const utils = trpc.useUtils();

  const createMutation = trpc.inverters.create.useMutation({
    onSuccess: () => {
      utils.inverters.list.invalidate();
      setOpen(false);
      toast.success("Inversor cadastrado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao cadastrar: " + error.message);
    },
  });

  const updateMutation = trpc.inverters.update.useMutation({
    onSuccess: () => {
      utils.inverters.list.invalidate();
      setOpen(false);
      setEditing(null);
      toast.success("Inversor atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar: " + error.message);
    },
  });

  const deleteMutation = trpc.inverters.delete.useMutation({
    onSuccess: () => {
      utils.inverters.list.invalidate();
      toast.success("Inversor excluído com sucesso!");
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
      nominalPowerAC: parseInt(formData.get("nominalPowerAC") as string),
      nominalPowerDC: formData.get("nominalPowerDC") ? parseInt(formData.get("nominalPowerDC") as string) : undefined,
      maxPowerDC: formData.get("maxPowerDC") ? parseInt(formData.get("maxPowerDC") as string) : undefined,
      maxVoltageDC: formData.get("maxVoltageDC") as string || undefined,
      maxCurrentDC: formData.get("maxCurrentDC") as string || undefined,
      mpptVoltageMax: formData.get("mpptVoltageMax") as string || undefined,
      mpptVoltageMin: formData.get("mpptVoltageMin") as string || undefined,
      startupVoltageDC: formData.get("startupVoltageDC") as string || undefined,
      numberOfMppt: formData.get("numberOfMppt") ? parseInt(formData.get("numberOfMppt") as string) : undefined,
      numberOfStrings: formData.get("numberOfStrings") ? parseInt(formData.get("numberOfStrings") as string) : undefined,
      maxCurrentPerInput: formData.get("maxCurrentPerInput") as string || undefined,
      isMicroinverter: formData.get("isMicroinverter") === "on" ? 1 : 0,
      nominalVoltageAC: formData.get("nominalVoltageAC") as string || undefined,
      nominalFrequency: formData.get("nominalFrequency") as string || undefined,
      maxCurrentAC: formData.get("maxCurrentAC") as string || undefined,
      powerFactor: formData.get("powerFactor") as string || undefined,
      thdCurrent: formData.get("thdCurrent") as string || undefined,
      maxEfficiency: formData.get("maxEfficiency") as string || undefined,
      euEfficiency: formData.get("euEfficiency") as string || undefined,
      mpptEfficiency: formData.get("mpptEfficiency") as string || undefined,
      connectionType: formData.get("connectionType") as string || undefined,
      certificationNumber: formData.get("certificationNumber") as string || undefined,
      datasheetUrl: formData.get("datasheetUrl") as string || undefined,
    };

    if (editing && editing.id) {
      updateMutation.mutate({ id: editing.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filtered = inverters?.filter((item) =>
    item.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inversores</h1>
            <p className="text-gray-600 mt-1">
              Biblioteca de inversores disponíveis
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
                  Novo Inversor
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editing && editing.id ? "Editar Inversor" : "Novo Inversor"}
                  </DialogTitle>
                  <DialogDescription>
                    Preencha as especificações técnicas do inversor
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
                          placeholder="Ex: FOXESS"
                          defaultValue={editing?.manufacturer}
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="model">Modelo *</Label>
                        <Input
                          id="model"
                          name="model"
                          placeholder="Ex: Q1-2500-E"
                          defaultValue={editing?.model}
                          required
                        />
                      </div>
                    </div>

                    <h3 className="font-semibold text-sm mt-2">Entrada (CC)</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="nominalPowerDC">Potência Nominal CC (W)</Label>
                        <Input
                          id="nominalPowerDC"
                          name="nominalPowerDC"
                          type="number"
                          placeholder="700"
                          defaultValue={editing?.nominalPowerDC}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="maxPowerDC">Potência Máxima CC (W)</Label>
                        <Input
                          id="maxPowerDC"
                          name="maxPowerDC"
                          type="number"
                          placeholder="700"
                          defaultValue={editing?.maxPowerDC}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="maxVoltageDC">Tensão Máxima de Entrada [V]</Label>
                        <Input
                          id="maxVoltageDC"
                          name="maxVoltageDC"
                          placeholder="60"
                          defaultValue={editing?.maxVoltageDC}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="maxCurrentDC">Corrente de Curto-circuito [A]</Label>
                        <Input
                          id="maxCurrentDC"
                          name="maxCurrentDC"
                          placeholder="20"
                          defaultValue={editing?.maxCurrentDC}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="maxCurrentPerInput">Corrente Máxima por Entrada [A]</Label>
                        <Input
                          id="maxCurrentPerInput"
                          name="maxCurrentPerInput"
                          placeholder="18"
                          defaultValue={editing?.maxCurrentPerInput}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="mpptVoltageMax">Faixa MPPT Máxima [V]</Label>
                        <Input
                          id="mpptVoltageMax"
                          name="mpptVoltageMax"
                          placeholder="60"
                          defaultValue={editing?.mpptVoltageMax}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="mpptVoltageMin">Faixa MPPT Mínima [V]</Label>
                        <Input
                          id="mpptVoltageMin"
                          name="mpptVoltageMin"
                          placeholder="30"
                          defaultValue={editing?.mpptVoltageMin}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="startupVoltageDC">Tensão de Partida [V]</Label>
                        <Input
                          id="startupVoltageDC"
                          name="startupVoltageDC"
                          placeholder="32"
                          defaultValue={editing?.startupVoltageDC}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="numberOfMppt">Quantidade de MPPT</Label>
                        <Input
                          id="numberOfMppt"
                          name="numberOfMppt"
                          type="number"
                          placeholder="4"
                          defaultValue={editing?.numberOfMppt}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="numberOfStrings">Quantidade de Entradas CC</Label>
                        <Input
                          id="numberOfStrings"
                          name="numberOfStrings"
                          type="number"
                          placeholder="4"
                          defaultValue={editing?.numberOfStrings}
                        />
                      </div>
                      <div className="grid gap-2 flex items-end">
                        <Label htmlFor="isMicroinverter" className="flex items-center gap-2 cursor-pointer mt-6">
                          <input
                            type="checkbox"
                            id="isMicroinverter"
                            name="isMicroinverter"
                            className="h-4 w-4"
                            defaultChecked={editing?.isMicroinverter === 1}
                          />
                          <span>É microinversor?</span>
                        </Label>
                      </div>
                    </div>

                    <h3 className="font-semibold text-sm mt-2">Saída (CA)</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="nominalPowerAC">Potência Nominal CA (W) *</Label>
                        <Input
                          id="nominalPowerAC"
                          name="nominalPowerAC"
                          type="number"
                          placeholder="2500"
                          defaultValue={editing?.nominalPowerAC}
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="nominalVoltageAC">Tensão Nominal de Saída [V]</Label>
                        <Input
                          id="nominalVoltageAC"
                          name="nominalVoltageAC"
                          placeholder="220"
                          defaultValue={editing?.nominalVoltageAC}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="nominalFrequency">Frequência Nominal [Hz]</Label>
                        <Input
                          id="nominalFrequency"
                          name="nominalFrequency"
                          placeholder="60"
                          defaultValue={editing?.nominalFrequency}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="maxCurrentAC">Corrente Máxima de Saída [A]</Label>
                        <Input
                          id="maxCurrentAC"
                          name="maxCurrentAC"
                          placeholder="11.36"
                          defaultValue={editing?.maxCurrentAC}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="powerFactor">Fator de Potência</Label>
                        <Input
                          id="powerFactor"
                          name="powerFactor"
                          placeholder=">0.99"
                          defaultValue={editing?.powerFactor}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="thdCurrent">Distorção Harmônica (THD) [%]</Label>
                        <Input
                          id="thdCurrent"
                          name="thdCurrent"
                          placeholder="<3"
                          defaultValue={editing?.thdCurrent}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="connectionType">Tipo Conexão</Label>
                        <Input
                          id="connectionType"
                          name="connectionType"
                          placeholder="1+1+1"
                          defaultValue={editing?.connectionType}
                        />
                      </div>
                    </div>

                    <h3 className="font-semibold text-sm mt-2">Eficiência e Certificação</h3>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="maxEfficiency">Eficiência Máxima (%)</Label>
                        <Input
                          id="maxEfficiency"
                          name="maxEfficiency"
                          placeholder="97.0"
                          defaultValue={editing?.maxEfficiency}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="euEfficiency">Eficiência EU (%)</Label>
                        <Input
                          id="euEfficiency"
                          name="euEfficiency"
                          placeholder="96.7"
                          defaultValue={editing?.euEfficiency}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="mpptEfficiency">Eficiência MPPT (%)</Label>
                        <Input
                          id="mpptEfficiency"
                          name="mpptEfficiency"
                          placeholder="99.9"
                          defaultValue={editing?.mpptEfficiency}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="certificationNumber">Nº Certificação</Label>
                        <Input
                          id="certificationNumber"
                          name="certificationNumber"
                          placeholder="004468/2025"
                          defaultValue={editing?.certificationNumber}
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
                <CardTitle>Biblioteca de Inversores</CardTitle>
                <CardDescription>
                  {inverters?.length || 0} modelo(s) cadastrado(s)
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
                          <div className="p-2 bg-indigo-50 rounded-lg">
                            <Cpu className="h-5 w-5 text-indigo-600" />
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
                          <span className="text-gray-500">Potência CA:</span>
                          <p className="font-semibold">{(item.nominalPowerAC / 1000).toFixed(1)}kW</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Eficiência:</span>
                          <p className="font-semibold">{item.maxEfficiency || "-"}%</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Tensão CA:</span>
                          <p className="font-semibold">{item.nominalVoltageAC || "-"}V</p>
                        </div>
                        <div>
                          <span className="text-gray-500">MPPT:</span>
                          <p className="font-semibold">{item.numberOfMppt || "-"}</p>
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
                            if (confirm("Tem certeza que deseja excluir este inversor?")) {
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
                    ? "Nenhum inversor encontrado."
                    : "Nenhum inversor cadastrado ainda."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
