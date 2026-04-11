import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import obfuscatorPlugin from 'vite-plugin-javascript-obfuscator'

export default defineConfig({
  plugins: [
    react(),
    obfuscatorPlugin({
      include: ['src/**/*.js', 'src/**/*.jsx'],
      exclude: [/node_modules/],
      apply: 'build', 
      options: {
        compact: true,
        controlFlowFlattening: true,
        deadCodeInjection: true,
        disableConsoleOutput: true,
        identifierNamesGenerator: 'hexadecimal',
        simplify: true,
        splitStrings: true,
        stringArray: true,
        stringArrayEncoding: ['base64'],
      }
    })
  ]
})