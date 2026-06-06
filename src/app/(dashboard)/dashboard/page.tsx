// @ts-nocheck
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, DollarSign, Users, TrendingUp, Shield, Plus, ArrowRight, Clock } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "#f5c842", confirmed: "#22d47b",
    completed: "#9D7FD4", cancelled: "#f55a5a", no_show: "#6B6585"
  };
  return <span style={{ width: 8, height: 8, borderRadius: "50%", background: colors[status] ?? "#6B6585", display: "inline-block", flexShrink: 0 }} />;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendente", confirmed: "Confirmado",
  completed: "ConcluÃ­do", cancelled: "Cancelado", no_show: "Faltou"
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("studio_id, name, role").eq("id", user.id).single();

  const isSuperadmin = profile?.role === "superadmin";
  const studioId = profile?.studio_id;

  // â”€â”€ Superadmin sem studio â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (isSuperadmin && !studioId) {
    const [{ data: studios }, { data: appts }] = await Promise.all([
      supabase.from("studios").select("id, is_active"),
      supabase.from("appointments").select("price, status"),
    ]);
    const rev = (appts ?? []).filter(a => a.status === "completed").reduce((s, a) => s + (a.price ?? 0), 0);
    const active = (studios ?? []).filter(s => s.is_active).length;

    return (
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 4 }}>
            <div style={{ width: 48, height: 48, borderRadius: 16, background: "linear-gradient(135deg, #f59e0b 0%, #fcd34d 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 20px rgba(245,158,11,0.35)" }}>
              <Shield size={22} color="#000" />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: "var(--text)" }}>
                OlÃ¡, {profile?.name?.split(" ")[0]} ðŸ‘‹
              </h1>
              <p style={{ fontSize: 13, color: "var(--muted)" }}>VocÃª controla toda a plataforma Nailit</p>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
          {[
            { label: "Studios ativos", value: String(active), sub: `de ${studios?.length ?? 0} total`, color: "#f59e0b" },
            { label: "Agendamentos", value: String(appts?.length ?? 0), sub: "na plataforma", color: "#9D7FD4" },
            { label: "Receita total", value: formatCurrency(rev), sub: "concluÃ­dos", color: "#22d47b" },
          ].map(({ label, value, sub, color }) => (
            <div key={label} className="kpi-card" style={{ "--accent-color": color } as any}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "var(--muted)", marginBottom: 10 }}>{label}</p>
              <p style={{ fontSize: 26, fontWeight: 900, color: "var(--text)" }}>{value}</p>
              <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{sub}</p>
            </div>
          ))}
        </div>

        <Link href="/admin" style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          padding: "16px 24px", borderRadius: 16, textDecoration: "none",
          background: "linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(252,211,77,0.08) 100%)",
          border: "1px solid rgba(245,158,11,0.3)", color: "#f59e0b", fontWeight: 700, fontSize: 15
        }}>
          <Shield size={18} /> Abrir Painel Admin <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  if (!studioId) redirect("/setup");

  const now = new Date();
  const [todayAppts, monthAppts, clients, week7] = await Promise.all([
    supabase.from("appointments").select("id,client_name,service_name,appointment_date,status,price")
      .eq("studio_id", studioId).gte("appointment_date", startOfDay(now).toISOString())
      .lte("appointment_date", endOfDay(now).toISOString()).order("appointment_date"),
    supabase.from("appointments").select("price,status")
      .eq("studio_id", studioId).gte("appointment_date", startOfMonth(now).toISOString())
      .lte("appointment_date", endOfMonth(now).toISOString()),
    supabase.from("clients").select("id", { count: "exact", head: true })
      .eq("studio_id", studioId).eq("is_active", true),
    supabase.from("appointments").select("price,status,appointment_date")
      .eq("studio_id", studioId).gte("appointment_date", subDays(now, 6).toISOString()),
  ]);

  const todayList    = todayAppts.data ?? [];
  const monthList    = monthAppts.data ?? [];
  const monthRevenue = monthList.filter(a => a.status === "completed").reduce((s, a) => s + (a.price ?? 0), 0);
  const pendingToday = todayList.filter(a => ["pending","confirmed"].includes(a.status)).length;
  const completedMonth = monthList.filter(a => a.status === "completed").length;

  const days7 = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(now, 6 - i);
    const key = format(d, "yyyy-MM-dd");
    const rev = (week7.data ?? [])
      .filter(a => a.status === "completed" && a.appointment_date?.startsWith(key))
      .reduce((s, a) => s + (a.price ?? 0), 0);
    return { day: format(d, "EEE", { locale: ptBR }).slice(0, 3), rev };
  });
  const maxRev = Math.max(...days7.map(d => d.rev), 1);

  const KPI = [
    { label: "Hoje",           value: `${todayList.length}`,         sub: `${pendingToday} pendente${pendingToday !== 1 ? "s" : ""}`, icon: Calendar,   color: "#9D7FD4" },
    { label: "Receita do mÃªs", value: formatCurrency(monthRevenue),  sub: `${completedMonth} concluÃ­dos`,                             icon: DollarSign, color: "#22d47b" },
    { label: "Clientes",       value: String(clients.count ?? 0),    sub: "ativas no studio",                                         icon: Users,      color: "#5a9ef5" },
    { label: "TendÃªncia",      value: `${monthList.length}`,          sub: "agendamentos no mÃªs",                                      icon: TrendingUp, color: "#f5c842" },
  ];

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: "var(--text)" }}>
          OlÃ¡, {profile?.name?.split(" ")[0]} âœ¨
        </h1>
        <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>
          {format(now, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14, marginBottom: 20 }}>
        {KPI.map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="kpi-card" style={{ "--accent-color": color } as any}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "var(--muted)", marginBottom: 8 }}>{label}</p>
                <p style={{ fontSize: 24, fontWeight: 900, color: "var(--text)", lineHeight: 1 }}>{value}</p>
                <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 5 }}>{sub}</p>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={18} style={{ color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sparkline + Today */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 14, marginBottom: 20 }}>

        {/* Receita 7 dias */}
        <div className="card" style={{ display: "flex", flexDirection: "column" }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "var(--muted)", marginBottom: 16 }}>Receita â€” 7 dias</p>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 4, flex: 1, height: 60 }}>
            {days7.map(({ day, rev }) => (
              <div key={day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{
                  width: "100%", borderRadius: 4,
                  height: `${Math.max(4, (rev / maxRev) * 50)}px`,
                  background: rev > 0 ? "linear-gradient(to top, #7C5CBF, #9D7FD4)" : "var(--surface3)",
                  transition: "height .3s"
                }} />
                <span style={{ fontSize: 9, color: "var(--muted)" }}>{day}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 13, fontWeight: 800, color: "#22d47b", marginTop: 12 }}>
            {formatCurrency(days7.reduce((s, d) => s + d.rev, 0))}
          </p>
          <p style={{ fontSize: 11, color: "var(--muted)" }}>Ãºltimos 7 dias</p>
        </div>

        {/* Agenda de hoje */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "var(--muted)" }}>
              Agenda de Hoje Â· {todayList.length} agendamento{todayList.length !== 1 ? "s" : ""}
            </p>
            <Link href="/agenda" style={{ fontSize: 12, fontWeight: 700, color: "var(--brand-light)", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
              Ver tudo <ArrowRight size={12} />
            </Link>
          </div>

          {todayList.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <Calendar size={28} style={{ color: "var(--muted)", margin: "0 auto 8px" }} />
              <p style={{ fontSize: 13, color: "var(--muted)" }}>Nenhum agendamento hoje</p>
              <Link href="/agendamentos" style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 12, fontSize: 12, fontWeight: 700, color: "var(--brand-light)", textDecoration: "none" }}>
                <Plus size={13} /> Novo agendamento
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {todayList.slice(0, 5).map(appt => (
                <div key={appt.id} className="table-row">
                  <div style={{ display: "flex", alignItems: "center", gap: 6, width: 52, flexShrink: 0 }}>
                    <Clock size={12} style={{ color: "var(--muted)" }} />
                    <span style={{ fontSize: 13, fontWeight: 800, color: "var(--brand-light)" }}>
                      {format(new Date(appt.appointment_date), "HH:mm")}
                    </span>
                  </div>
                  <StatusDot status={appt.status} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{appt.client_name}</p>
                    <p style={{ fontSize: 11, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{appt.service_name}</p>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#22d47b", flexShrink: 0 }}>{formatCurrency(appt.price)}</span>
                </div>
              ))}
              {todayList.length > 5 && (
                <p style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", marginTop: 4 }}>+{todayList.length - 5} mais</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        {[
          { href: "/agendamentos", label: "Novo agendamento", icon: Plus,       color: "var(--brand)" },
          { href: "/clientes",     label: "Ver clientes",     icon: Users,      color: "#5a9ef5" },
          { href: "/servicos",     label: "Gerenciar serviÃ§os",icon: Calendar,  color: "#9D7FD4" },
          { href: "/relatorios",   label: "RelatÃ³rios",       icon: TrendingUp, color: "#22d47b" },
        ].map(({ href, label, icon: Icon, color }) => (
          <Link key={href} href={href} style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: 8, padding: "16px 8px", borderRadius: 16, textDecoration: "none",
            background: "var(--surface)", border: "1px solid var(--border)",
            color: "var(--muted)", fontSize: 12, fontWeight: 600, textAlign: "center",
            transition: "all .15s"
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon size={18} style={{ color }} />
            </div>
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
