// See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	/** Custom element from @animateicons/vanilla */
	namespace svelteHTML {
		interface IntrinsicElements {
			'animate-icons': {
				name?: string;
				library?: string;
				size?: string | number;
				color?: string;
				duration?: string | number;
				'is-animated'?: string | boolean;
				class?: string;
			};
		}
	}
}

export {};
