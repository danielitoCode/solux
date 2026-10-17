import { getProjectUseCases } from '$features/projects/di';
import type { Project, ProjectInput } from '../../domain/entities/project';
const useCases = getProjectUseCases();
let projects = $state<Project[]>([]);
let loading = $state(false);
let saving = $state(false);
let error = $state('');
let notice = $state('');
export function getProjectsState() { return { get projects() { return projects; }, get loading() { return loading; }, get saving() { return saving; }, get error() { return error; }, get notice() { return notice; } }; }
export async function loadProjects() { loading = true; error = ''; try { projects = await useCases.list.execute(); } catch (e) { error = e instanceof Error ? e.message : 'Error al cargar proyectos.'; } finally { loading = false; } }
export async function saveProject(id: string | null, input: ProjectInput) { if (saving) return null; saving = true; error = ''; notice = ''; try { const saved = id ? await useCases.update.execute(id, input) : await useCases.create.execute(input); projects = id ? projects.map((item) => item.id === saved.id ? saved : item) : [...projects, saved].sort((a, b) => a.sortOrder - b.sortOrder || b.createdAt.localeCompare(a.createdAt)); notice = 'Proyecto guardado.'; return saved; } catch (e) { error = e instanceof Error ? e.message : 'No se pudo guardar el proyecto.'; return null; } finally { saving = false; } }
export async function removeProject(id: string) { if (saving) return false; saving = true; error = ''; notice = ''; try { await useCases.remove.execute(id); projects = projects.filter((item) => item.id !== id); notice = 'Proyecto eliminado.'; return true; } catch (e) { error = e instanceof Error ? e.message : 'No se pudo eliminar el proyecto.'; return false; } finally { saving = false; } }
