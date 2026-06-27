import React, { useState } from 'react';
import { ChevronDown, Palette, Type, Layout } from 'lucide-react';

const TemplatePreview = () => {
  const [expandedTemplate, setExpandedTemplate] = useState(null);

  const themes = [
    {
      id: 'luxe_gold',
      name: 'Luxe Gold',
      category: 'LUXE',
      description: 'Elegância sofisticada em preto e ouro',
      colors: {
        primary: '#1a1a1a',
        secondary: '#d4af37',
        accent: '#e8dcc8',
        background: '#0d0d0d',
        text: '#ffffff',
        textSecondary: '#b0b0b0'
      },
      typography: {
        heading: 'Playfair Display',
        body: 'Lato',
        accent: 'Cormorant Garamond'
      },
      segments: ['Esteticistas Premium', 'Hair Designers', 'Consultores de Imagem'],
      components: ['Header Premium', 'Cards Elevados', 'Serviços com Imagem', 'Reviews Minimalista']
    },
    {
      id: 'luxe_copper',
      name: 'Luxe Copper',
      category: 'LUXE',
      description: 'Elegância sofisticada em preto e cobre',
      colors: {
        primary: '#1a1a1a',
        secondary: '#b8860b',
        accent: '#d2a679',
        background: '#0d0d0d',
        text: '#ffffff',
        textSecondary: '#b0b0b0'
      },
      typography: {
        heading: 'Playfair Display',
        body: 'Lato',
        accent: 'Cormorant Garamond'
      },
      segments: ['Esteticistas Premium', 'Barbeiros Upscale'],
      components: ['Header Premium', 'Cards Elevados', 'Serviços com Imagem', 'Reviews Minimalista']
    },
    {
      id: 'luxe_silver',
      name: 'Luxe Silver',
      category: 'LUXE',
      description: 'Elegância sofisticada em preto e prata',
      colors: {
        primary: '#1a1a1a',
        secondary: '#c0c0c0',
        accent: '#e8e8e8',
        background: '#0d0d0d',
        text: '#ffffff',
        textSecondary: '#b0b0b0'
      },
      typography: {
        heading: 'Playfair Display',
        body: 'Lato',
        accent: 'Cormorant Garamond'
      },
      segments: ['Clínicas Premium', 'Dentistas Sofisticados'],
      components: ['Header Premium', 'Cards Elevados', 'Serviços com Imagem', 'Reviews Minimalista']
    },
    {
      id: 'bloom_soft',
      name: 'Bloom Soft',
      category: 'BLOOM',
      description: 'Delicadeza natural em rosa claro e marrom',
      colors: {
        primary: '#f5e6e3',
        secondary: '#d4a5a5',
        accent: '#8b6f47',
        background: '#faf8f7',
        text: '#3d3d3d',
        textSecondary: '#8b8b8b'
      },
      typography: {
        heading: 'Montserrat',
        body: 'Open Sans',
        accent: 'Great Vibes'
      },
      segments: ['Beauty Coaches', 'Skincare Specialists', 'Bem-estar'],
      components: ['Header com Decoração Floral', 'Cards Arredondados', 'Ícones Natureza', 'Reviews Aconchego']
    },
    {
      id: 'bloom_pearl',
      name: 'Bloom Pearl',
      category: 'BLOOM',
      description: 'Delicadeza natural em rosa claro e bege quente',
      colors: {
        primary: '#f5e6e3',
        secondary: '#e8d4c8',
        accent: '#d4a574',
        background: '#faf8f7',
        text: '#3d3d3d',
        textSecondary: '#8b8b8b'
      },
      typography: {
        heading: 'Montserrat',
        body: 'Open Sans',
        accent: 'Great Vibes'
      },
      segments: ['Manicure & Pedicure', 'Estética Corporal'],
      components: ['Header com Decoração Floral', 'Cards Arredondados', 'Ícones Natureza', 'Reviews Aconchego']
    },
    {
      id: 'glow_pink',
      name: 'Glow Pink',
      category: 'GLOW HOT',
      description: 'Feminino vibrante em rosa hot e roxo',
      colors: {
        primary: '#ff1493',
        secondary: '#9370db',
        accent: '#ffc0cb',
        background: '#fff5f8',
        text: '#2d2d2d',
        textSecondary: '#666666'
      },
      typography: {
        heading: 'Poppins',
        body: 'Quicksand',
        accent: 'Satisfy'
      },
      segments: ['Nail Art Designers', 'Manicure Criativo', 'Styling & Moda'],
      components: ['Header Dinâmico', 'Cards Coloridos', 'Badges Divertidos', 'Reviews Alegres']
    },
    {
      id: 'glow_coral',
      name: 'Glow Coral',
      category: 'GLOW HOT',
      description: 'Feminino vibrante em rosa hot e coral',
      colors: {
        primary: '#ff1493',
        secondary: '#ff7f50',
        accent: '#ffa07a',
        background: '#fff5f8',
        text: '#2d2d2d',
        textSecondary: '#666666'
      },
      typography: {
        heading: 'Poppins',
        body: 'Quicksand',
        accent: 'Satisfy'
      },
      segments: ['Estética Facial', 'Maquiagem Criativa'],
      components: ['Header Dinâmico', 'Cards Coloridos', 'Badges Divertidos', 'Reviews Alegres']
    },
    {
      id: 'bold_teal',
      name: 'Bold Teal',
      category: 'BOLD',
      description: 'Moderno vibrante em teal e verde menta',
      colors: {
        primary: '#008b8b',
        secondary: '#20b2aa',
        accent: '#40e0d0',
        background: '#f0f8f8',
        text: '#1a1a1a',
        textSecondary: '#4a4a4a'
      },
      typography: {
        heading: 'Montserrat Bold',
        body: 'Inter',
        accent: 'Poppins'
      },
      segments: ['Barbeiros Modernos', 'Salões Jovens', 'Pet Grooming'],
      components: ['Header Geométrico', 'Cards com Ícones', 'CTA Vibrante', 'Reviews Moderno']
    },
    {
      id: 'bold_emerald',
      name: 'Bold Emerald',
      category: 'BOLD',
      description: 'Moderno vibrante em verde escuro e ouro',
      colors: {
        primary: '#1b4332',
        secondary: '#2d6a4f',
        accent: '#d4af37',
        background: '#f1f9f6',
        text: '#1a1a1a',
        textSecondary: '#4a4a4a'
      },
      typography: {
        heading: 'Montserrat Bold',
        body: 'Inter',
        accent: 'Poppins'
      },
      segments: ['Salões Premium Modernos', 'Spa Boutique'],
      components: ['Header Geométrico', 'Cards com Ícones', 'CTA Vibrante', 'Reviews Moderno']
    },
    {
      id: 'bold_ocean',
      name: 'Bold Ocean',
      category: 'BOLD',
      description: 'Moderno vibrante em azul escuro e turquesa',
      colors: {
        primary: '#0a3d62',
        secondary: '#3498db',
        accent: '#1abc9c',
        background: '#ecf0f1',
        text: '#1a1a1a',
        textSecondary: '#4a4a4a'
      },
      typography: {
        heading: 'Montserrat Bold',
        body: 'Inter',
        accent: 'Poppins'
      },
      segments: ['Clínicas Modernas', 'Dentistas Jovens'],
      components: ['Header Geométrico', 'Cards com Ícones', 'CTA Vibrante', 'Reviews Moderno']
    },
    {
      id: 'pure_neutral',
      name: 'Pure Neutral',
      category: 'PURE',
      description: 'Profissional limpo em bege e cinza',
      colors: {
        primary: '#f5f5f5',
        secondary: '#d4d4d4',
        accent: '#999999',
        background: '#ffffff',
        text: '#2d2d2d',
        textSecondary: '#666666'
      },
      typography: {
        heading: 'Roboto',
        body: 'Open Sans',
        accent: 'Lato'
      },
      segments: ['Dentistas', 'Clínicas', 'Fisioterapia', 'Iniciantes'],
      components: ['Header Simples', 'Cards Limpos', 'Layout Grid', 'Reviews Clara']
    },
    {
      id: 'pure_slate',
      name: 'Pure Slate',
      category: 'PURE',
      description: 'Profissional limpo em cinza e azul suave',
      colors: {
        primary: '#e8eef2',
        secondary: '#b8c5d6',
        accent: '#5a7a94',
        background: '#ffffff',
        text: '#2d2d2d',
        textSecondary: '#666666'
      },
      typography: {
        heading: 'Roboto',
        body: 'Open Sans',
        accent: 'Lato'
      },
      segments: ['Clínicas Médicas', 'Consultórios', 'Profissional Sereno'],
      components: ['Header Simples', 'Cards Limpos', 'Layout Grid', 'Reviews Clara']
    }
  ];

  const ColorSwatch = ({ color, label }) => (
    <div className="flex flex-col items-center gap-2">
      <div
        className="w-16 h-16 rounded-lg border border-gray-300 shadow-sm"
        style={{ backgroundColor: color }}
      />
      <p className="text-xs font-mono text-gray-600">{color}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );

  const TemplateCard = ({ theme }) => (
    <div
      className="bg-white rounded-xl border-2 overflow-hidden shadow-md hover:shadow-lg transition-all cursor-pointer"
      style={{ borderColor: theme.colors.secondary }}
    >
      {/* Preview Visual */}
      <div
        className="h-40 flex flex-col justify-between p-4"
        style={{
          backgroundColor: theme.colors.background,
          color: theme.colors.text
        }}
      >
        <div>
          <h3
            className="text-2xl font-bold mb-2"
            style={{ fontFamily: theme.typography.heading }}
          >
            {theme.name}
          </h3>
          <p
            className="text-sm opacity-80"
            style={{ color: theme.colors.textSecondary }}
          >
            {theme.description}
          </p>
        </div>
        <div className="flex gap-2">
          <div
            className="w-4 h-4 rounded"
            style={{ backgroundColor: theme.colors.primary }}
          />
          <div
            className="w-4 h-4 rounded"
            style={{ backgroundColor: theme.colors.secondary }}
          />
          <div
            className="w-4 h-4 rounded"
            style={{ backgroundColor: theme.colors.accent }}
          />
        </div>
      </div>

      {/* Info */}
      <div className="p-4 border-t">
        <p className="text-xs font-semibold text-gray-500 mb-3">
          {theme.category}
        </p>
        <button
          onClick={() =>
            setExpandedTemplate(
              expandedTemplate === theme.id ? null : theme.id
            )
          }
          className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
        >
          <span>Ver Detalhes</span>
          <ChevronDown
            size={16}
            className={`transition-transform ${
              expandedTemplate === theme.id ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      {/* Expanded Details */}
      {expandedTemplate === theme.id && (
        <div className="p-4 border-t bg-gray-50 space-y-4">
          {/* Cores */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Palette size={16} className="text-gray-700" />
              <h4 className="font-semibold text-sm text-gray-800">Paleta</h4>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <ColorSwatch color={theme.colors.primary} label="Primary" />
              <ColorSwatch color={theme.colors.secondary} label="Secondary" />
              <ColorSwatch color={theme.colors.accent} label="Accent" />
            </div>
          </div>

          {/* Tipografia */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Type size={16} className="text-gray-700" />
              <h4 className="font-semibold text-sm text-gray-800">
                Tipografia
              </h4>
            </div>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Heading:</strong> {theme.typography.heading}
              </p>
              <p>
                <strong>Body:</strong> {theme.typography.body}
              </p>
              <p>
                <strong>Accent:</strong> {theme.typography.accent}
              </p>
            </div>
          </div>

          {/* Segmentos */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Layout size={16} className="text-gray-700" />
              <h4 className="font-semibold text-sm text-gray-800">
                Ideal Para
              </h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {theme.segments.map((segment, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-700"
                >
                  {segment}
                </span>
              ))}
            </div>
          </div>

          {/* Componentes */}
          <div>
            <h4 className="font-semibold text-sm text-gray-800 mb-2">
              Componentes
            </h4>
            <div className="flex flex-wrap gap-2">
              {theme.components.map((comp, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 rounded text-xs font-medium"
                  style={{
                    backgroundColor: theme.colors.accent,
                    color: theme.colors.primary
                  }}
                >
                  {comp}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const categories = ['LUXE', 'BLOOM', 'GLOW HOT', 'BOLD', 'PURE'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            SuaAgenda.Pro — Galeria de Templates
          </h1>
          <p className="text-lg text-gray-600">
            13 templates profissionais com paletas de cores e tipografias
            customizadas
          </p>
          <p className="text-sm text-gray-500 mt-2">
            ✨ Clique em "Ver Detalhes" para explorar cores, fontes e segmentos
            alvo
          </p>
        </div>

        {/* Templates por Categoria */}
        {categories.map((category) => (
          <div key={category} className="mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-3 border-b-2 border-gray-300">
              {category}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {themes
                .filter((t) => t.category === category)
                .map((theme) => (
                  <TemplateCard key={theme.id} theme={theme} />
                ))}
            </div>
          </div>
        ))}

        {/* Footer Info */}
        <div className="mt-12 p-6 bg-white rounded-lg border border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-3">📋 Próximas Etapas</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>✅ Escolher template base e variações de cores</li>
            <li>✅ Sistema de customização individual mantém dados entre temas</li>
            <li>✅ Profissional pode mudar template sem perder configurações</li>
            <li>✅ Implementação em React com Context + TypeScript</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TemplatePreview;
