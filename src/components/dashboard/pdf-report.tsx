import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

Font.registerHyphenationCallback((word) => [word]);

const C = {
  purple: "#a855f7",
  dark:   "#1a1a2e",
  muted:  "#64748b",
  light:  "#f8f7ff",
  border: "#e2e8f0",
  green:  "#059669",
  red:    "#dc2626",
  stripe: "#fafafa",
};

const s = StyleSheet.create({
  page:         { backgroundColor: "#fff", fontFamily: "Helvetica", fontSize: 10 },
  header:       { backgroundColor: C.purple, padding: 32, paddingBottom: 28 },
  logo:         { color: "#fff", fontSize: 20, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  headerSub:    { color: "rgba(255,255,255,0.75)", fontSize: 10 },
  body:         { padding: 28 },
  section:      { marginBottom: 22 },
  sectionTitle: {
    fontSize: 8, fontFamily: "Helvetica-Bold", color: C.muted,
    textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10,
  },
  kpiRow:  { flexDirection: "row", gap: 10, marginBottom: 10 },
  kpiBox:  { flex: 1, borderRadius: 8, padding: 12, backgroundColor: C.light },
  kpiVal:  { fontSize: 18, fontFamily: "Helvetica-Bold", color: C.dark },
  kpiLbl:  { fontSize: 8, color: C.muted, marginTop: 3 },
  kpiDlt:  { fontSize: 8, marginTop: 4 },
  tHead:   { flexDirection: "row", backgroundColor: C.light, paddingVertical: 7, paddingHorizontal: 12 },
  tRow:    { flexDirection: "row", paddingVertical: 7, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  th:      { flex: 1, fontSize: 8, fontFamily: "Helvetica-Bold", color: C.muted },
  td:      { flex: 1, fontSize: 9, color: C.dark },
  tdR:     { flex: 1, fontSize: 9, color: C.dark, textAlign: "right" },
  tdCtr:   { flex: 1, fontSize: 9, color: C.dark, textAlign: "center" },
  bar:     { height: 7, borderRadius: 3, backgroundColor: C.purple },
  footer:  {
    position: "absolute", bottom: 20, left: 28, right: 28,
    flexDirection: "row", justifyContent: "space-between",
  },
  footerTxt: { fontSize: 7, color: C.muted },
});

export type PDFReportProps = {
  period:       string;
  revenue:      string;
  revenueDelta: string;
  revenueUp:    boolean;
  appts:        number;
  apptsDelta:   string;
  apptsUp:      boolean;
  cancelados:   number;
  taxaRetencao: number;
  ticketMedio:  string;
  newClients:   number;
  topServices:  { name: string; count: number; revenue: string }[];
  topClients:   { name: string; visits: number; spent: string }[];
  chartData:    { day: string; value: number }[];
  generatedAt:  string;
};

export function DashboardPDFDocument(props: PDFReportProps) {
  const maxChart = Math.max(1, ...props.chartData.map((d) => d.value));
  const recent14 = props.chartData.slice(-14);

  return (
    <Document title={`Relatório — ${props.period}`} author="SuaAgenda.Pro">
      <Page size="A4" style={s.page}>
        {/* ── Header ── */}
        <View style={s.header}>
          <Text style={s.logo}>SuaAgenda.Pro</Text>
          <Text style={[s.headerSub, { marginTop: 6 }]}>Relatório de desempenho</Text>
          <Text style={[s.headerSub, { marginTop: 2 }]}>{props.period}</Text>
        </View>

        <View style={s.body}>
          {/* ── KPIs ── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Métricas principais</Text>

            <View style={s.kpiRow}>
              <View style={[s.kpiBox, { backgroundColor: "#ecfdf5" }]}>
                <Text style={[s.kpiVal, { color: C.green }]}>{props.revenue}</Text>
                <Text style={s.kpiLbl}>Faturamento</Text>
                <Text style={[s.kpiDlt, { color: props.revenueUp ? C.green : C.red }]}>
                  {props.revenueUp ? "▲" : "▼"} {props.revenueDelta} vs anterior
                </Text>
              </View>

              <View style={s.kpiBox}>
                <Text style={s.kpiVal}>{props.appts}</Text>
                <Text style={s.kpiLbl}>Atendimentos</Text>
                <Text style={[s.kpiDlt, { color: props.apptsUp ? C.green : C.red }]}>
                  {props.apptsUp ? "▲" : "▼"} {props.apptsDelta} vs anterior
                </Text>
              </View>

              <View style={s.kpiBox}>
                <Text style={s.kpiVal}>{props.ticketMedio}</Text>
                <Text style={s.kpiLbl}>Ticket médio</Text>
              </View>
            </View>

            <View style={s.kpiRow}>
              <View style={s.kpiBox}>
                <Text style={s.kpiVal}>{props.newClients}</Text>
                <Text style={s.kpiLbl}>Novas clientes</Text>
              </View>

              <View style={[s.kpiBox, props.cancelados > 0 ? { backgroundColor: "#fff1f2" } : {}]}>
                <Text style={[s.kpiVal, props.cancelados > 0 ? { color: C.red } : {}]}>
                  {props.cancelados}
                </Text>
                <Text style={s.kpiLbl}>Cancelamentos</Text>
              </View>

              <View style={[s.kpiBox, { backgroundColor: "#f3e8ff" }]}>
                <Text style={[s.kpiVal, { color: C.purple }]}>{props.taxaRetencao}%</Text>
                <Text style={s.kpiLbl}>Taxa de retenção</Text>
              </View>
            </View>
          </View>

          {/* ── Mini bar chart ── */}
          {recent14.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Receita por dia (últimos 14 dias)</Text>
              <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 3, height: 52 }}>
                {recent14.map((d, i) => (
                  <View key={i} style={{ flex: 1, alignItems: "center", gap: 2 }}>
                    <View
                      style={[
                        s.bar,
                        { width: "100%", height: Math.max(2, Math.round((d.value / maxChart) * 44)) },
                      ]}
                    />
                    {i % 3 === 0 && (
                      <Text style={{ fontSize: 5, color: C.muted }}>{d.day}</Text>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── Top services ── */}
          {props.topServices.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Top serviços</Text>
              <View style={s.tHead}>
                <Text style={[s.th, { flex: 2 }]}>Serviço</Text>
                <Text style={[s.th, { textAlign: "center" }]}>Atendimentos</Text>
                <Text style={[s.th, { textAlign: "right" }]}>Receita</Text>
              </View>
              {props.topServices.map((sv, i) => (
                <View
                  key={i}
                  style={[s.tRow, i % 2 === 0 ? { backgroundColor: C.stripe } : {}]}
                >
                  <Text style={[s.td, { flex: 2 }]}>{sv.name}</Text>
                  <Text style={s.tdCtr}>{sv.count}</Text>
                  <Text style={[s.tdR, { color: C.green }]}>{sv.revenue}</Text>
                </View>
              ))}
            </View>
          )}

          {/* ── Top clients ── */}
          {props.topClients.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Top clientes</Text>
              <View style={s.tHead}>
                <Text style={[s.th, { flex: 2 }]}>Cliente</Text>
                <Text style={[s.th, { textAlign: "center" }]}>Visitas</Text>
                <Text style={[s.th, { textAlign: "right" }]}>Total gasto</Text>
              </View>
              {props.topClients.map((cl, i) => (
                <View
                  key={i}
                  style={[s.tRow, i % 2 === 0 ? { backgroundColor: C.stripe } : {}]}
                >
                  <Text style={[s.td, { flex: 2 }]}>{cl.name}</Text>
                  <Text style={s.tdCtr}>{cl.visits}</Text>
                  <Text style={[s.tdR, { color: C.green }]}>{cl.spent}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── Footer ── */}
        <View style={s.footer}>
          <Text style={s.footerTxt}>
            SuaAgenda.Pro — Gerado em {props.generatedAt}
          </Text>
          <Text style={s.footerTxt}>Confidencial</Text>
        </View>
      </Page>
    </Document>
  );
}
