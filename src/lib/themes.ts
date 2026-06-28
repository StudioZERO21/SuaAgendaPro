/**
 * Theme definitions for the public professional page.
 * Colors/fonts/shapes extracted from docs/NovoSDesigner/Página Pública - SuaAgenda.dc.html
 */

export type ThemeId =
  | 'luxe_gold' | 'luxe_copper' | 'luxe_silver'
  | 'bloom_soft' | 'bloom_pearl'
  | 'glow_pink' | 'glow_coral'
  | 'bold_teal' | 'bold_emerald' | 'bold_ocean'
  | 'pure_neutral' | 'pure_slate'
  | 'urban_noir' | 'urban_steel' | 'urban_rust';

export type HeroStyle = 'premium' | 'soft' | 'vibrant' | 'bold' | 'simple' | 'cinematic';
export type ThemeCategory = 'LUXE' | 'BLOOM' | 'GLOW HOT' | 'BOLD' | 'PURE' | 'URBAN';

export interface ThemeColors {
  bg: string;
  surface: string;
  card: string;
  primary: string;
  text: string;
  textSec: string;
  border: string;
  hero: string;
  ctaBg: string;
  ctaText: string;
  pickerBg: string;
  sectionTitle: string;
  starColor: string;
  serviceIcon: string;
  footerBg: string;
  tagBg: string;
  profileRing: string;
}

export interface ThemeFonts {
  heading: string;
  body: string;
  accent: string;
}

export interface ThemeShape {
  card: string;
  btn: string;
  photo: string;
}

export interface Theme {
  id: ThemeId;
  name: string;
  category: ThemeCategory;
  heroStyle: HeroStyle;
  colors: ThemeColors;
  fonts: ThemeFonts;
  shape: ThemeShape;
  shadowStyle: string;
  portfolioGradients: string[];
  portfolioOverlay: string;
  portfolioLabelColor: string;
}

