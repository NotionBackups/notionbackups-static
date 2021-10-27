module.exports = {
  mode: 'jit',
  purge: [
    './content/**/*.erb',
    './content/**/*.md',
    './content/assets/**/*.js',
    './layouts/**/*.html.erb',
    './layouts/**/*.html',
  ],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {},
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
