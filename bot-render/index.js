const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);
const app = express();

app.use(cors());

app.get('/api/download-yt', async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim() === '') {
      return res.status(400).json({ error: 'Parâmetro query é obrigatório.' });
    }

    const sanitizedQuery = query.replace(/["'\\]/g, '').trim();
    const tempFile = path.join(os.tmpdir(), `audio_${Date.now()}.m4a`);

    // Clientes de evasão de bot para IP de servidor (mweb/android/ios)
    const command = [
      'yt-dlp',
      `"ytsearch1:${sanitizedQuery}"`,
      '-f "ba[ext=m4a]/ba/b"',
      `-o "${tempFile}"`,
      '--no-playlist',
      '--no-warnings',
      '--extractor-args "youtube:player_client=mweb,android_creator,ios"',
      '--user-agent "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"'
    ].join(' ');

    console.log(`[INFO] Processando: ${sanitizedQuery}`);

    await execAsync(command);

    if (!fs.existsSync(tempFile)) {
      throw new Error('Arquivo temporário de áudio não foi gerado.');
    }

    res.setHeader('Content-Type', 'audio/mp4');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(sanitizedQuery)}.m4a"`);

    const stream = fs.createReadStream(tempFile);
    stream.pipe(res);

    stream.on('end', () => {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    });

  } catch (error) {
    console.error('Erro no processamento:', error.message);
    res.status(500).json({ 
      error: 'Falha ao processar download do YouTube', 
      details: error.message 
    });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Servidor de download rodando na porta ${PORT}`);
});