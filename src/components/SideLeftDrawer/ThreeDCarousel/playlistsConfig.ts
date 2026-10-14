// src/components/SideLeftDrawer/ThreeDCarousel/playlistsConfig.ts

export const PLAYLIST_THEMES: Record<string, { images: string[]; links: string[] }> = {
  // Playlist Padrão (Firebase / Cloudinary original ou pasta padrão)
  default: {
    images: [], // Se vazio, vai buscar do Firebase como antes
    links: [],
  },

  // Hits 80: Imagens locais de 1 a 100 na pasta /images/hits80/
  "Hits 80": {
    images: Array.from({ length: 100 }, (_, i) => `/image/hits80/img-${i + 1}.webp`),
    links: Array.from({ length: 100 }, (_, i) => `https://seu-link-hits80.com/item/${i + 1}`),
  },

  // Euro House: Imagens locais de 1 a 100 na pasta /images/eurohouse/
  "Euro House": {
    images: Array.from({ length: 100 }, (_, i) => `/image/eurohouse/img-${i + 1}.webp`),
    links: Array.from({ length: 100 }, (_, i) => `https://seu-link-eurohouse.com/item/${i + 1}`),
  },

  // Superdance: Imagens locais de 1 a 100 na pasta /images/superdance/
  "Superdance": {
    images: Array.from({ length: 100 }, (_, i) => `/image/superdance/img-${i + 1}.webp`),
    links: Array.from({ length: 100 }, (_, i) => `https://seu-link-superdance.com/item/${i + 1}`),
  },
};