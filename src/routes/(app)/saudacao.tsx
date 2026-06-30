import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import logoUrl from "@/assets/logo-saudacao.png";

export const Route = createFileRoute("/(app)/saudacao")({
  head: () => ({
    meta: [
      { title: "Boas-vindas — SuaAgenda.Pro" },
      { name: "description", content: "Saudação personalizada após login." },
    ],
  }),
  component: SaudacaoPage,
});

function SaudacaoPage() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string>("Bia Lash");
  const [greeting, setGreeting] = useState("Olá");
  const [seconds, setSeconds] = useState(3);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting("Bom dia");
    else if (hour >= 12 && hour < 18) setGreeting("Boa tarde");
    else setGreeting("Boa noite");
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const name =
          (data.user?.user_metadata?.name as string | undefined) ||
          data.user?.email?.split("@")[0];
        if (name) setUserName(name);
      } catch {
        /* mantém fallback */
      }
    })();
  }, []);

  useEffect(() => {
    if (seconds <= 0) {
      setIsExiting(true);
      const t = setTimeout(() => navigate({ to: "/app" }), 600);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds, navigate]);

  const pct = ((3 - seconds) / 3) * 100;

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        background:
          "linear-gradient(-45deg, #ffe4ef, #fbcfe8, #f9a8d4, #fce7f3, #fbcfe8)",
        backgroundSize: "400% 400%",
        animation: isExiting
          ? "fadeOutScale 0.6s ease forwards"
          : "saudacaoGradient 14s ease infinite",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes saudacaoGradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeOutScale {
          from { opacity: 1; transform: scale(1); }
          to   { opacity: 0; transform: scale(0.92); }
        }
      `}</style>

      {/* Logo no topo */}
      <div
        style={{
          paddingTop: 48,
          display: "flex",
          justifyContent: "center",
          animation: "fadeUp 0.6s ease both",
        }}
      >
        <img
          src={logoUrl}
          alt="SuaAgenda.Pro"
          style={{ height: 64, width: "auto", objectFit: "contain" }}
        />
      </div>

      {/* Centro: saudação + nome — nome centralizado na página, saudação alinhada à esquerda do nome */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 24px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            animation: "fadeUp 0.7s ease both",
          }}
        >
          {/* Saudação acima do nome, alinhada à esquerda do nome */}
          <p
            style={{
              fontSize: "clamp(1rem, 3.5vw, 1.5rem)",
              fontWeight: 500,
              color: "var(--primary)",
              fontFamily: "'Playfair Display', serif",
              margin: 0,
              paddingLeft: 4,
              lineHeight: 1.2,
            }}
          >
            {greeting},
          </p>

          {/* Nome da profissional — grande, premium */}
          <h1
            style={{
              marginTop: 6,
              fontSize: "clamp(3.5rem, 16vw, 7rem)",
              fontWeight: 700,
              lineHeight: 1.0,
              letterSpacing: "-0.04em",
              color: "#171717",
              fontFamily: "'Playfair Display', serif",
              margin: "6px 0 0",
              textAlign: "left",
              wordBreak: "break-word",
            }}
          >
            {userName}
          </h1>

          {/* Mensagem de boas-vindas */}
          <p
            style={{
              marginTop: 14,
              fontSize: "clamp(0.75rem, 2.5vw, 1rem)",
              fontWeight: 400,
              color: "#737373",
              fontFamily: "'Inter', sans-serif",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              margin: "14px 0 0",
              alignSelf: "center",
            }}
          >
            Que bom te ver de novo
          </p>
        </div>
      </div>

      {/* Base: barra full-width + redirecionando + botão */}
      <div
        style={{
          width: "100%",
          padding: "0 0 32px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
      >
        {/* Barra full width */}
        <div
          style={{
            height: 4,
            width: "100%",
            background: "rgba(255,255,255,0.5)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${pct}%`,
              background: "var(--gradient-primary)",
              transition: "width 1s linear",
            }}
          />
        </div>

        <p
          style={{
            fontSize: 13,
            color: "#737373",
            margin: 0,
          }}
        >
          Redirecionando em{" "}
          <span style={{ fontWeight: 700, color: "#171717" }}>{seconds}s</span>
        </p>

        <button
          onClick={() => navigate({ to: "/app" })}
          style={{
            height: 52,
            width: "calc(100% - 48px)",
            maxWidth: 360,
            borderRadius: 16,
            border: "none",
            cursor: "pointer",
            fontSize: 15,
            fontWeight: 600,
            color: "#fff",
            background: "var(--gradient-primary)",
            boxShadow: "var(--shadow-glow)",
          }}
        >
          Ir para o app
        </button>
      </div>
    </div>
  );
}

