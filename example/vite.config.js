import themer from '../vite';

export default {
  plugins: [
    themer({ themeName: process.env.THEME_NAME }),
  ],
}
