import { getPresentationUseCases } from '$features/presentation/di';
import { PresentationMediaDataSource } from '../../data/datasources/remote/presentation-media-datasource';
import { emptyPageContent, type PageContent, type PageSlug } from '../../domain/entities/page-content';

const useCases = getPresentationUseCases();
const media = new PresentationMediaDataSource();

let selectedSlug = $state<PageSlug>('inicio');
let content = $state<PageContent>(emptyPageContent());
let loading = $state(true);
let saving = $state(false);
let error = $state('');
let success = $state('');
let loaded = $state<Partial<Record<PageSlug, PageContent>>>({});
let uploadingImages = $state<Record<number, boolean>>({});
let pageRequest = 0;
let uploadRequests: Record<number, number> = {};
let saveRequest = 0;

export function getPresentationState() {
  return {
    get selectedSlug() { return selectedSlug; },
    get content() { return content; },
    get loading() { return loading; },
    get saving() { return saving; },
    get error() { return error; },
    get success() { return success; },
    get uploadingImages() { return uploadingImages; }
  };
}

export function isPresentationMediaConfigured() { return media.isConfigured(); }

export async function selectPresentationPage(slug: PageSlug) {
  if (saving || Object.values(uploadingImages).some(Boolean)) return;
  const request = ++pageRequest;
  selectedSlug = slug;
  error = '';
  success = '';
  content = emptyPageContent();
  if (loaded[slug]) {
    content = { ...loaded[slug]! };
    loading = false;
    return;
  }
  loading = true;
  try {
    content = await useCases.getPageContent.execute(slug);
    loaded[slug] = { ...content };
  } catch (e) {
    if (request !== pageRequest) return;
    error = e instanceof Error ? e.message : 'No se pudo cargar el contenido.';
    content = emptyPageContent();
  } finally {
    if (request === pageRequest) loading = false;
  }
}

export async function uploadPresentationImage(index: number, file?: File) {
  if (!file || loading || saving || uploadingImages[index]) return;
  const slug = selectedSlug;
  const request = (uploadRequests[index] ?? 0) + 1;
  uploadRequests[index] = request;
  error = '';
  success = '';
  if (!file.type.startsWith('image/')) { error = 'Selecciona un archivo de imagen.'; return; }
  if (file.size > 10 * 1024 * 1024) { error = 'La imagen supera el límite de 10 MB.'; return; }
  uploadingImages[index] = true;
  try {
    const result = await media.upload(file, slug);
    if (uploadRequests[index] !== request || selectedSlug !== slug) return;
    const key = `image${index}` as keyof PageContent;
    content = { ...content, [key]: result.url };
    success = `Imagen ${index} subida a Cloudinary. URL insertada automáticamente.`;
  } catch (e) {
    if (uploadRequests[index] !== request || selectedSlug !== slug) return;
    error = e instanceof Error ? e.message : 'No se pudo subir la imagen.';
  } finally {
    uploadingImages[index] = false;
  }
}

export function updatePresentationField(field: keyof PageContent, value: string) {
  content = { ...content, [field]: value };
}

export async function savePresentation() {
  if (saving || loading || Object.values(uploadingImages).some(Boolean)) return;
  const slug = selectedSlug;
  const snapshot = { ...content };
  const request = ++saveRequest;
  saving = true;
  error = '';
  success = '';
  try {
    const saved = await useCases.savePageContent.execute(slug, snapshot);
    loaded[slug] = { ...saved };
    content = { ...saved };
    if (request === saveRequest && selectedSlug === slug) success = 'Vista guardada. La web pública cargará estos cambios.';
  } catch (e) {
    if (request === saveRequest && selectedSlug === slug) error = e instanceof Error ? e.message : 'No se pudo guardar el contenido.';
  } finally {
    if (request === saveRequest) saving = false;
  }
}
