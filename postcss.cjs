const fs = require('fs');
const path = require('path');
const vars = require('postcss-simple-vars');

module.exports = (options = {}) => {
  // Load theme
  const themeName = process.env.THEME || options.themeName;
  const themeDirectory = path.join(process.cwd(), 'themes', `${themeName}`);
  const themeManifestPath = path.join(themeDirectory, 'index.json');
  const manifestContent = fs.readFileSync(themeManifestPath, 'utf8');
  const manifest = JSON.parse(manifestContent);

  return vars({
    variables: manifest.variables || {},
  });
};

module.exports.postcss = true;
