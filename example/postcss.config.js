import themer from '../postcss.js';

export default {
  plugins: [
    themer({ themeName: process.env.THEME_NAME }),
  ],
}
