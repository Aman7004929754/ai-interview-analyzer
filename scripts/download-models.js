/**
 * Script to download face-api.js model files to public/models/
 * Run with: node scripts/download-models.js
 */

import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const MODELS_DIR = join(__dirname, '..', 'public', 'models');

const BASE_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';

const MODEL_FILES = [
  'tiny_face_detector_model-shard1',
  'tiny_face_detector_model-weights_manifest.json',
  'face_expression_model-shard1',
  'face_expression_model-weights_manifest.json',
  'face_landmark_68_tiny_model-shard1',
  'face_landmark_68_tiny_model-weights_manifest.json'
];

function download(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'ModelDownloader' } }, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        return download(response.headers.location).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) {
        return reject(new Error(`HTTP ${response.statusCode} for ${url}`));
      }
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
}

async function downloadModels() {
  if (!existsSync(MODELS_DIR)) {
    mkdirSync(MODELS_DIR, { recursive: true });
    console.log(`📁 Created ${MODELS_DIR}`);
  }

  for (const file of MODEL_FILES) {
    const filePath = join(MODELS_DIR, file);
    if (existsSync(filePath)) {
      console.log(`✅ ${file} already exists, skipping`);
      continue;
    }

    const url = `${BASE_URL}/${file}`;
    console.log(`📥 Downloading ${file}...`);
    try {
      const data = await download(url);
      writeFileSync(filePath, data);
      console.log(`   ✅ Saved (${(data.length / 1024).toFixed(1)} KB)`);
    } catch (error) {
      console.error(`   ❌ Failed: ${error.message}`);
    }
  }

  console.log('\n🎉 Model download complete!');
}

downloadModels();
