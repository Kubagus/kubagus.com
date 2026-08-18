import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Image from "@tiptap/extension-image";
import { common, createLowlight } from "lowlight";
import { useState } from "react";
import {
  Bold,
  Code,
  CodeXml,
  Heading1,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  List,
  ListOrdered,
  Minus,
  Redo2,
  Quote,
  Strikethrough,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const lowlight = createLowlight(common);

const IMAGE_URL_MAX_LENGTH = 2048;
const IMAGE_EXT_RE = /\.(png|jpe?g|gif|webp|avif|svg|bmp|ico|heic|heif)([?#].*)?$/i;

function isSafeImageUrl(url: string): boolean {
  if (url.length > IMAGE_URL_MAX_LENGTH) return false;
  return /^https?:\/\/[^\s"'<>]+$/i.test(url) || /^\/[^\s"'<>]+$/.test(url);
}

function isLikelyImageUrl(url: string): boolean {
  return isSafeImageUrl(url) && IMAGE_EXT_RE.test(url);
}

interface TipTapEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn("h-8 w-8", active && "bg-accent text-accent-foreground")}
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
    >
      {children}
    </Button>
  );
}

export function TipTapEditor({ value, onChange, placeholder, minHeight = 320 }: TipTapEditorProps) {
  const [imageOpen, setImageOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageError, setImageError] = useState<string | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: { levels: [1, 2, 3] },
      }),
      CodeBlockLowlight.configure({ lowlight }),
      Image.configure({
        allowBase64: false,
        HTMLAttributes: {
          loading: "lazy",
          decoding: "async",
        },
      }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "focus:outline-none prose prose-neutral dark:prose-invert max-w-none px-4 py-3",
        style: `min-height: ${minHeight}px`,
        ...(placeholder ? { "data-placeholder": placeholder } : {}),
      },
      handlePaste: (view, event) => {
        const text = event.clipboardData?.getData("text/plain")?.trim();
        const html = event.clipboardData?.getData("text/html");
        let url: string | null = null;
        if (text && isLikelyImageUrl(text)) {
          url = text.split(/\s/)[0];
        } else if (!url && html) {
          const imgSrc = html.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1];
          if (imgSrc && isSafeImageUrl(imgSrc)) url = imgSrc;
        }
        if (!url) return false;
        const { schema } = view.state;
        const imageNode = schema.nodes["image"]?.create({ src: url });
        if (!imageNode) return false;
        view.dispatch(view.state.tr.replaceSelectionWith(imageNode));
        return true;
      },
      handleDrop: (view, event) => {
        const text = event.dataTransfer?.getData("text/plain")?.trim();
        if (!text || !isLikelyImageUrl(text)) return false;
        const url = text.split(/\s/)[0];
        if (!isSafeImageUrl(url)) return false;
        const { schema } = view.state;
        const imageNode = schema.nodes["image"]?.create({ src: url });
        if (!imageNode) return false;
        const coords = view.posAtCoords({ left: event.clientX, top: event.clientY });
        if (!coords) return false;
        view.dispatch(view.state.tr.insert(coords.pos, imageNode));
        return true;
      },
    },
  });

  function insertImage() {
    if (!editor) return;
    const url = imageUrl.trim();
    if (!url) {
      setImageError("URL gambar wajib diisi.");
      return;
    }
    if (!isSafeImageUrl(url)) {
      setImageError("URL tidak valid. Hanya izinkan http(s) atau path relatif.");
      return;
    }
    editor.chain().focus().setImage({ src: url }).run();
    setImageOpen(false);
    setImageUrl("");
    setImageError(null);
  }

  if (!editor) return null;

  return (
    <div className="overflow-hidden rounded-lg border border-input bg-background">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-input bg-muted/50 px-1.5 py-1">
        <ToolbarButton
          label="Undo"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo2 className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Redo"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo2 className="size-4" />
        </ToolbarButton>
        <div className="mx-1 h-5 w-px bg-border" />
        <ToolbarButton
          label="Heading 1"
          active={editor.isActive("heading", { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1 className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Heading 2"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Heading 3"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 className="size-4" />
        </ToolbarButton>
        <div className="mx-1 h-5 w-px bg-border" />
        <ToolbarButton
          label="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Strikethrough"
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="size-4" />
        </ToolbarButton>
        <div className="mx-1 h-5 w-px bg-border" />
        <ToolbarButton
          label="Bullet list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Ordered list"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Quote"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="size-4" />
        </ToolbarButton>
        <div className="mx-1 h-5 w-px bg-border" />
        <ToolbarButton label="Inline code" active={editor.isActive("code")}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <Code className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Image from URL"
          active={editor.isActive("image")}
          onClick={() => {
            setImageError(null);
            setImageOpen(true);
          }}
        >
          <ImagePlus className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Code block"
          active={editor.isActive("codeBlock")}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <CodeXml className="size-4" />
        </ToolbarButton>
        <ToolbarButton label="Horizontal rule" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <Minus className="size-4" />
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} className="[&_.tiptap]:max-w-none" />

      <Dialog open={imageOpen} onOpenChange={setImageOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Masukkan Gambar dari URL</DialogTitle>
            <DialogDescription>
              Tempel URL gambar (http/https atau path relatif). URL akan divalidasi sebelum disisipkan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="image-url">URL gambar</Label>
            <Input
              id="image-url"
              type="url"
              value={imageUrl}
              onChange={(e) => {
                setImageUrl(e.target.value);
                setImageError(null);
              }}
              placeholder="https://example.com/gambar.png"
              maxLength={IMAGE_URL_MAX_LENGTH}
              autoComplete="off"
              spellCheck={false}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  insertImage();
                }
              }}
            />
            {imageError && <p className="text-sm font-medium text-destructive">{imageError}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setImageOpen(false)}>
              Batal
            </Button>
            <Button type="button" onClick={insertImage}>
              Sisipkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}