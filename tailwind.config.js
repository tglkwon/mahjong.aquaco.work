/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
        "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    screens: {
      'bmb': '425px', // 예시: bmb 화면 크기 정의
      'mb': '375px'
    },    
    extend: {
        width: {
          'bmb': '425px',
          'mb': '375px'
      }},
  },
  plugins: [],
}

