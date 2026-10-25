import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PublicContactRepository } from '$features/contact/domain/repository/public-contact-repository';
import {
  GetPublicContactInfo, GetBusinessHours, SendContactMessage, GetCompanyProfile
} from '$features/contact/domain/usecases/public-contact-usecases';

describe('public-contact-usecases', () => {
  let repo: PublicContactRepository;
  beforeEach(() => {
    repo = {
      getContactInfo: vi.fn(), getBusinessHours: vi.fn(),
      sendMessage: vi.fn(), getCompanyProfile: vi.fn()
    };
  });
  it('GetPublicContactInfo', async () => {
    vi.mocked(repo.getContactInfo).mockResolvedValue({} as never);
    await new GetPublicContactInfo(repo).execute();
    expect(repo.getContactInfo).toHaveBeenCalledOnce();
  });
  it('GetBusinessHours', async () => {
    vi.mocked(repo.getBusinessHours).mockResolvedValue([]);
    await new GetBusinessHours(repo).execute();
    expect(repo.getBusinessHours).toHaveBeenCalledOnce();
  });
  it('SendContactMessage', async () => {
    const input = { name: 'A', email: 'a@t.com', message: 'Hi' } as never;
    vi.mocked(repo.sendMessage).mockResolvedValue(undefined);
    await new SendContactMessage(repo).execute(input);
    expect(repo.sendMessage).toHaveBeenCalledWith(input);
  });
  it('GetCompanyProfile', async () => {
    vi.mocked(repo.getCompanyProfile).mockResolvedValue({ name: 'SOLUX' } as never);
    expect(await new GetCompanyProfile(repo).execute()).toEqual({ name: 'SOLUX' });
  });
});
