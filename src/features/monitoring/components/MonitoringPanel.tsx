import { useEffect, useMemo, useState, type ReactNode } from "react"
import { format } from "date-fns"
import {
  Activity,
  Filter,
  Globe2,
  LaptopMinimal,
  Loader2,
  MapPinned,
  RefreshCcw,
  Route,
  Search,
  Users,
} from "lucide-react"
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, XAxis, YAxis } from "recharts"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import {
  fetchAccessLogs,
  fetchMonitoringDashboard,
} from "@/features/monitoring/services/monitoringService"
import type {
  AccessLogFilters,
  AccessLogResult,
  AccessSummaryDatum,
  MonitoringDashboardData,
  MonitoringRangePreset,
} from "@/features/monitoring/types"

const PAGE_SIZE = 10
const DEVICE_COLORS = ["#1d4ed8", "#f59e0b", "#10b981", "#8b5cf6", "#ef4444"]

const lineChartConfig = {
  total: {
    label: "Acessos",
    color: "#1d4ed8",
  },
}

const barChartConfig = {
  total: {
    label: "Acessos",
    color: "#0f172a",
  },
}

const pieChartConfig = {
  total: {
    label: "Participação",
    color: "#1d4ed8",
  },
}

export function MonitoringPanel() {
  const [preset, setPreset] = useState<MonitoringRangePreset>("7d")
  const [searchDraft, setSearchDraft] = useState("")
  const [pathDraft, setPathDraft] = useState("")
  const [ipDraft, setIpDraft] = useState("")
  const [filters, setFilters] = useState<AccessLogFilters>({
    preset: "7d",
    search: "",
    path: "",
    ip: "",
    page: 1,
    pageSize: PAGE_SIZE,
  })
  const [dashboard, setDashboard] = useState<MonitoringDashboardData | null>(null)
  const [logs, setLogs] = useState<AccessLogResult>({ total: 0, rows: [] })
  const [loadingDashboard, setLoadingDashboard] = useState(true)
  const [loadingLogs, setLoadingLogs] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const totalPages = Math.max(1, Math.ceil(logs.total / filters.pageSize))

  const loadDashboard = async (nextPreset: MonitoringRangePreset) => {
    setLoadingDashboard(true)
    try {
      const response = await fetchMonitoringDashboard(nextPreset)
      setDashboard(response)
      setError(null)
    } catch (err) {
      const description = err instanceof Error ? err.message : "Não foi possível carregar o resumo."
      setError(description)
      toast.error("Falha ao carregar monitoramento", { description })
    } finally {
      setLoadingDashboard(false)
    }
  }

  const loadLogs = async (nextFilters: AccessLogFilters) => {
    setLoadingLogs(true)
    try {
      const response = await fetchAccessLogs(nextFilters)
      setLogs(response)
      setError(null)
    } catch (err) {
      const description = err instanceof Error ? err.message : "Não foi possível carregar os logs."
      setError(description)
      toast.error("Falha ao carregar logs", { description })
    } finally {
      setLoadingLogs(false)
    }
  }

  useEffect(() => {
    void loadDashboard(preset)
  }, [preset])

  useEffect(() => {
    setFilters((current) => (current.preset === preset ? current : { ...current, preset, page: 1 }))
  }, [preset])

  useEffect(() => {
    void loadLogs(filters)
  }, [filters])

  const handleApplyFilters = () => {
    setFilters((current) => ({
      ...current,
      preset,
      search: searchDraft.trim(),
      path: pathDraft.trim(),
      ip: ipDraft.trim(),
      page: 1,
    }))
  }

  const handleResetFilters = () => {
    setSearchDraft("")
    setPathDraft("")
    setIpDraft("")
    setPreset("7d")
    setFilters({
      preset: "7d",
      search: "",
      path: "",
      ip: "",
      page: 1,
      pageSize: PAGE_SIZE,
    })
  }

  const deviceSeries = useMemo(
    () =>
      (dashboard?.top_devices ?? []).map((item, index) => ({
        ...item,
        fill: DEVICE_COLORS[index % DEVICE_COLORS.length],
      })),
    [dashboard]
  )

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
              Monitoramento
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold text-slate-950">Acessos do site em tempo real</h2>
              <p className="max-w-3xl text-sm leading-6 text-slate-600">
                Painel administrativo de sessões ativas, páginas acessadas, origem do tráfego e histórico completo de navegação.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {(["today", "7d", "30d"] as MonitoringRangePreset[]).map((item) => (
              <Button
                key={item}
                type="button"
                variant={preset === item ? "default" : "outline"}
                onClick={() => setPreset(item)}
              >
                {item === "today" ? "Hoje" : item === "7d" ? "Últimos 7 dias" : "Últimos 30 dias"}
              </Button>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void loadDashboard(preset)
                void loadLogs(filters)
              }}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Atualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard title="Acessos hoje" value={dashboard?.accesses_today} icon={<Activity className="h-4 w-4" />} loading={loadingDashboard} />
        <MetricCard title="Últimos 7 dias" value={dashboard?.accesses_last_7_days} icon={<Route className="h-4 w-4" />} loading={loadingDashboard} />
        <MetricCard title="Online agora" value={dashboard?.visitors_online_now} icon={<Users className="h-4 w-4" />} loading={loadingDashboard} />
        <MetricCard
          title="Página líder"
          value={dashboard?.top_page?.label || "-"}
          helper={dashboard?.top_page ? `${dashboard.top_page.total} acessos` : "Sem dados"}
          icon={<LaptopMinimal className="h-4 w-4" />}
          loading={loadingDashboard}
        />
        <MetricCard
          title="Origem principal"
          value={dashboard?.top_country?.label || "-"}
          helper={dashboard?.top_country ? `${dashboard.top_country.total} acessos` : "Sem dados"}
          icon={<Globe2 className="h-4 w-4" />}
          loading={loadingDashboard}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <ChartCard
          title="Acessos por dia"
          description="Volume diário de pageviews dentro do período selecionado."
          loading={loadingDashboard}
        >
          <ChartContainer className="h-[280px]" config={lineChartConfig}>
            <LineChart data={dashboard?.accesses_by_day ?? []} margin={{ left: 12, right: 12 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tickFormatter={(value) => format(new Date(value), "dd/MM")} />
              <YAxis allowDecimals={false} width={32} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="total" stroke="var(--color-total)" strokeWidth={3} dot={false} />
            </LineChart>
          </ChartContainer>
        </ChartCard>

        <ChartCard
          title="Dispositivos"
          description="Distribuição dos acessos por tipo de dispositivo."
          loading={loadingDashboard}
        >
          <ChartContainer className="h-[280px]" config={pieChartConfig}>
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey="label" />} />
              <Pie data={deviceSeries} dataKey="total" nameKey="label" innerRadius={70} outerRadius={105} paddingAngle={3}>
                {deviceSeries.map((entry) => (
                  <Cell key={entry.label} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          <div className="grid gap-2 sm:grid-cols-2">
            {deviceSeries.length ? (
              deviceSeries.map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                    <span className="capitalize text-slate-700">{item.label}</span>
                  </div>
                  <span className="font-semibold text-slate-950">{item.total}</span>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 px-3 py-6 text-center text-sm text-slate-500 sm:col-span-2">
                Nenhum dispositivo registrado ainda.
              </div>
            )}
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <ChartCard title="Páginas mais acessadas" description="Rotas mais visitadas no período." loading={loadingDashboard}>
          <ChartContainer className="h-[280px]" config={barChartConfig}>
            <BarChart data={dashboard?.top_pages ?? []} layout="vertical" margin={{ left: 16, right: 16 }}>
              <CartesianGrid horizontal={false} strokeDasharray="3 3" />
              <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} />
              <YAxis dataKey="label" type="category" width={120} axisLine={false} tickLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="total" fill="var(--color-total)" radius={8} />
            </BarChart>
          </ChartContainer>
        </ChartCard>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Origem e tráfego</CardTitle>
            <CardDescription>Países e referers predominantes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <BreakdownList title="Países" items={dashboard?.top_countries ?? []} icon={<MapPinned className="h-4 w-4" />} loading={loadingDashboard} />
            <BreakdownList title="Referers" items={dashboard?.top_referrers ?? []} icon={<Globe2 className="h-4 w-4" />} loading={loadingDashboard} />
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Últimos acessos</CardTitle>
              <CardDescription>Busca, filtro por página, IP e faixa recente com paginação.</CardDescription>
            </div>
            <Badge variant="outline" className="w-fit rounded-full px-3 py-1 text-xs uppercase tracking-[0.16em]">
              {logs.total} registros
            </Badge>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.2fr_1fr_1fr_auto_auto]">
            <Input value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} placeholder="Busca geral por página, IP, navegador, cidade..." />
            <Input value={pathDraft} onChange={(event) => setPathDraft(event.target.value)} placeholder="Filtrar por página / rota" />
            <Input value={ipDraft} onChange={(event) => setIpDraft(event.target.value)} placeholder="Filtrar por IP" />
            <Button type="button" onClick={handleApplyFilters}>
              <Search className="mr-2 h-4 w-4" />
              Buscar
            </Button>
            <Button type="button" variant="outline" onClick={handleResetFilters}>
              <Filter className="mr-2 h-4 w-4" />
              Limpar
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
          )}

          <div className="hidden xl:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/hora</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Página</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Navegador / dispositivo</TableHead>
                  <TableHead>Referer</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingLogs ? (
                  Array.from({ length: 6 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell colSpan={7}>
                        <Skeleton className="h-12 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : logs.rows.length ? (
                  logs.rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <div className="font-medium text-slate-900">{format(new Date(row.created_at), "dd/MM/yyyy")}</div>
                        <div className="text-xs text-slate-500">{format(new Date(row.created_at), "HH:mm:ss")}</div>
                      </TableCell>
                      <TableCell>{row.ip || "-"}</TableCell>
                      <TableCell>
                        <div className="font-medium text-slate-900">{row.path}</div>
                        <div className="text-xs text-slate-500">{row.page_title || row.host || "-"}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-slate-900">{formatGeo(row)}</div>
                        <div className="text-xs text-slate-500 uppercase tracking-[0.14em]">{row.app_section || "site"}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-slate-900">{row.browser || "Desconhecido"}</div>
                        <div className="text-xs text-slate-500">
                          {row.os || "SO desconhecido"} · {row.device_type || "desktop"}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[220px] truncate">{row.referer || "Direto"}</TableCell>
                      <TableCell>
                        <StatusBadge online={row.is_online} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <Empty className="border-slate-200">
                        <EmptyHeader>
                          <EmptyMedia variant="icon">
                            <Activity className="h-5 w-5" />
                          </EmptyMedia>
                          <EmptyTitle>Sem acessos para os filtros atuais</EmptyTitle>
                          <EmptyDescription>Ajuste os filtros ou aguarde novos pageviews do site.</EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="grid gap-3 xl:hidden">
            {loadingLogs ? (
              Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-32 w-full rounded-3xl" />)
            ) : logs.rows.length ? (
              logs.rows.map((row) => (
                <div key={row.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-950">{row.path}</div>
                      <div className="text-xs text-slate-500">{format(new Date(row.created_at), "dd/MM/yyyy HH:mm:ss")}</div>
                    </div>
                    <StatusBadge online={row.is_online} />
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                    <div><span className="font-medium text-slate-900">IP:</span> {row.ip || "-"}</div>
                    <div><span className="font-medium text-slate-900">Origem:</span> {formatGeo(row)}</div>
                    <div><span className="font-medium text-slate-900">Navegador:</span> {row.browser || "-"}</div>
                    <div><span className="font-medium text-slate-900">Dispositivo:</span> {row.device_type || "-"}</div>
                    <div className="sm:col-span-2"><span className="font-medium text-slate-900">Referer:</span> {row.referer || "Direto"}</div>
                  </div>
                </div>
              ))
            ) : (
              <Empty className="border-slate-200">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Activity className="h-5 w-5" />
                  </EmptyMedia>
                  <EmptyTitle>Sem acessos para os filtros atuais</EmptyTitle>
                  <EmptyDescription>Ajuste os filtros ou aguarde novos pageviews do site.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-slate-500">
              Página {filters.page} de {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={filters.page <= 1 || loadingLogs}
                onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))}
              >
                Anterior
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={filters.page >= totalPages || loadingLogs}
                onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}
              >
                Próxima
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function MetricCard({
  title,
  value,
  helper,
  icon,
  loading,
}: {
  title: string
  value: string | number | undefined
  helper?: string
  icon: ReactNode
  loading: boolean
}) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{title}</span>
          <span className="rounded-full border border-slate-200 bg-slate-50 p-2 text-slate-600">{icon}</span>
        </div>
        {loading ? (
          <>
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-4 w-32" />
          </>
        ) : (
          <>
            <div className="text-3xl font-bold tracking-tight text-slate-950">{value ?? "-"}</div>
            <div className="text-sm text-slate-500">{helper || "Atualização em tempo real"}</div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function ChartCard({
  title,
  description,
  loading,
  children,
}: {
  title: string
  description: string
  loading: boolean
  children: ReactNode
}) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{loading ? <Skeleton className="h-[320px] w-full rounded-3xl" /> : children}</CardContent>
    </Card>
  )
}

function BreakdownList({
  title,
  items,
  icon,
  loading,
}: {
  title: string
  items: AccessSummaryDatum[]
  icon: ReactNode
  loading: boolean
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
        <span className="text-slate-500">{icon}</span>
        {title}
      </div>
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full rounded-2xl" />
          <Skeleton className="h-12 w-full rounded-2xl" />
        </div>
      ) : items.length ? (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={`${title}-${item.label}`} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm">
              <span className="text-slate-700">{item.label}</span>
              <span className="font-semibold text-slate-950">{item.total}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 px-3 py-6 text-center text-sm text-slate-500">
          Sem dados neste período.
        </div>
      )}
    </div>
  )
}

function StatusBadge({ online }: { online: boolean }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full px-3 py-1 text-xs font-semibold",
        online ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-600"
      )}
    >
      {online ? "Online recente" : "Offline"}
    </Badge>
  )
}

function formatGeo(row: {
  city: string | null
  region: string | null
  country: string | null
}) {
  const parts = [row.city, row.region, row.country].filter(Boolean)
  return parts.length ? parts.join(" / ") : "Não identificado"
}
