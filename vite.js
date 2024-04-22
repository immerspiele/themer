import path from 'path';
import { readFile } from 'fs/promises';
import { loadEnv } from 'vite';

const THEME_ID_PREFIX = 'theme/';
const RESOLVED_ID_PREFIX = '\0__themer';
const RESOLVED_THEME_VARIABLES = '\0__themer_variables';
const ASSET_REPLACE_PATTERN = /__THEMER__([\w]+)/g;

const getAssetUrl = async (
  id,
  themeName,
  ctx,
  config,
) => {
  const file = id
    .slice(RESOLVED_ID_PREFIX.length)
    .slice(THEME_ID_PREFIX.length);

  const url = path.join(config.base, 'themes', themeName, file);
  if (config.command === 'serve') {
    return url;
  }

  const filePath = path.join(config.root, 'themes', themeName, file);
  const content = await readFile(filePath);

  const referenceId = ctx.emitFile({
    type: 'asset',
    name: `${themeName}/${path.basename(file)}`,
    source: content,
  });

  return `__THEMER__${referenceId}`;
};

export default function plugin(options = {}) {
  let manifest;
  let theme = options.themeName || process.env.THEME;
  let config;
  let variablesExports = '';

  return {
    name: 'vite-themer-plugin',

    async configResolved(resolvedConfig) {
      config = resolvedConfig;

      const env = loadEnv(config.mode, config.root, '');

      if (!theme && env.THEME) {
        theme = env.THEME;
      }

      // Load theme manifest
      const themeDirectory = path.join(process.cwd(), 'themes', `${theme}`);
      const themeManifestPath = path.join(themeDirectory, 'index.json');
      const manifestContent = await readFile(themeManifestPath, 'utf8');

      manifest = JSON.parse(manifestContent);
      const variables = manifest.variables = manifest.variables || {};

      // Generate variable exports
      for (const key in variables) {
        const value = variables[key];
        variablesExports += `export const ${key} = ${JSON.stringify(value)};\n`;
      }
    },

    async load(id) {
      if (id === RESOLVED_THEME_VARIABLES) {
        // Load theme variables
        return variablesExports;
      }

      if (id.startsWith(RESOLVED_ID_PREFIX) === false) {
        return;
      }

      if (!config) {
        throw new Error('config not resolved');
      }

      if (!theme) {
        throw new Error('theme not specified');
      }

      const url = await getAssetUrl(id, theme, this, config);

      return `export default "${url}";`
    },

    renderChunk(code, chunk) {
      if (ASSET_REPLACE_PATTERN.test(code) === false) {
        return null;
      }

      if (config && config.command === 'serve') {
        return null;
      }

      let match;

      ASSET_REPLACE_PATTERN.lastIndex = 0;

      while ((match = ASSET_REPLACE_PATTERN.exec(code))) {
        const [fullMatch, referenceId] = match;
        const file = this.getFileName(referenceId);
        const url = (config.base || '/') + file;

        code = code.replace(fullMatch, url);
      }

      return code;
    },

    resolveId(id) {
      if (id.startsWith(THEME_ID_PREFIX) === false) {
        return;
      }

      if (id === 'theme/variables') {
        return RESOLVED_THEME_VARIABLES;
      }

      return RESOLVED_ID_PREFIX + id;
    }
  }
}
