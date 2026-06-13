import { useState } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18n from '@/i18n';
import { RichTextEditor } from './rich-text-editor';

beforeAll(async () => {
  await i18n.changeLanguage('en');
});

function Harness({ initial = '', onChange }: { initial?: string; onChange?: (h: string) => void }) {
  const [val, setVal] = useState(initial);
  return (
    <RichTextEditor
      value={val}
      onChange={(h) => {
        setVal(h);
        onChange?.(h);
      }}
      ariaLabel="Description"
    />
  );
}

describe('RichTextEditor', () => {
  it('renders the formatting toolbar and an editable region', async () => {
    render(<Harness />);
    await screen.findByRole('textbox');

    for (const name of [
      'Bold',
      'Italic',
      'Heading',
      'Subheading',
      'Bullet list',
      'Numbered list',
      'Link',
    ]) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument();
    }
  });

  it('hydrates an initial HTML value into the editor', async () => {
    render(<Harness initial="<p>Hello <strong>bold</strong></p>" />);
    const box = await screen.findByRole('textbox');
    await waitFor(() => expect(box.textContent).toContain('Hello bold'));
    expect(box.querySelector('strong')).not.toBeNull();
  });

  it('reflects editor state on the toolbar when toggling bold', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await screen.findByRole('textbox');

    const bold = screen.getByRole('button', { name: /bold/i });
    expect(bold).toHaveAttribute('aria-pressed', 'false');
    await user.click(bold);
    await waitFor(() => expect(bold).toHaveAttribute('aria-pressed', 'true'));
  });

  it('opens a link popover with a URL input instead of a native prompt', async () => {
    const user = userEvent.setup();
    const promptSpy = vi.spyOn(window, 'prompt');
    render(<Harness />);
    await screen.findByRole('textbox');

    await user.click(screen.getByRole('button', { name: /link/i }));
    expect(await screen.findByLabelText(/link url/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /apply/i })).toBeInTheDocument();
    expect(promptSpy).not.toHaveBeenCalled();
  });

  it('inserts the URL as linked text when nothing is selected and normalizes the scheme', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    await screen.findByRole('textbox');

    await user.click(screen.getByRole('button', { name: /link/i }));
    await user.type(await screen.findByLabelText(/link url/i), 'example.com');
    await user.click(screen.getByRole('button', { name: /apply/i }));

    await waitFor(() =>
      expect(onChange).toHaveBeenLastCalledWith(
        expect.stringContaining('href="https://example.com"')
      )
    );
  });

  it('does not submit a surrounding form when applying a link', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((e: { preventDefault: () => void }) => e.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Harness />
      </form>
    );
    await screen.findByRole('textbox');

    await user.click(screen.getByRole('button', { name: /link/i }));
    await user.type(await screen.findByLabelText(/link url/i), 'example.com');
    await user.click(screen.getByRole('button', { name: /apply/i }));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('applies a heading to only the block under the cursor, not the whole document', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness initial="<p>Alpha line</p><p>Beta line</p>" onChange={onChange} />);
    const box = await screen.findByRole('textbox');
    await user.click(box);
    await user.keyboard('{ArrowUp}{ArrowUp}'); // move into the first paragraph
    await user.click(screen.getByRole('button', { name: 'Heading' }));

    const last = onChange.mock.calls.at(-1)?.[0] ?? box.innerHTML;
    // exactly one block became a heading; the other stays a paragraph
    expect((last.match(/<h2>/g) ?? []).length).toBe(1);
    expect(last).toMatch(/<p>(Alpha|Beta) line<\/p>/);
  });

  it('applies a bullet list to only the block under the cursor', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness initial="<p>Alpha line</p><p>Beta line</p>" onChange={onChange} />);
    const box = await screen.findByRole('textbox');
    await user.click(box);
    await user.keyboard('{ArrowUp}{ArrowUp}');
    await user.click(screen.getByRole('button', { name: 'Bullet list' }));

    const last = onChange.mock.calls.at(-1)?.[0] ?? box.innerHTML;
    expect((last.match(/<ul>/g) ?? []).length).toBe(1);
    expect(last).toMatch(/<p>(Alpha|Beta) line<\/p>/);
  });

  it('renders a disabled, non-editable region when disabled', async () => {
    render(<RichTextEditor value="<p>x</p>" onChange={() => {}} disabled ariaLabel="Description" />);
    const box = await screen.findByRole('textbox');
    expect(box).toHaveAttribute('contenteditable', 'false');
    expect(screen.getByRole('button', { name: /bold/i })).toBeDisabled();
  });
});
