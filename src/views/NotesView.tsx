import { useState, useEffect, useRef } from "react";
import { 
  Notebook, 
  Plus, 
  Trash2, 
  Search, 
  Pin, 
  Copy, 
  Check, 
  Calendar,
  X,
  ChevronLeft,
  Bold
} from "lucide-react";
import { Note } from "@/lib/store";
import { toShamsiShort, toPersianDigits } from "@/lib/shamsi";
import { useThemeStyles } from "@/lib/useThemeStyles";

interface Props {
  notes: Note[];
  onAdd: (data: { title: string; content: string; folder: string; tags: string[] }) => void;
  onUpdate: (id: string, data: Partial<Note>) => void;
  onDelete: (id: string) => void;
}

export default function NotesView({ notes, onAdd, onUpdate, onDelete }: Props) {
  const { fg, fgMuted, cardBorder, inputBg, bg } = useThemeStyles();
  
  // States
  const [searchQuery, setSearchQuery] = useState("");
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [showMobileEditor, setShowMobileEditor] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const activeNote = notes.find((n) => n.id === activeNoteId) || null;

  // Auto-select first note if none is active or if active note was deleted
  useEffect(() => {
    if (notes.length > 0) {
      const activeExists = notes.some((n) => n.id === activeNoteId);
      if (!activeExists) {
        setActiveNoteId(notes[0].id);
        setShowMobileEditor(false);
      }
    } else {
      setActiveNoteId(null);
      setShowMobileEditor(false);
    }
  }, [notes, activeNoteId]);

  // Handle note creation
  const handleCreateNote = () => {
    onAdd({
      title: "یادداشت جدید",
      content: "",
      folder: "all",
      tags: [],
    });
    
    // Auto focus and open on mobile
    setTimeout(() => {
      if (notes.length > 0) {
        setActiveNoteId(notes[0].id);
      }
      setShowMobileEditor(true);
    }, 60);
  };

  // Filter notes by search query
  const filteredNotes = notes.filter((note) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = note.title.toLowerCase().includes(q);
      const matchContent = note.content.toLowerCase().includes(q);
      return matchTitle || matchContent;
    }
    return true;
  });

  // Copy note helper
  const handleCopyNote = () => {
    if (!activeNote) return;
    const fullText = `${activeNote.title}\n\n${activeNote.content}`;
    navigator.clipboard.writeText(fullText).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 1500);
    });
  };

  const getWordCount = (str: string) => {
    const clean = str.trim();
    return clean ? clean.split(/\s+/).length : 0;
  };

  return (
    <div className="mx-auto max-w-4xl" dir="rtl">
      <div 
        className="grid grid-cols-1 md:grid-cols-12 overflow-hidden rounded-2xl border"
        style={{ borderColor: cardBorder, height: "72vh", backgroundColor: bg }}
      >
        
        {/* COLUMN 1: MINIMALIST SIDEBAR (Notes List) */}
        <div 
          className={`md:col-span-4 border-l flex flex-col h-full overflow-hidden ${showMobileEditor ? "hidden md:flex" : "flex"}`}
          style={{ borderColor: cardBorder }}
        >
          {/* Header & Quick Search */}
          <div className="p-4 space-y-3 border-b" style={{ borderColor: cardBorder }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wide uppercase opacity-75" style={{ color: fgMuted }}>یادداشت‌ها</span>
              <button
                onClick={handleCreateNote}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-colors cursor-pointer shadow-sm"
                title="یادداشت جدید"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Apple Notes style minimalist search input */}
            <div 
              className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs border" 
              style={{ backgroundColor: inputBg, borderColor: cardBorder }}
            >
              <Search className="h-3.5 w-3.5 opacity-60" style={{ color: fgMuted }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو..."
                className="w-full bg-transparent outline-none text-xs"
                style={{ color: fg }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="text-gray-400 hover:text-white cursor-pointer">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Minimalist Cards List */}
          <div className="flex-1 overflow-y-auto divide-y" style={{ borderColor: cardBorder }}>
            {filteredNotes.length === 0 ? (
              <div className="py-16 text-center text-xs opacity-60" style={{ color: fgMuted }}>
                یادداشتی وجود ندارد
              </div>
            ) : (
              filteredNotes.map((note) => {
                const isActive = note.id === activeNoteId;
                const previewText = note.content.trim() 
                  ? note.content.trim().substring(0, 40) + (note.content.length > 40 ? "..." : "")
                  : "بدون متن";

                return (
                  <div
                    key={note.id}
                    onClick={() => {
                      setActiveNoteId(note.id);
                      setShowMobileEditor(true);
                    }}
                    className="w-full text-right p-3.5 transition-all cursor-pointer relative group block border-r-2"
                    style={{
                      borderRightColor: isActive ? "#f59e0b" : "transparent",
                      backgroundColor: isActive ? "rgba(245,158,11,0.04)" : "transparent"
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h4 
                        className={`text-xs font-bold truncate flex-1`}
                        style={{ color: isActive ? "#f59e0b" : fg }}
                      >
                        {note.title || "بدون عنوان"}
                      </h4>
                      <div className="flex items-center gap-1 shrink-0 text-[10px] opacity-60" style={{ color: fgMuted }}>
                        {note.is_pinned && (
                          <Pin className="h-3 w-3 text-amber-500 fill-amber-500" />
                        )}
                        <span>
                          {toPersianDigits(toShamsiShort(note.created_date))}
                        </span>
                      </div>
                    </div>
                    
                    <p className={`mt-1 text-[11px] truncate opacity-70 ${note.is_bold ? "font-bold text-amber-500/90" : ""}`} style={{ color: note.is_bold ? undefined : fgMuted }}>
                      {previewText}
                    </p>

                    {/* Minimalist delete on hover */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(note.id);
                      }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 rounded-md bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white transition-all cursor-pointer"
                      title="حذف یادداشت"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* COLUMN 2: ZEN EDITOR WORKSPACE */}
        <div 
          className={`md:col-span-8 flex flex-col h-full overflow-hidden ${showMobileEditor ? "flex" : "hidden md:flex"}`}
        >
          {activeNote ? (
            <>
              {/* Workspace Simple Top Bar */}
              <div 
                className="px-4 py-3 flex items-center justify-between border-b"
                style={{ borderColor: cardBorder }}
              >
                {/* Back to list on mobile */}
                <button
                  onClick={() => setShowMobileEditor(false)}
                  className="md:hidden flex items-center gap-1 text-xs font-bold"
                  style={{ color: fg }}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>یادداشت‌ها</span>
                </button>

                {/* Left Side utilities */}
                <div className="flex items-center gap-1 mr-auto">
                  <button
                    onClick={() => onUpdate(activeNote.id, { is_bold: !activeNote.is_bold })}
                    className="p-1.5 rounded-lg transition-colors cursor-pointer hover:bg-white/5"
                    style={{ color: activeNote.is_bold ? "#f59e0b" : fgMuted }}
                    title={activeNote.is_bold ? "حذف حالت بولد" : "حالت بولد یادداشت"}
                  >
                    <Bold className={`h-4 w-4 ${activeNote.is_bold ? "text-amber-500 font-bold" : ""}`} />
                  </button>

                  <button
                    onClick={() => onUpdate(activeNote.id, { is_pinned: !activeNote.is_pinned })}
                    className="p-1.5 rounded-lg transition-colors cursor-pointer"
                    style={{ color: activeNote.is_pinned ? "#f59e0b" : fgMuted }}
                    title={activeNote.is_pinned ? "برداشتن پین" : "پین کردن یادداشت"}
                  >
                    <Pin className={`h-4 w-4 ${activeNote.is_pinned ? "fill-amber-500 text-amber-500" : ""}`} />
                  </button>
                  
                  <button
                    onClick={handleCopyNote}
                    className="p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                    style={{ color: copySuccess ? "#10b981" : fgMuted }}
                    title="کپی متن"
                  >
                    {copySuccess ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  </button>

                  <button
                    onClick={() => {
                      onDelete(activeNote.id);
                    }}
                    className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-400 transition-colors cursor-pointer"
                    title="حذف یادداشت"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Pure Elegant Zen Canvas */}
              <div className="flex-1 flex flex-col p-6 space-y-4 overflow-y-auto">
                <input
                  type="text"
                  value={activeNote.title}
                  onChange={(e) => onUpdate(activeNote.id, { title: e.target.value })}
                  placeholder="عنوان یادداشت..."
                  className="w-full bg-transparent text-lg font-bold outline-none border-b pb-2 tracking-tight"
                  style={{ color: fg, borderColor: `${cardBorder}33` }}
                />

                <textarea
                  ref={textareaRef}
                  value={activeNote.content}
                  onChange={(e) => onUpdate(activeNote.id, { content: e.target.value })}
                  placeholder="شروع به تایپ کنید..."
                  className={`w-full flex-1 bg-transparent resize-none outline-none text-sm leading-relaxed ${activeNote.is_bold ? "font-bold" : ""}`}
                  style={{ color: fg }}
                />
              </div>

              {/* Status footer bar */}
              <div 
                className="px-5 py-2.5 border-t flex items-center justify-between text-[10px]"
                style={{ borderColor: cardBorder, backgroundColor: "rgba(128,128,128,0.01)" }}
              >
                <span style={{ color: fgMuted }}>
                  {toPersianDigits(getWordCount(activeNote.content))} کلمه
                </span>
                <div className="flex items-center gap-1 opacity-70" style={{ color: fgMuted }}>
                  <Calendar className="h-3 w-3" />
                  <span>آخرین ویرایش: {toPersianDigits(new Date(activeNote.updated_at).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }))}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-3">
              <Notebook className="h-10 w-10 opacity-20" />
              <p className="text-xs opacity-60" style={{ color: fgMuted }}>هیچ یادداشتی باز نیست</p>
              <button
                onClick={handleCreateNote}
                className="rounded-lg bg-amber-500 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-amber-600 transition-colors shadow-sm"
              >
                ایجاد یادداشت جدید
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