export const THEMES: Record<ThemeId, Theme> = {
  luxe_gold: {
    id: 'luxe_gold', name: 'Luxe Gold', category: 'LUXE', heroStyle: 'premium',
    colors: { bg:'#0d0d0d', surface:'#151515', card:'#1e1e1e', primary:'#d4af37', text:'#ffffff', textSec:'#9a9a9a', border:'#2a2a2a', hero:'linear-gradient(180deg,#0a0a0a 0%,#1a1500 100%)', ctaBg:'#d4af37', ctaText:'#0d0d0d', pickerBg:'#151515', sectionTitle:'#d4af37', starColor:'#d4af37', serviceIcon:'#d4af37', footerBg:'#0a0a0a', tagBg:'rgba(212,175,55,0.12)', profileRing:'#d4af37' },
    fonts: { heading:"'Playfair Display', serif", body:"'Lato', sans-serif", accent:"'Cormorant Garamond', serif" },
    shape: { card:'8px', btn:'4px', photo:'4px' },
    shadowStyle: '0 4px 20px rgba(0,0,0,0.5)',
    portfolioGradients: ['linear-gradient(135deg,#1a1500 0%,#2d2400 100%)','linear-gradient(135deg,#0d1200 0%,#1a2000 100%)','linear-gradient(135deg,#12001a 0%,#200028 100%)','linear-gradient(135deg,#1a0005 0%,#280008 100%)','linear-gradient(135deg,#00121a 0%,#001a28 100%)','linear-gradient(135deg,#1a1a12 0%,#282820 100%)'],
    portfolioOverlay: 'linear-gradient(to top,rgba(0,0,0,0.88) 0%,transparent 55%)', portfolioLabelColor: '#d4af37',
  },
  luxe_copper: {
    id: 'luxe_copper', name: 'Luxe Copper', category: 'LUXE', heroStyle: 'premium',
    colors: { bg:'#0d0d0d', surface:'#151515', card:'#1e1e1e', primary:'#c8762a', text:'#ffffff', textSec:'#9a9a9a', border:'#2a2a2a', hero:'linear-gradient(180deg,#0a0a0a 0%,#1a1100 100%)', ctaBg:'#c8762a', ctaText:'#ffffff', pickerBg:'#151515', sectionTitle:'#c8762a', starColor:'#c8762a', serviceIcon:'#c8762a', footerBg:'#0a0a0a', tagBg:'rgba(200,118,42,0.12)', profileRing:'#c8762a' },
    fonts: { heading:"'Playfair Display', serif", body:"'Lato', sans-serif", accent:"'Cormorant Garamond', serif" },
    shape: { card:'8px', btn:'4px', photo:'4px' },
    shadowStyle: '0 4px 20px rgba(0,0,0,0.5)',
    portfolioGradients: ['linear-gradient(135deg,#1a1000 0%,#2d1c00 100%)','linear-gradient(135deg,#120d00 0%,#201800 100%)','linear-gradient(135deg,#0d0a12 0%,#180d20 100%)','linear-gradient(135deg,#1a0d00 0%,#281800 100%)','linear-gradient(135deg,#001a0d 0%,#002820 100%)','linear-gradient(135deg,#181200 0%,#282000 100%)'],
    portfolioOverlay: 'linear-gradient(to top,rgba(0,0,0,0.88) 0%,transparent 55%)', portfolioLabelColor: '#c8762a',
  },
  luxe_silver: {
    id: 'luxe_silver', name: 'Luxe Silver', category: 'LUXE', heroStyle: 'premium',
    colors: { bg:'#0d0d0d', surface:'#151515', card:'#1e1e1e', primary:'#c0c0c0', text:'#ffffff', textSec:'#9a9a9a', border:'#2a2a2a', hero:'linear-gradient(180deg,#0a0a0a 0%,#1a1a1a 100%)', ctaBg:'#c0c0c0', ctaText:'#0d0d0d', pickerBg:'#151515', sectionTitle:'#c0c0c0', starColor:'#c0c0c0', serviceIcon:'#c0c0c0', footerBg:'#0a0a0a', tagBg:'rgba(192,192,192,0.12)', profileRing:'#c0c0c0' },
    fonts: { heading:"'Playfair Display', serif", body:"'Lato', sans-serif", accent:"'Cormorant Garamond', serif" },
    shape: { card:'8px', btn:'4px', photo:'4px' },
    shadowStyle: '0 4px 20px rgba(0,0,0,0.5)',
    portfolioGradients: ['linear-gradient(135deg,#1a1a1a 0%,#2d2d2d 100%)','linear-gradient(135deg,#121212 0%,#202020 100%)','linear-gradient(135deg,#0d0d18 0%,#18182a 100%)','linear-gradient(135deg,#180d0d 0%,#2a1818 100%)','linear-gradient(135deg,#0d180d 0%,#182a18 100%)','linear-gradient(135deg,#181818 0%,#2a2a2a 100%)'],
    portfolioOverlay: 'linear-gradient(to top,rgba(0,0,0,0.88) 0%,transparent 55%)', portfolioLabelColor: '#c0c0c0',
  },
  bloom_soft: {
    id: 'bloom_soft', name: 'Bloom Soft', category: 'BLOOM', heroStyle: 'soft',
    colors: { bg:'#faf8f7', surface:'#f5ece9', card:'#ffffff', primary:'#c98b8b', text:'#3d3d3d', textSec:'#8b8b8b', border:'#ebd5cc', hero:'linear-gradient(135deg,#f5ece9 0%,#f0d8d4 50%,#faf8f7 100%)', ctaBg:'#c98b8b', ctaText:'#ffffff', pickerBg:'#faf8f7', sectionTitle:'#8b6f47', starColor:'#d4af37', serviceIcon:'#c98b8b', footerBg:'#f5ece9', tagBg:'rgba(201,139,139,0.12)', profileRing:'#c98b8b' },
    fonts: { heading:"'Montserrat', sans-serif", body:"'Open Sans', sans-serif", accent:"'Great Vibes', cursive" },
    shape: { card:'16px', btn:'24px', photo:'12px' },
    shadowStyle: '0 2px 12px rgba(201,139,139,0.2)',
    portfolioGradients: ['linear-gradient(135deg,#fce4ec 0%,#f8bbd9 100%)','linear-gradient(135deg,#fff3e0 0%,#ffcc80 100%)','linear-gradient(135deg,#fce4ec 0%,#ef9a9a 100%)','linear-gradient(135deg,#f3e5f5 0%,#ce93d8 100%)','linear-gradient(135deg,#e8f5e9 0%,#a5d6a7 100%)','linear-gradient(135deg,#e3f2fd 0%,#90caf9 100%)'],
    portfolioOverlay: 'linear-gradient(to top,rgba(255,255,255,0.88) 0%,transparent 50%)', portfolioLabelColor: '#8b6f47',
  },
  bloom_pearl: {
    id: 'bloom_pearl', name: 'Bloom Pearl', category: 'BLOOM', heroStyle: 'soft',
    colors: { bg:'#faf8f7', surface:'#f5ece9', card:'#ffffff', primary:'#d4a574', text:'#3d3d3d', textSec:'#8b8b8b', border:'#ebd5cc', hero:'linear-gradient(135deg,#f7ede8 0%,#f0e0d6 50%,#faf8f7 100%)', ctaBg:'#d4a574', ctaText:'#ffffff', pickerBg:'#faf8f7', sectionTitle:'#d4a574', starColor:'#d4af37', serviceIcon:'#d4a574', footerBg:'#f5ece9', tagBg:'rgba(212,165,116,0.12)', profileRing:'#d4a574' },
    fonts: { heading:"'Montserrat', sans-serif", body:"'Open Sans', sans-serif", accent:"'Great Vibes', cursive" },
    shape: { card:'16px', btn:'24px', photo:'12px' },
    shadowStyle: '0 2px 12px rgba(212,165,116,0.2)',
    portfolioGradients: ['linear-gradient(135deg,#ffeaa7 0%,#fdcb6e 100%)','linear-gradient(135deg,#ffecd2 0%,#fcb69f 100%)','linear-gradient(135deg,#a1c4fd 0%,#c2e9fb 100%)','linear-gradient(135deg,#fccb90 0%,#d57eeb 100%)','linear-gradient(135deg,#e0c3fc 0%,#8ec5fc 100%)','linear-gradient(135deg,#f093fb 0%,#f5576c 100%)'],
    portfolioOverlay: 'linear-gradient(to top,rgba(255,255,255,0.88) 0%,transparent 50%)', portfolioLabelColor: '#8b6f47',
  },
  glow_pink: {
    id: 'glow_pink', name: 'Glow Pink', category: 'GLOW HOT', heroStyle: 'vibrant',
    colors: { bg:'#fff5f8', surface:'#ffecf3', card:'#ffffff', primary:'#ff1493', text:'#2d2d2d', textSec:'#666666', border:'#ffe0ec', hero:'linear-gradient(135deg,#ff1493 0%,#9370db 100%)', ctaBg:'#ff1493', ctaText:'#ffffff', pickerBg:'#ffffff', sectionTitle:'#ff1493', starColor:'#ff9500', serviceIcon:'#ff1493', footerBg:'#ffecf3', tagBg:'rgba(255,20,147,0.08)', profileRing:'#ff1493' },
    fonts: { heading:"'Poppins', sans-serif", body:"'Quicksand', sans-serif", accent:"'Satisfy', cursive" },
    shape: { card:'12px', btn:'20px', photo:'12px' },
    shadowStyle: '0 4px 16px rgba(255,20,147,0.15)',
    portfolioGradients: ['linear-gradient(135deg,#ff80ab 0%,#ea80fc 100%)','linear-gradient(135deg,#f48fb1 0%,#f06292 100%)','linear-gradient(135deg,#ce93d8 0%,#ba68c8 100%)','linear-gradient(135deg,#ff80ab 0%,#ff4081 100%)','linear-gradient(135deg,#e040fb 0%,#aa00ff 100%)','linear-gradient(135deg,#ff6e7f 0%,#bfe9ff 100%)'],
    portfolioOverlay: 'linear-gradient(to top,rgba(180,0,100,0.72) 0%,transparent 55%)', portfolioLabelColor: '#ffffff',
  },
  glow_coral: {
    id: 'glow_coral', name: 'Glow Coral', category: 'GLOW HOT', heroStyle: 'vibrant',
    colors: { bg:'#fff5f0', surface:'#fff0eb', card:'#ffffff', primary:'#ff6b35', text:'#2d2d2d', textSec:'#666666', border:'#ffe0d0', hero:'linear-gradient(135deg,#ff4757 0%,#ff6b35 100%)', ctaBg:'#ff6b35', ctaText:'#ffffff', pickerBg:'#ffffff', sectionTitle:'#ff6b35', starColor:'#ff9500', serviceIcon:'#ff6b35', footerBg:'#fff0eb', tagBg:'rgba(255,107,53,0.1)', profileRing:'#ff6b35' },
    fonts: { heading:"'Poppins', sans-serif", body:"'Quicksand', sans-serif", accent:"'Satisfy', cursive" },
    shape: { card:'12px', btn:'20px', photo:'12px' },
    shadowStyle: '0 4px 16px rgba(255,107,53,0.2)',
    portfolioGradients: ['linear-gradient(135deg,#ff9a9e 0%,#fecfef 100%)','linear-gradient(135deg,#ffecd2 0%,#fcb69f 100%)','linear-gradient(135deg,#ff6e7f 0%,#bfe9ff 100%)','linear-gradient(135deg,#ffb347 0%,#ffcc33 100%)','linear-gradient(135deg,#f093fb 0%,#f5576c 100%)','linear-gradient(135deg,#fc5c7d 0%,#6a3093 100%)'],
    portfolioOverlay: 'linear-gradient(to top,rgba(200,60,0,0.72) 0%,transparent 55%)', portfolioLabelColor: '#ffffff',
  },
  bold_teal: {
    id: 'bold_teal', name: 'Bold Teal', category: 'BOLD', heroStyle: 'bold',
    colors: { bg:'#f0f8f8', surface:'#e0f0f0', card:'#ffffff', primary:'#008b8b', text:'#1a1a1a', textSec:'#4a4a4a', border:'#c0e4e4', hero:'linear-gradient(135deg,#006464 0%,#20b2aa 100%)', ctaBg:'#008b8b', ctaText:'#ffffff', pickerBg:'#ffffff', sectionTitle:'#008b8b', starColor:'#ff9500', serviceIcon:'#008b8b', footerBg:'#e0f0f0', tagBg:'rgba(0,139,139,0.08)', profileRing:'#20b2aa' },
    fonts: { heading:"'Montserrat', sans-serif", body:"'Inter', sans-serif", accent:"'Poppins', sans-serif" },
    shape: { card:'12px', btn:'8px', photo:'8px' },
    shadowStyle: '0 4px 16px rgba(0,139,139,0.12)',
    portfolioGradients: ['linear-gradient(135deg,#e0f7fa 0%,#80deea 100%)','linear-gradient(135deg,#e8f5e9 0%,#a5d6a7 100%)','linear-gradient(135deg,#b2dfdb 0%,#4db6ac 100%)','linear-gradient(135deg,#e0f2f1 0%,#80cbc4 100%)','linear-gradient(135deg,#b2ebf2 0%,#4dd0e1 100%)','linear-gradient(135deg,#dcedc8 0%,#aed581 100%)'],
    portfolioOverlay: 'linear-gradient(to top,rgba(0,100,100,0.76) 0%,transparent 55%)', portfolioLabelColor: '#ffffff',
  },
  bold_emerald: {
    id: 'bold_emerald', name: 'Bold Emerald', category: 'BOLD', heroStyle: 'bold',
    colors: { bg:'#f1f9f6', surface:'#e0f0e8', card:'#ffffff', primary:'#1b4332', text:'#1a1a1a', textSec:'#4a4a4a', border:'#b8d8c8', hero:'linear-gradient(135deg,#1b4332 0%,#2d6a4f 100%)', ctaBg:'#2d6a4f', ctaText:'#d4af37', pickerBg:'#ffffff', sectionTitle:'#1b4332', starColor:'#d4af37', serviceIcon:'#1b4332', footerBg:'#e0f0e8', tagBg:'rgba(27,67,50,0.08)', profileRing:'#d4af37' },
    fonts: { heading:"'Montserrat', sans-serif", body:"'Inter', sans-serif", accent:"'Poppins', sans-serif" },
    shape: { card:'12px', btn:'8px', photo:'8px' },
    shadowStyle: '0 4px 16px rgba(27,67,50,0.12)',
    portfolioGradients: ['linear-gradient(135deg,#d4efdf 0%,#a9dfbf 100%)','linear-gradient(135deg,#e8f8f5 0%,#a3e4d7 100%)','linear-gradient(135deg,#f0f9f4 0%,#82e0aa 100%)','linear-gradient(135deg,#eafaf1 0%,#6fcf97 100%)','linear-gradient(135deg,#f9f3e3 0%,#f0d16e 100%)','linear-gradient(135deg,#e8f5e9 0%,#66bb6a 100%)'],
    portfolioOverlay: 'linear-gradient(to top,rgba(27,67,50,0.82) 0%,transparent 55%)', portfolioLabelColor: '#d4af37',
  },
  bold_ocean: {
    id: 'bold_ocean', name: 'Bold Ocean', category: 'BOLD', heroStyle: 'bold',
    colors: { bg:'#f0f4f8', surface:'#dce8f0', card:'#ffffff', primary:'#0a3d62', text:'#1a1a1a', textSec:'#4a4a4a', border:'#b8c8d8', hero:'linear-gradient(135deg,#0a3d62 0%,#3498db 100%)', ctaBg:'#0a3d62', ctaText:'#1abc9c', pickerBg:'#ffffff', sectionTitle:'#0a3d62', starColor:'#ff9500', serviceIcon:'#0a3d62', footerBg:'#dce8f0', tagBg:'rgba(10,61,98,0.08)', profileRing:'#1abc9c' },
    fonts: { heading:"'Montserrat', sans-serif", body:"'Inter', sans-serif", accent:"'Poppins', sans-serif" },
    shape: { card:'12px', btn:'8px', photo:'8px' },
    shadowStyle: '0 4px 16px rgba(10,61,98,0.12)',
    portfolioGradients: ['linear-gradient(135deg,#e3f2fd 0%,#90caf9 100%)','linear-gradient(135deg,#e0f7fa 0%,#80deea 100%)','linear-gradient(135deg,#e8eaf6 0%,#9fa8da 100%)','linear-gradient(135deg,#b3e5fc 0%,#4fc3f7 100%)','linear-gradient(135deg,#b2ebf2 0%,#26c6da 100%)','linear-gradient(135deg,#e8f5e9 0%,#66bb6a 100%)'],
    portfolioOverlay: 'linear-gradient(to top,rgba(10,61,98,0.8) 0%,transparent 55%)', portfolioLabelColor: '#1abc9c',
  },
  pure_neutral: {
    id: 'pure_neutral', name: 'Pure Neutral', category: 'PURE', heroStyle: 'simple',
    colors: { bg:'#ffffff', surface:'#f5f5f5', card:'#ffffff', primary:'#2d2d2d', text:'#2d2d2d', textSec:'#888888', border:'#e0e0e0', hero:'linear-gradient(135deg,#f5f5f5 0%,#ebebeb 100%)', ctaBg:'#2d2d2d', ctaText:'#ffffff', pickerBg:'#ffffff', sectionTitle:'#2d2d2d', starColor:'#ff9500', serviceIcon:'#888888', footerBg:'#f5f5f5', tagBg:'rgba(0,0,0,0.04)', profileRing:'#d4d4d4' },
    fonts: { heading:"'Roboto', sans-serif", body:"'Open Sans', sans-serif", accent:"'Lato', sans-serif" },
    shape: { card:'6px', btn:'4px', photo:'4px' },
    shadowStyle: '0 1px 6px rgba(0,0,0,0.08)',
    portfolioGradients: ['linear-gradient(135deg,#f5f5f5 0%,#e0e0e0 100%)','linear-gradient(135deg,#eeeeee 0%,#d5d5d5 100%)','linear-gradient(135deg,#f0f0f0 0%,#d8d8d8 100%)','linear-gradient(135deg,#e8e8e8 0%,#cccccc 100%)','linear-gradient(135deg,#f2f2f2 0%,#dcdcdc 100%)','linear-gradient(135deg,#ececec 0%,#d0d0d0 100%)'],
    portfolioOverlay: 'linear-gradient(to top,rgba(0,0,0,0.65) 0%,transparent 55%)', portfolioLabelColor: '#ffffff',
  },
  pure_slate: {
    id: 'pure_slate', name: 'Pure Slate', category: 'PURE', heroStyle: 'simple',
    colors: { bg:'#ffffff', surface:'#eef2f6', card:'#ffffff', primary:'#5a7a94', text:'#2d2d2d', textSec:'#6b7e8e', border:'#d0dce8', hero:'linear-gradient(135deg,#e8eef2 0%,#dce6ee 100%)', ctaBg:'#5a7a94', ctaText:'#ffffff', pickerBg:'#ffffff', sectionTitle:'#5a7a94', starColor:'#ff9500', serviceIcon:'#5a7a94', footerBg:'#eef2f6', tagBg:'rgba(90,122,148,0.08)', profileRing:'#b8c8d8' },
    fonts: { heading:"'Roboto', sans-serif", body:"'Open Sans', sans-serif", accent:"'Lato', sans-serif" },
    shape: { card:'6px', btn:'4px', photo:'4px' },
    shadowStyle: '0 1px 6px rgba(90,122,148,0.12)',
    portfolioGradients: ['linear-gradient(135deg,#e8eef2 0%,#c8d8e8 100%)','linear-gradient(135deg,#eef4f8 0%,#d0e0ec 100%)','linear-gradient(135deg,#e0e8f0 0%,#b8ccd8 100%)','linear-gradient(135deg,#dce8f4 0%,#b0c4d4 100%)','linear-gradient(135deg,#e8f0f8 0%,#c0d4e4 100%)','linear-gradient(135deg,#f0f4f8 0%,#c8d8e8 100%)'],
    portfolioOverlay: 'linear-gradient(to top,rgba(90,122,148,0.72) 0%,transparent 55%)', portfolioLabelColor: '#ffffff',
  },
  urban_noir: {
    id: 'urban_noir', name: 'Urban Noir', category: 'URBAN', heroStyle: 'cinematic',
    colors: { bg:'#0f0e0c', surface:'#1a1814', card:'#221f1a', primary:'#d4a853', text:'#f0ede8', textSec:'#8a8178', border:'#2e2a25', hero:'linear-gradient(160deg,#1a1505 0%,#0f0e0c 60%,#000 100%)', ctaBg:'#d4a853', ctaText:'#0f0e0c', pickerBg:'#1a1814', sectionTitle:'#d4a853', starColor:'#d4a853', serviceIcon:'#d4a853', footerBg:'#0a0a08', tagBg:'rgba(212,168,83,0.1)', profileRing:'#d4a853' },
    fonts: { heading:"'Oswald', sans-serif", body:"'Inter', sans-serif", accent:"'Oswald', sans-serif" },
    shape: { card:'4px', btn:'2px', photo:'4px' },
    shadowStyle: '0 4px 24px rgba(0,0,0,0.7)',
    portfolioGradients: ['linear-gradient(160deg,#1a1200 0%,#0f0c00 100%)','linear-gradient(160deg,#140e00 0%,#0a0800 100%)','linear-gradient(160deg,#0e0a08 0%,#1a1208 100%)','linear-gradient(160deg,#100a00 0%,#1a1400 100%)','linear-gradient(160deg,#0a0800 0%,#140e00 100%)','linear-gradient(160deg,#1a1400 0%,#100a00 100%)'],
    portfolioOverlay: 'linear-gradient(to top,rgba(0,0,0,0.92) 0%,rgba(0,0,0,0.1) 60%)', portfolioLabelColor: '#d4a853',
  },
  urban_steel: {
    id: 'urban_steel', name: 'Urban Steel', category: 'URBAN', heroStyle: 'cinematic',
    colors: { bg:'#0a0e14', surface:'#111820', card:'#161d28', primary:'#4a9eff', text:'#e8eef6', textSec:'#6b7a8e', border:'#1e2a38', hero:'linear-gradient(160deg,#0a1020 0%,#050a14 60%,#000 100%)', ctaBg:'#4a9eff', ctaText:'#050a14', pickerBg:'#111820', sectionTitle:'#4a9eff', starColor:'#4a9eff', serviceIcon:'#4a9eff', footerBg:'#080c12', tagBg:'rgba(74,158,255,0.1)', profileRing:'#4a9eff' },
    fonts: { heading:"'Oswald', sans-serif", body:"'Inter', sans-serif", accent:"'Oswald', sans-serif" },
    shape: { card:'4px', btn:'2px', photo:'4px' },
    shadowStyle: '0 4px 24px rgba(0,0,0,0.7)',
    portfolioGradients: ['linear-gradient(160deg,#050a20 0%,#0a1432 100%)','linear-gradient(160deg,#080c1a 0%,#0d1428 100%)','linear-gradient(160deg,#0a0e1c 0%,#111830 100%)','linear-gradient(160deg,#060a18 0%,#0c1428 100%)','linear-gradient(160deg,#0a0e20 0%,#0e1830 100%)','linear-gradient(160deg,#080c18 0%,#101a2c 100%)'],
    portfolioOverlay: 'linear-gradient(to top,rgba(0,0,0,0.92) 0%,rgba(0,0,0,0.1) 60%)', portfolioLabelColor: '#4a9eff',
  },
  urban_rust: {
    id: 'urban_rust', name: 'Urban Rust', category: 'URBAN', heroStyle: 'cinematic',
    colors: { bg:'#0f0a08', surface:'#1a1210', card:'#221810', primary:'#c4572c', text:'#f0e8e4', textSec:'#8a7870', border:'#2e2018', hero:'linear-gradient(160deg,#1a0800 0%,#0f0a08 60%,#000 100%)', ctaBg:'#c4572c', ctaText:'#ffffff', pickerBg:'#1a1210', sectionTitle:'#c4572c', starColor:'#c4572c', serviceIcon:'#c4572c', footerBg:'#0a0806', tagBg:'rgba(196,87,44,0.12)', profileRing:'#c4572c' },
    fonts: { heading:"'Oswald', sans-serif", body:"'Inter', sans-serif", accent:"'Oswald', sans-serif" },
    shape: { card:'4px', btn:'2px', photo:'4px' },
    shadowStyle: '0 4px 24px rgba(0,0,0,0.7)',
    portfolioGradients: ['linear-gradient(160deg,#200800 0%,#140600 100%)','linear-gradient(160deg,#1a0a00 0%,#100800 100%)','linear-gradient(160deg,#180a08 0%,#201008 100%)','linear-gradient(160deg,#160800 0%,#200c00 100%)','linear-gradient(160deg,#140600 0%,#1c0a00 100%)','linear-gradient(160deg,#200c00 0%,#140800 100%)'],
    portfolioOverlay: 'linear-gradient(to top,rgba(0,0,0,0.92) 0%,rgba(0,0,0,0.1) 60%)', portfolioLabelColor: '#c4572c',
  },
};

export const VALID_THEME_IDS = new Set<string>(Object.keys(THEMES));

/** Convert hex color (#rrggbb) to the "H S% L%" string that Tailwind CSS variables expect. */
export function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return `0 0% ${Math.round(l * 100)}%`;
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  switch (max) {
    case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
    case g: h = ((b - r) / d + 2) / 6; break;
    case b: h = ((r - g) / d + 4) / 6; break;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function getTheme(templateId: string | null | undefined): Theme {
  if (templateId && VALID_THEME_IDS.has(templateId)) {
    return THEMES[templateId as ThemeId];
  }
  return THEMES.bloom_soft;
}

export const GOOGLE_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Lato:wght@400;500;600&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Montserrat:wght@400;600;700&family=Open+Sans:wght@400;500&family=Great+Vibes&family=Poppins:wght@400;600;700&family=Quicksand:wght@400;500;600&family=Satisfy&family=Roboto:wght@400;500;700&family=Inter:wght@400;500;600&family=Oswald:wght@400;500;700&display=swap";
