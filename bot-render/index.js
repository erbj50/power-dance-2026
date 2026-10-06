const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);
const app = express();

// Libera requisições vindas do Netlify/Browser
app.use(cors());

app.get('/api/download-yt', async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim() === '') {
      return res.status(400).json({ error: 'Parâmetro query é obrigatório.' });
    }

    const sanitizedQuery = query.replace(/["'\\]/g, '').trim();
    const tempPrefix = path.join(os.tmpdir(), `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`);
    const tempOutputFile = `${tempPrefix}.m4a`;

    // Flags antibloqueio (User-Agent real + iOS/Android client fallbacks)
    const ytdlFlags = [
      `"ytsearch1:${sanitizedQuery}"`,
      `-x`,
      `--audio-format m4a`,
      `-o "${tempPrefix}.%(ext)s"`,
      `--no-playlist`,
      `--no-warnings`,
      `--user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"`,
      `--extractor-args "youtube:player_client=ios,android,web"`,
      `--no-check-certificates`
    ].join(' ');

    const command = `yt-dlp ${ytdlFlags}`;

    await execAsync(command);

    if (!fs.existsSync(tempOutputFile)) {
      return res.status(500).json({ error: 'Erro ao gerar arquivo temporário M4A.' });
    }

    res.setHeader('Content-Type', 'audio/mp4');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(sanitizedQuery)}.m4a"`);

    const stream = fs.createReadStream(tempOutputFile);
    stream.pipe(res);

    stream.on('end', () => {
      if (fs.existsSync(tempOutputFile)) {
        fs.unlinkSync(tempOutputFile);
      }
    });
  } catch (error) {
    console.error('Erro no processamento do Bot YouTube:', error);
    res.status(500).json({ error: 'Falha ao processar download do YouTube', details: error.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Servidor de download rodando na porta ${PORT}`);
});