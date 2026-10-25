import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ContactMessage } from '$features/contact/domain/entities';
import type { ContactMessageRepository } from '$features/contact/domain/repository/contact-message-repository';
import { ListContactMessages, MarkContactMessageRead } from '$features/contact/domain/usecases/contact-message-usecases';

const msg = (o: Partial<ContactMessage> = {}): ContactMessage =>
  ({ id: 'm-1', name: 'C', email: 'c@t.com', isRead: false, ...o }) as ContactMessage;

describe('contact-message-usecases', () => {
  let repo: ContactMessageRepository;
  beforeEach(() => { repo = { listAll: vi.fn(), markRead: vi.fn() }; });
  it('ListContactMessages', async () => {
    vi.mocked(repo.listAll).mockResolvedValue([msg()]);
    expect(await new ListContactMessages(repo).execute()).toHaveLength(1);
  });
  it('MarkContactMessageRead default true', async () => {
    vi.mocked(repo.markRead).mockResolvedValue(msg({ isRead: true }));
    await new MarkContactMessageRead(repo).execute('m-1');
    expect(repo.markRead).toHaveBeenCalledWith('m-1', true);
  });
  it('MarkContactMessageRead false', async () => {
    vi.mocked(repo.markRead).mockResolvedValue(msg({ isRead: false }));
    await new MarkContactMessageRead(repo).execute('m-1', false);
    expect(repo.markRead).toHaveBeenCalledWith('m-1', false);
  });
});
