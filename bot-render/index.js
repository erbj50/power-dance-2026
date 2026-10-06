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

    // Comando do yt-dlp simplificado e compatível com servidores em nuvem
    const command = `yt-dlp "ytsearch1:${sanitizedQuery}" -f "ba[ext=m4a]/ba/b" -o "${tempFile}" --no-playlist --no-warnings`;

    console.log(`[INFO] Executando comando: ${command}`);

    const { stdout, stderr } = await execAsync(command);
    if (stdout) console.log('[yt-dlp stdout]:', stdout);
    if (stderr) console.warn('[yt-dlp stderr]:', stderr);

    if (!fs.existsSync(tempFile)) {
      console.error('[ERRO] Arquivo temporário não foi criado no caminho:', tempFile);
      return res.status(500).json({ error: 'Erro ao gerar arquivo de áudio.' });
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
    console.error('================ ERRO NO SERVIDOR ================');
    console.error('Mensagem:', error.message);
    if (error.stdout) console.error('STDOUT:', error.stdout);
    if (error.stderr) console.error('STDERR:', error.stderr);
    console.error('==================================================');

    res.status(500).json({ 
      error: 'Falha ao processar download do YouTube', 
      details: error.message,
      stderr: error.stderr || null 
    });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Servidor de download rodando na porta ${PORT}`);
});