import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  // Aceita parâmetro 'q' ou 'query'
  const query = searchParams.get('q') || searchParams.get('query');

  if (!query || query.trim() === '') {
    return NextResponse.json({ error: 'Query ausente' }, { status: 400 });
  }

  try {
    const deezerResponse = await fetch(
      `https://api.deezer.com/search?q=${encodeURIComponent(query)}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
        // Opcional: faz cache das respostas por 24 horas no Next.js para carregar instantaneamente
        next: { revalidate: 86400 },
      }
    );

    if (!deezerResponse.ok) {
      return NextResponse.json({ error: 'Erro no Deezer' }, { status: 500 });
    }

    const data = await deezerResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Falha na requisição' }, { status: 500 });
  }
}