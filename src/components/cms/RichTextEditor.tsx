'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import CodeBlock from '@tiptap/extension-code-block';
import Typography from '@tiptap/extension-typography';
import { useEffect, useState } from 'react';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Image as ImageIcon,
  Heading1,
  Heading2,
  Heading3,
  Code,
  Minus,
  Undo,
  Redo,
  Type,
  Terminal,
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { MediaLibrary } from './MediaLibrary';
import { Media } from '@/schemas/cms';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
}

interface MenuButtonProps {
  onClick: () => void;
  isActive?: boolean;
  children: React.ReactNode;
  title: string;
}

export const RichTextEditor = ({ content, onChange }: RichTextEditorProps) => {
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  const getSanitizedContent = (rawContent: unknown): string => {
    if (!rawContent) return '';
    if (typeof rawContent === 'string') return rawContent;
    if (rawContent && typeof rawContent === 'object' && 'root' in rawContent) {
      return '<p><i>[Legacy Lexical Content Detected - Please Re-edit]</i></p>';
    }
    return '';
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: false,
      }),
      CodeBlock.configure({
        HTMLAttributes: {
          class:
            'bg-secondary/50 rounded-md p-4 font-mono text-sm border-2 border-border my-4 block',
        },
      }),
      Typography,
      Placeholder.configure({
        placeholder: 'Start writing your masterpiece...',
      }),
      Link.configure({ openOnClick: false }),
      Image.configure({
        HTMLAttributes: {
          class:
            'border-4 border-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] my-8 max-w-full h-auto',
        },
      }),
    ],
    content: getSanitizedContent(content),
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    immediatelyRender: false,
  });

  const insertImages = (assets: Media | Media[]) => {
    if (!editor) return;

    const assetsArray = Array.isArray(assets) ? assets : [assets];

    assetsArray.forEach((media) => {
      editor
        .chain()
        .focus()
        .setImage({
          src: media.imageKitUrl,
          alt: media.altText || media.filename,
        })
        .run();
    });

    setIsMediaModalOpen(false);
  };

  useEffect(() => {
    if (editor && content) {
      const currentHTML = editor.getHTML();
      const newHTML = getSanitizedContent(content);
      if (newHTML !== currentHTML && newHTML !== '' && newHTML !== '<p></p>') {
        editor.commands.setContent(newHTML);
      }
    }
  }, [editor, content]);

  if (!editor) return null;

  const MenuButton = ({
    onClick,
    isActive = false,
    children,
    title,
  }: MenuButtonProps) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`border-r border-border/50 p-2 transition-all hover:bg-primary/10 ${
        isActive
          ? 'bg-primary/5 text-primary'
          : 'text-muted-foreground hover:text-primary'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="brutal-border w-full overflow-hidden border-2 border-border bg-card transition-colors focus-within:border-primary">
      <div className="sticky top-0 z-10 flex flex-wrap items-center border-b-2 border-border bg-secondary/30 p-1">
        <div className="mr-2 flex items-center border-r border-border pr-2">
          <MenuButton
            onClick={() => editor.chain().focus().undo().run()}
            title="Undo"
          >
            <Undo className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().redo().run()}
            title="Redo"
          >
            <Redo className="h-4 w-4" />
          </MenuButton>
        </div>

        <div className="mr-2 flex items-center border-r border-border pr-2">
          <MenuButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            isActive={editor.isActive('code')}
            title="Inline Code"
          >
            <Code className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            isActive={editor.isActive('codeBlock')}
            title="Code Block"
          >
            <Terminal className="h-4 w-4" />
          </MenuButton>
        </div>

        <div className="mr-2 flex items-center border-r border-border pr-2">
          <MenuButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            isActive={editor.isActive('heading', { level: 1 })}
            title="H1"
          >
            <Heading1 className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            isActive={editor.isActive('heading', { level: 2 })}
            title="H2"
          >
            <Heading2 className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            isActive={editor.isActive('heading', { level: 3 })}
            title="H3"
          >
            <Heading3 className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().setParagraph().run()}
            isActive={editor.isActive('paragraph')}
            title="Text"
          >
            <Type className="h-4 w-4" />
          </MenuButton>
        </div>

        <div className="mr-2 flex items-center border-r border-border pr-2">
          <MenuButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="Bullets"
          >
            <List className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="Numbers"
          >
            <ListOrdered className="h-4 w-4" />
          </MenuButton>
        </div>

        <div className="mr-2 flex items-center border-r border-border pr-2">
          <MenuButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            title="Quote"
          >
            <Quote className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Divider"
          >
            <Minus className="h-4 w-4" />
          </MenuButton>
        </div>

        <div className="flex items-center">
          <MenuButton onClick={() => {}} title="Link">
            <LinkIcon className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => setIsMediaModalOpen(true)}
            title="Insert Image"
          >
            <ImageIcon className="h-4 w-4" />
          </MenuButton>
        </div>
      </div>

      <Dialog open={isMediaModalOpen} onOpenChange={setIsMediaModalOpen}>
        <DialogContent className="max-w-7xl border-none bg-transparent p-0 shadow-none">
          <DialogTitle className="sr-only">Media Library</DialogTitle>
          <MediaLibrary
            onSelect={insertImages}
            onSelectMultiple={insertImages}
            allowSelection
            multiSelect
          />
        </DialogContent>
      </Dialog>

      <div className="min-h-[600px] cursor-text bg-background">
        <EditorContent
          editor={editor}
          className="min-h-[600px] max-w-none px-6 pb-4 pt-6 selection:bg-primary/30 focus:outline-none"
        />
      </div>

      {/* Editor Footer Info */}
      <div className="flex items-center justify-between border-t-2 border-border bg-secondary/10 px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-primary">CHARACTERS:</span>
            <span>{editor.getText().length}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-primary">WORDS:</span>
            <span>
              {
                editor
                  .getText()
                  .split(/\s+/)
                  .filter((w) => w.length > 0).length
              }
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-primary">AUTO-SYNC:</span>
          <span>ACTIVE</span>
        </div>
      </div>

      <style jsx global>{`
        .ProseMirror {
          color: #e0e0e0;
          font-size: 1.125rem;
          line-height: 1.75;
          outline: none !important;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #666;
          pointer-events: none;
          height: 0;
        }
        .ProseMirror > *:first-child {
          margin-top: 0 !important;
        }
        .ProseMirror h1 {
          font-size: 2.5rem;
          font-weight: 800;
          margin-top: 2rem;
          margin-bottom: 1.5rem;
          color: #fff;
          line-height: 1.2;
          text-transform: uppercase;
          letter-spacing: -0.02em;
        }
        .ProseMirror h2 {
          font-size: 1.875rem;
          font-weight: 700;
          margin-top: 2rem;
          margin-bottom: 1.25rem;
          color: #fff;
          line-height: 1.3;
        }
        .ProseMirror h3 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-top: 1.5rem;
          margin-bottom: 1rem;
          color: #fff;
          line-height: 1.4;
        }
        .ProseMirror p {
          margin-bottom: 1.25rem;
        }
        .ProseMirror pre {
          background: #111 !important;
          color: rgb(var(--primary)) !important;
          padding: 1.5rem;
          border-radius: 0;
          border: 2px solid #333;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          margin: 2rem 0;
          box-shadow: 4px 4px 0px 0px rgba(0, 0, 0, 1);
        }
        .ProseMirror blockquote {
          border-left: 4px solid rgb(var(--primary));
          padding-left: 1.5rem;
          font-style: italic;
          color: #a0a0a0;
          margin: 1.5rem 0;
          background: rgba(var(--primary), 0.05);
          padding-top: 1rem;
          padding-bottom: 1rem;
        }
        .ProseMirror ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin-bottom: 1.25rem;
        }
        .ProseMirror ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin-bottom: 1.25rem;
        }
      `}</style>
    </div>
  );
};
