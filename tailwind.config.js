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
    extend: {
      boxShadow: {
        'button': '.4rem .4rem 0 0 #adc2a9'
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
