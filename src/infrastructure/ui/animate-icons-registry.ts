/**
 * AnimateIcons (@animateicons/vanilla) — registro + hover en el contenedor.
 *
 * Docs: el icono anima en hover del propio elemento. En nav el hover suele
 * estar en el <a> padre; usamos is-animated="false" + startAnimation/stopAnimation
 * en pointerenter/leave del padre (equivalente a useIconHover de React).
 */
import { browser } from '$app/environment';
import { defineIcons } from '@animateicons/vanilla';
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

type AnimateIconsEl = HTMLElement & {
	startAnimation?: () => void;
	stopAnimation?: () => void;
};

let registered = false;

/** Iconos de header público + nav backoffice. */
export function registerAnimateIcons(): void {
	if (!browser || registered) return;
	defineIcons({
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
	});
	registered = true;
}

/**
 * Svelte action: anima el <animate-icons> hijo al hover/focus del contenedor.
 * Uso: <a use:iconHover>…<animate-icons is-animated="false" …></a>
 */
export function iconHover(node: HTMLElement) {
	registerAnimateIcons();

	const getIcon = (): AnimateIconsEl | null =>
		node.querySelector('animate-icons') as AnimateIconsEl | null;

	const start = () => {
		getIcon()?.startAnimation?.();
	};
	const stop = () => {
		getIcon()?.stopAnimation?.();
	};

	node.addEventListener('pointerenter', start);
	node.addEventListener('pointerleave', stop);
	node.addEventListener('focus', start);
	node.addEventListener('blur', stop);

	return {
		destroy() {
			node.removeEventListener('pointerenter', start);
			node.removeEventListener('pointerleave', stop);
			node.removeEventListener('focus', start);
			node.removeEventListener('blur', stop);
		}
	};
}
