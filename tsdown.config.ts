import { defineConfig } from 'tsdown';

export default defineConfig({
	entry: 'src/index.ts',
	format: ['esm'],
	dts: true,
	target: 'esnext',
	platform: 'node',
	sourcemap: false,
	treeshake: true,
	outDir: 'lib',
	clean: false,
});
