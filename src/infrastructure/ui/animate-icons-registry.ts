/**
 * Registro client-side de AnimateIcons (custom element <animate-icons>).
 * Solo corre en el navegador; seguro con prerender/static.
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

let registered = false;

/** Iconos usados en header público + nav backoffice. */
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
