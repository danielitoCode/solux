/**
 * AnimateIcons (@animateicons/vanilla) via createIcon.
 *
 * Docs: createIcon devuelve un <span> con startAnimation/stopAnimation.
 * isAnimated:true anima solo el span; en nav el hover está en el <a>,
 * así que montamos con isAnimated:false y reenviamos mouseenter/leave del padre.
 */
import { browser } from '$app/environment';
import { createIcon, type IconData } from '@animateicons/vanilla';
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

export const NAV_ICONS: Record<string, IconData> = {
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

type IconHost = HTMLElement & {
	startAnimation: () => void;
	stopAnimation: () => void;
	destroy: () => void;
};

/**
 * Svelte action: monta un icono animado en el nodo y anima al hover del
 * enlace/botón contenedor (o del propio nodo).
 *
 *   <span class="nav-icon" use:navIcon={'house'}></span>
 */
export function navIcon(node: HTMLElement, name: string) {
	if (!browser) return;

	let host: IconHost | null = null;
	let parent: HTMLElement | null = null;

	const start = () => host?.startAnimation();
	const stop = () => host?.stopAnimation();

	function mount(iconName: string) {
		teardown();
		const data = NAV_ICONS[iconName];
		if (!data) return;

		const size = Number(node.dataset.size) || 18;
		host = createIcon(data, {
			size,
			color: 'currentColor',
			isAnimated: false,
			duration: 1
		}) as IconHost;

		node.replaceChildren(host);

		parent = (node.closest('a, button') as HTMLElement | null) ?? node;
		parent.addEventListener('mouseenter', start);
		parent.addEventListener('mouseleave', stop);
		parent.addEventListener('focus', start);
		parent.addEventListener('blur', stop);
	}

	function teardown() {
		if (parent) {
			parent.removeEventListener('mouseenter', start);
			parent.removeEventListener('mouseleave', stop);
			parent.removeEventListener('focus', start);
			parent.removeEventListener('blur', stop);
			parent = null;
		}
		host?.destroy();
		host = null;
		node.replaceChildren();
	}

	mount(name);

	return {
		update(newName: string) {
			if (newName !== name) {
				name = newName;
				mount(newName);
			}
		},
		destroy: teardown
	};
}

/** @deprecated use navIcon — se mantiene por compat */
export function registerAnimateIcons(): void {
	/* no-op: createIcon no requiere defineIcons */
}

/** @deprecated use navIcon */
export function iconHover(_node: HTMLElement) {
	return { destroy() {} };
}
