import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { validateContactEndpoint } from './src/contact/submitMessage.js';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  validateContactEndpoint(env.VITE_CONTACT_FORM_ENDPOINT);
  return { plugins: [react()], base: '/portfolio/' };
});
