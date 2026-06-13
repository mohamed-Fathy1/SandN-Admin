import { useEffect, useId, useMemo, useReducer, useRef, useState } from 'react';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import * as Popover from '@radix-ui/react-popover';
import { Bold, Heading2, Heading3, Italic, Link2, List, ListOrdered } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/utils/cn';
import { descriptionToEditorHtml } from '@/shared/utils/html';

export interface RichTextEditorProps {
  /** HTML string. */
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  dir?: 'ltr' | 'rtl';
  hasError?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  /** id applied to the editable region so a label/error can reference it. */
  id?: string;
  ariaDescribedBy?: string;
}

/**
 * Single-language WYSIWYG editor producing HTML. Toolbar: bold, italic,
 * H2/H3 headings, bullet + ordered lists, and links. Bilingual usage wraps
 * one instance per language tab (see <BilingualInput richText>), so `dir`
 * is fixed for the lifetime of each instance.
 */
export function RichTextEditor({
  value,
  onChange,
  placeholder,
  dir = 'ltr',
  hasError,
  disabled,
  ariaLabel,
  id,
  ariaDescribedBy,
}: RichTextEditorProps) {
  const { t } = useTranslation('common');

  // Always call the latest onChange from Tiptap's captured onUpdate closure.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // ProseMirror state (selection / active marks) lives outside React; force a
  // re-render on every transaction so the toolbar active states stay in sync.
  const [, forceUpdate] = useReducer((n: number) => n + 1, 0);

  const attributes = useMemo(() => {
    const attrs: Record<string, string> = {
      role: 'textbox',
      'aria-multiline': 'true',
      dir,
      class: cn(
        'rte-content min-h-[140px] px-4 py-3 text-sm text-foreground focus:outline-none',
        dir === 'rtl' && 'text-right'
      ),
    };
    if (id) attrs.id = id;
    if (ariaLabel) attrs['aria-label'] = ariaLabel;
    if (ariaDescribedBy) attrs['aria-describedby'] = ariaDescribedBy;
    if (hasError) attrs['aria-invalid'] = 'true';
    return attrs;
  }, [dir, id, ariaLabel, ariaDescribedBy, hasError]);

  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    content: descriptionToEditorHtml(value),
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
        },
        // Disable formats that have no toolbar control AND are stripped by the
        // storefront sanitizer — otherwise a keyboard shortcut (e.g. Cmd+U)
        // would apply formatting that silently disappears for customers.
        underline: false,
        strike: false,
        code: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
      }),
      Placeholder.configure({ placeholder: placeholder ?? '' }),
    ],
    editorProps: { attributes },
    onUpdate: ({ editor }) => {
      onChangeRef.current(editor.isEmpty ? '' : editor.getHTML());
    },
  });

  // Keep aria/dir/error attributes in sync when props change.
  useEffect(() => {
    editor?.setOptions({ editorProps: { attributes } });
  }, [editor, attributes]);

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [editor, disabled]);

  // Re-render toolbar on selection / content changes.
  useEffect(() => {
    if (!editor) return;
    const update = () => forceUpdate();
    editor.on('transaction', update);
    return () => {
      editor.off('transaction', update);
    };
  }, [editor]);

  // Controlled-value sync without clobbering the cursor: only push the
  // external value in when it diverges from the editor's current HTML.
  useEffect(() => {
    if (!editor) return;
    const incoming = descriptionToEditorHtml(value);
    const current = editor.isEmpty ? '' : editor.getHTML();
    if (incoming !== current) {
      editor.commands.setContent(incoming, { emitUpdate: false });
    }
  }, [editor, value]);

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border bg-card transition-[border-color,box-shadow] duration-150',
        hasError
          ? 'border-destructive focus-within:border-destructive focus-within:shadow-[var(--shadow-focus-destructive)]'
          : 'border-border-medium hover:border-border-strong focus-within:border-accent focus-within:shadow-[var(--shadow-focus-accent)]',
        disabled && 'cursor-not-allowed bg-muted/50 opacity-50'
      )}
    >
      <div
        role="toolbar"
        aria-label={t('richText.toolbar')}
        aria-orientation="horizontal"
        className="flex flex-wrap items-center gap-0.5 border-b border-border px-2 py-1.5"
      >
        <ToolbarButton
          label={t('richText.bold')}
          active={editor?.isActive('bold') ?? false}
          disabled={disabled}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <Bold size={16} strokeWidth={2} aria-hidden />
        </ToolbarButton>
        <ToolbarButton
          label={t('richText.italic')}
          active={editor?.isActive('italic') ?? false}
          disabled={disabled}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <Italic size={16} strokeWidth={2} aria-hidden />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          label={t('richText.heading2')}
          active={editor?.isActive('heading', { level: 2 }) ?? false}
          disabled={disabled}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 size={16} strokeWidth={2} aria-hidden />
        </ToolbarButton>
        <ToolbarButton
          label={t('richText.heading3')}
          active={editor?.isActive('heading', { level: 3 }) ?? false}
          disabled={disabled}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 size={16} strokeWidth={2} aria-hidden />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          label={t('richText.bulletList')}
          active={editor?.isActive('bulletList') ?? false}
          disabled={disabled}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <List size={16} strokeWidth={2} aria-hidden />
        </ToolbarButton>
        <ToolbarButton
          label={t('richText.orderedList')}
          active={editor?.isActive('orderedList') ?? false}
          disabled={disabled}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={16} strokeWidth={2} aria-hidden />
        </ToolbarButton>

        <ToolbarDivider />

        <LinkControl editor={editor} disabled={disabled} />
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}

function ToolbarButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={label}
      disabled={disabled}
      // Keep the editor's text selection while clicking the toolbar.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'disabled:cursor-not-allowed disabled:opacity-40',
        active
          ? 'bg-accent-soft text-accent'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <span aria-hidden className="mx-1 h-5 w-px bg-border" />;
}

function normalizeUrl(raw: string): string {
  const url = raw.trim();
  if (!url) return '';
  if (/^(https?:\/\/|mailto:|tel:)/i.test(url)) return url;
  return `https://${url}`;
}

function LinkControl({ editor, disabled }: { editor: Editor | null; disabled?: boolean }) {
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const isActive = editor?.isActive('link') ?? false;

  const apply = () => {
    if (!editor) return;
    const href = normalizeUrl(url);
    if (!href) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      setOpen(false);
      return;
    }
    if (editor.state.selection.empty && !editor.isActive('link')) {
      // No selection: `setLink` would link nothing, so insert the URL itself
      // as the linked text.
      editor
        .chain()
        .focus()
        .insertContent({ type: 'text', text: href, marks: [{ type: 'link', attrs: { href } }] })
        .run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
    }
    setOpen(false);
  };

  const remove = () => {
    editor?.chain().focus().extendMarkRange('link').unsetLink().run();
    setOpen(false);
  };

  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        if (next) setUrl((editor?.getAttributes('link').href as string) ?? '');
        setOpen(next);
      }}
    >
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={t('richText.link')}
          aria-pressed={isActive}
          title={t('richText.link')}
          disabled={disabled}
          onMouseDown={(e) => e.preventDefault()}
          className={cn(
            'inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'disabled:cursor-not-allowed disabled:opacity-40',
            isActive
              ? 'bg-accent-soft text-accent'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <Link2 size={16} strokeWidth={2} aria-hidden />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            inputRef.current?.focus({ preventScroll: true });
          }}
          className="z-50 flex w-72 flex-col gap-2 rounded-xl border border-border bg-card p-3 shadow-popover"
        >
          {/* No <form> here: a submit button would bubble its submit event
              through the React portal to the surrounding product <form> and
              save it with stale values. Plain buttons + Enter-to-apply avoid
              generating any submit event. */}
          <label htmlFor={inputId} className="text-xs font-medium text-foreground">
            {t('richText.linkUrl')}
          </label>
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            dir="ltr"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                apply();
              }
            }}
            placeholder={t('richText.linkPlaceholder')}
            className="h-9 w-full rounded-lg border border-border-medium bg-card px-3 text-xs text-foreground placeholder:text-light-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <div className="flex justify-end gap-2">
            {isActive ? (
              <button
                type="button"
                onClick={remove}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-destructive hover:bg-muted"
              >
                {t('richText.remove')}
              </button>
            ) : null}
            <button
              type="button"
              onClick={apply}
              className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:bg-accent-hover"
            >
              {t('richText.apply')}
            </button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
