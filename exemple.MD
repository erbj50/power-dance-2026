├── app/
│   ├── api/
│   │   └── nowplaying/
│   │       └── route.ts          # Proxy de servidor seguro para metadados de rádio
│   │   ├── admin/
│   │   │   └── page.tsx          # Painel de Administração de Recados
│   │   ├── chat/
│   │   │   └── page.tsx          # Chat / Mural de Recados & Pedidos (!toca)
│   │   ├── login/
│   │   │   └── page.tsx          # Tela de Login com Google
│   │   ├── globals.css           # Estilos globais, keyframes e fontes
│   │   ├── layout.tsx            # Layout raiz com PWA Meta & Scripts
│   │   ├── page.tsx              # Wrapper principal (Viewport Scaler)
│   │   └── manifest.ts           # Manifest PWA Dinâmico
├── components/
│   ├── AudioPlayer.tsx           # Player com Web Audio API, Equalizador 6-bandas e VU Meters
│   ├── DigitalHeader.tsx         # Cabeçalho com relógio digital e textos neon cíclicos
│   ├── SideLeftDrawer.tsx        # Drawer lateral esquerdo com carrossel 3D e Sample Pads
│   ├── SideRightDrawer.tsx       # Drawer lateral direito com o Chat/Login
│   ├── SamplePads.tsx            # Baterias eletrônicas de samples/efeitos sonoros (1 & 2)
│   └── ThreeDCarousel.tsx        # Carrossel 3D CSS puro da Madrugada Love
├── lib/
│   └── firebase.ts               # Instância centralizada do Firebase Web SDK
├── public/
│   ├── image/                    # Mídias e ícones originais (.gif, .png, .ico)
│   └── sw.js                     # Service Worker PWA nativo
├── .env.example
├── next.config.mjs
├── package.json
├── tailwind.config.ts
└── tsconfig.json