const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const envFiles = ['.env.production.local', '.env.production', '.env.local', '.env'];

const parseEnvFile = (filePath) => {
  const values = {};
  if (!fs.existsSync(filePath)) return values;

  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const match = trimmed.match(/^([\w.-]+)\s*=\s*(.*)$/);
    if (!match) continue;

    const key = match[1];
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }

  return values;
};

const fileEnv = envFiles.reduce(
  (acc, fileName) => ({ ...acc, ...parseEnvFile(path.join(root, fileName)) }),
  {}
);

const apiUrl = process.env.REACT_APP_API_URL || fileEnv.REACT_APP_API_URL;

if (!apiUrl || !apiUrl.trim()) {
  console.error('Missing required environment variable: REACT_APP_API_URL');
  console.error('Set it in InternTrack/.env or your deployment environment, for example:');
  console.error('REACT_APP_API_URL=https://your-api.example.com/api');
  process.exit(1);
}
