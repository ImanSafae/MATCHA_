import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		watch: {
			usePolling: true,
		}
	},
	define: {
		'process.env': {
			IP_INFO_TOKEN: process.env.IP_INFO_TOKEN,
			BACK_URL: process.env.DOMAIN + ':' + process.env.SERVER_PORT
		}
	}
});
