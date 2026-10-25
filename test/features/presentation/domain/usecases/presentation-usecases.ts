import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PresentationRepository } from '$features/presentation/domain/repository/presentation-repository';
import type { PageContent } from '$features/presentation/domain/entities/page-content';
import { GetCompanyProfile } from '$features/presentation/domain/usecases/get-company-profile';
import { GetPageContent } from '$features/presentation/domain/usecases/get-page-content';
import { GetPublishedProjects } from '$features/presentation/domain/usecases/get-published-projects';
import { SavePageContent } from '$features/presentation/domain/usecases/save-page-content';

describe('presentation-usecases', () => {
  let repo: PresentationRepository;
  beforeEach(() => {
    repo = {
      getCompanyProfile: vi.fn(), getPageContent: vi.fn(),
      savePageContent: vi.fn(), getPublishedProjects: vi.fn()
    };
  });
  it('GetCompanyProfile', async () => {
    vi.mocked(repo.getCompanyProfile).mockResolvedValue({ name: 'SOLUX' } as never);
    await new GetCompanyProfile(repo).execute();
    expect(repo.getCompanyProfile).toHaveBeenCalledOnce();
  });
  it('GetPageContent', async () => {
    vi.mocked(repo.getPageContent).mockResolvedValue({ title: 'Home' } as PageContent);
    const r = await new GetPageContent(repo).execute('home' as never);
    expect(r.title).toBe('Home');
  });
  it('SavePageContent', async () => {
    const c = { title: 'S' } as PageContent;
    vi.mocked(repo.savePageContent).mockResolvedValue(c);
    await new SavePageContent(repo).execute('services' as never, c);
    expect(repo.savePageContent).toHaveBeenCalledWith('services', c);
  });
  it('GetPublishedProjects', async () => {
    vi.mocked(repo.getPublishedProjects).mockResolvedValue([{ title: 'P1' }] as never);
    expect(await new GetPublishedProjects(repo).execute()).toHaveLength(1);
  });
});
