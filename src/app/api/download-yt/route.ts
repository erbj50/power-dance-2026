import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(req: NextRequest) {
  try {
    // 1. Extrai o parâmetro query da URL
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query');

    if (!query || query.trim() === '') {
      return NextResponse.json(
        { error: 'Parâmetro query é obrigatório.' },
        { status: 400 }
      );
    }

    const isWindows = process.platform === 'win32';
    const rootPath = process.cwd();

    // Define os executáveis dependendo do ambiente
    const ytdlpExe = path.join(rootPath, 'yt-dlp.exe');
    const ffmpegExe = path.join(rootPath, 'ffmpeg.exe');

    // Se estiver no Windows e existir o .exe local, usa ele. Caso contrário (Linux/Server), usa o comando global.
    const ytdlpCmd = isWindows && fs.existsSync(ytdlpExe) ? `"${ytdlpExe}"` : 'yt-dlp';
    const ffmpegCmd = isWindows && fs.existsSync(ffmpegExe) ? `--ffmpeg-location "${ffmpegExe}"` : '';

    // Usa a pasta temporária do sistema operacional em vez da pasta public
    const tempOutputFile = path.join(os.tmpdir(), `temp_${Date.now()}_${Math.random().toString(36).substring(7)}.m4a`);

    // Limpa o nome da busca para evitar problemas no terminal
    const sanitizedQuery = query.replace(/["'\\]/g, '').trim();

    // 2. Executa a busca no YouTube via yt-dlp
    const command = `${ytdlpCmd} "ytsearch1:${sanitizedQuery}" -x --audio-format m4a ${ffmpegCmd} -o "${tempOutputFile}" --no-playlist --no-warnings`;

    await execAsync(command);

    if (!fs.existsSync(tempOutputFile)) {
      throw new Error('Erro ao gerar o arquivo M4A temporário.');
    }

    // 3. Lê o arquivo gerado
    const fileBuffer = fs.readFileSync(tempOutputFile);

    // Remove o arquivo temporário do disco após leitura
    if (fs.existsSync(tempOutputFile)) {
      fs.unlinkSync(tempOutputFile);
    }

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mp4',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(sanitizedQuery)}.m4a"`,
      },
    });
  } catch (error: any) {
    console.error('Erro no processamento do Bot YouTube:', error);
    return NextResponse.json(
      { error: 'Falha ao processar download do YouTube', details: error?.message || String(error) },
      { status: 500 }
    );
  }
}