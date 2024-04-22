import path from 'path';
import fs from 'fs';
import vars from 'postcss-simple-vars';

const plugin = (options = {}) => {
  // Load theme
  const themeName = process.env.THEME || options.themeName;
  const themeDirectory = path.join(process.cwd(), 'themes', `${themeName}`);
  const themeManifestPath = path.join(themeDirectory, 'index.json');
  const manifestContent = fs.readFileSync(themeManifestPath, 'utf8');
  const manifest = JSON.parse(manifestContent);
  const styles = manifest.styles || {};

  return vars({ variables: styles });
};

plugin.postcss = true;

export default plugin;
