/**
 * AnimateIcons — montaje con mountIcon (API vanilla).
 * mountIcon dibuja el SVG dentro del nodo y expone start/stopAnimation.
 */
import { browser } from '$app/environment';
import { mountIcon, type IconData } from '@animateicons/vanilla';
import {
	House,
	Zap,
	Package,
	Image,
	Users,
	Search,
	Wrench,
	Mail,
	Sun,
	Menu,
	LayoutDashboard,
	Calendar,
	MessageSquare,
	Wallet,
	Presentation,
	User,
	Building2,
	Headset
} from '@animateicons/vanilla/lucide';

const NAV_ICONS: Record<string, IconData> = {
	house: House,
	zap: Zap,
	package: Package,
	image: Image,
	users: Users,
	search: Search,
	wrench: Wrench,
	mail: Mail,
	sun: Sun,
	menu: Menu,
	'layout-dashboard': LayoutDashboard,
	calendar: Calendar,
	'message-square': MessageSquare,
	wallet: Wallet,
	presentation: Presentation,
	user: User,
	'building-2': Building2,
	headset: Headset
};

type Controls = {
	startAnimation: () => void;
	stopAnimation: () => void;
	destroy: () => void;
};

/**
 * Svelte action:
 *   <span class="nav-icon" data-size="18" use:navIcon={'house'}></span>
 *
 * Dibuja el SVG en el span y anima al hover del <a>/<button> padre.
 */
export function navIcon(node: HTMLElement, name: string) {
	if (!browser) {
		return {
			update() {},
			destroy() {}
		};
	}

	let controls: Controls | null = null;
	let parent: HTMLElement | null = null;
	let current = '';

	const start = () => controls?.startAnimation();
	const stop = () => controls?.stopAnimation();

	function teardown() {
		if (parent) {
			parent.removeEventListener('mouseenter', start);
			parent.removeEventListener('mouseleave', stop);
			parent.removeEventListener('focus', start);
			parent.removeEventListener('blur', stop);
			parent = null;
		}
		try {
			controls?.destroy();
		} catch {
			/* ignore */
		}
		controls = null;
		node.replaceChildren();
	}

	function mount(iconName: string) {
		teardown();
		current = iconName;
		const data = NAV_ICONS[iconName];
		if (!data) {
			console.warn('[navIcon] icon not found:', iconName);
			return;
		}

		const size = Number(node.dataset.size) || 18;

		try {
			// mountIcon = dibuja SVG dentro de `node` + player
			controls = mountIcon(node, data, {
				size,
				color: 'currentColor',
				// true: anima al hover del propio icono
				// además reenviamos hover del padre (enlace)
				isAnimated: true,
				duration: 1
			}) as Controls;
		} catch (err) {
			console.error('[navIcon] mountIcon failed', iconName, err);
			return;
		}

		parent = (node.closest('a, button') as HTMLElement | null) ?? node;
		parent.addEventListener('mouseenter', start);
		parent.addEventListener('mouseleave', stop);
		parent.addEventListener('focus', start);
		parent.addEventListener('blur', stop);
	}

	mount(name);

	return {
		update(newName: string) {
			if (newName !== current) mount(newName);
		},
		destroy: teardown
	};
}

export function registerAnimateIcons(): void {}
export function iconHover(_node: HTMLElement) {
	return { destroy() {} };
}
