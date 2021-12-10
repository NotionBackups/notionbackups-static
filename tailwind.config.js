module.exports = {
  content: [
    './content/**/*.erb',
    './content/**/*.md',
    './content/assets/**/*.js',
    './layouts/**/*.html.erb',
    './layouts/**/*.html',
  ],
  theme: {
    extend: {
      boxShadow: {
        'button': '.4rem .4rem 0 0 #adc2a9'
      },
      colors: {
        'green': {
          'light': '#d3e4cd',
          'DEFAULT': '#adc2a9',
        },
      }
    },
  },
  plugins: [],
}
