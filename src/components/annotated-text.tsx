"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { ViewCommentPopover, CreateCommentPopover } from "@/components/comment-popover";
import { MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NoteComment {
  id: string;
  field: string;
  quotedText: string;
  startOffset: number;
  endOffset: number;
  body: string;
  resolved: boolean;
  createdAt: string;
}

interface AnnotatedTextProps {
  text: string;
  field: "content" | "summary";
  comments: NoteComment[];
  onAddComment: (comment: {
    field: string;
    quotedText: string;
    startOffset: number;
    endOffset: number;
    body: string;
  }) => Promise<void>;
  onDeleteComment: (commentId: string) => void;
  className?: string;
}

interface TextSegment {
  text: string;
  start: number;
  end: number;
  comment: NoteComment | null;
}

function buildSegments(text: string, comments: NoteComment[]): TextSegment[] {
  if (comments.length === 0) {
    return [{ text, start: 0, end: text.length, comment: null }];
  }

  const anchored = comments
    .map((c) => {
      const slice = text.slice(c.startOffset, c.endOffset);
      if (slice === c.quotedText) return c;
      const idx = text.indexOf(c.quotedText);
      if (idx !== -1) {
        return { ...c, startOffset: idx, endOffset: idx + c.quotedText.length };
      }
      return null;
    })
    .filter((c): c is NoteComment => c !== null)
    .sort((a, b) => a.startOffset - b.startOffset);

  const segments: TextSegment[] = [];
  let pos = 0;

  for (const comment of anchored) {
    if (comment.startOffset > pos) {
      segments.push({
        text: text.slice(pos, comment.startOffset),
        start: pos,
        end: comment.startOffset,
        comment: null,
      });
    }
    const start = Math.max(comment.startOffset, pos);
    if (start < comment.endOffset) {
      segments.push({
        text: text.slice(start, comment.endOffset),
        start,
        end: comment.endOffset,
        comment,
      });
    }
    pos = Math.max(pos, comment.endOffset);
  }

  if (pos < text.length) {
    segments.push({
      text: text.slice(pos),
      start: pos,
      end: text.length,
      comment: null,
    });
  }

  return segments;
}

export function AnnotatedText({
  text,
  field,
  comments,
  onAddComment,
  onDeleteComment,
  className,
}: AnnotatedTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const floatingRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const [selection, setSelection] = useState<{
    text: string;
    startOffset: number;
    endOffset: number;
  } | null>(null);
  const [selectionButtonPos, setSelectionButtonPos] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [createPopoverOpen, setCreatePopoverOpen] = useState(false);
  const [createPopoverPos, setCreatePopoverPos] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const handleMouseUp = useCallback(() => {
    if (createPopoverOpen) return;

    setTimeout(() => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !containerRef.current) {
        setSelection(null);
        setSelectionButtonPos(null);
        return;
      }

      const range = sel.getRangeAt(0);
      if (!containerRef.current.contains(range.commonAncestorContainer)) {
        return;
      }

      const selectedText = sel.toString();
      if (!selectedText.trim()) {
        setSelection(null);
        setSelectionButtonPos(null);
        return;
      }

      // Walk text nodes to compute the precise offset within the source text
      const treeWalker = document.createTreeWalker(
        containerRef.current,
        NodeFilter.SHOW_TEXT
      );
      let charCount = 0;
      let startOffset = -1;
      let endOffset = -1;

      while (treeWalker.nextNode()) {
        const node = treeWalker.currentNode;
        if (node === range.startContainer) {
          startOffset = charCount + range.startOffset;
        }
        if (node === range.endContainer) {
          endOffset = charCount + range.endOffset;
          break;
        }
        charCount += node.textContent?.length ?? 0;
      }

      if (startOffset === -1 || endOffset === -1 || startOffset >= endOffset) {
        // Fallback: try indexOf
        const idx = text.indexOf(selectedText);
        if (idx === -1) {
          setSelection(null);
          setSelectionButtonPos(null);
          return;
        }
        startOffset = idx;
        endOffset = idx + selectedText.length;
      }

      const rect = range.getBoundingClientRect();
      setSelection({
        text: selectedText,
        startOffset,
        endOffset,
      });
      setSelectionButtonPos({
        top: rect.top - 40,
        left: rect.left + rect.width / 2 - 16,
      });
    }, 10);
  }, [text, createPopoverOpen]);

  // Click outside: clear selection, but NOT if clicking the floating button or popover
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (floatingRef.current?.contains(target)) return;
      if (popoverRef.current?.contains(target)) return;
      if (containerRef.current?.contains(target)) return;
      if (createPopoverOpen) return;

      setSelection(null);
      setSelectionButtonPos(null);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [createPopoverOpen]);

  function handleOpenCreatePopover() {
    if (!selection || !selectionButtonPos) return;
    setCreatePopoverPos({
      top: selectionButtonPos.top + 44,
      left: selectionButtonPos.left - 120,
    });
    setCreatePopoverOpen(true);
    window.getSelection()?.removeAllRanges();
  }

  async function handleSaveComment(body: string) {
    if (!selection) return;
    await onAddComment({
      field,
      quotedText: selection.text,
      startOffset: selection.startOffset,
      endOffset: selection.endOffset,
      body,
    });
    setSelection(null);
    setSelectionButtonPos(null);
    setCreatePopoverOpen(false);
  }

  const segments = buildSegments(text, comments);

  return (
    <div className="relative">
      <div
        ref={containerRef}
        onMouseUp={handleMouseUp}
        className={className}
      >
        {segments.map((seg, i) =>
          seg.comment ? (
            <ViewCommentPopover
              key={`${seg.comment.id}-${i}`}
              comment={seg.comment}
              onDelete={onDeleteComment}
            >
              <span className="cursor-pointer rounded-sm bg-amber-200/50 decoration-amber-400 underline decoration-wavy decoration-1 underline-offset-2">
                {seg.text}
              </span>
            </ViewCommentPopover>
          ) : (
            <span key={i}>{seg.text}</span>
          )
        )}
      </div>

      {/* Floating "add comment" button near selection */}
      {selection && selectionButtonPos && !createPopoverOpen && (
        <div
          ref={floatingRef}
          className="fixed z-50"
          style={{ top: selectionButtonPos.top, left: selectionButtonPos.left }}
        >
          <Button
            size="icon"
            className="size-8 rounded-xl shadow-lg"
            onMouseDown={(e) => {
              // Prevent clearing browser selection and triggering click-outside
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={handleOpenCreatePopover}
          >
            <MessageSquarePlus className="size-4" />
          </Button>
        </div>
      )}

      {/* Create comment popover */}
      {createPopoverOpen && (
        <div ref={popoverRef}>
          <CreateCommentPopover
            quotedText={selection?.text ?? ""}
            open={createPopoverOpen}
            onOpenChange={(open) => {
              setCreatePopoverOpen(open);
              if (!open) {
                setSelection(null);
                setSelectionButtonPos(null);
              }
            }}
            onSave={handleSaveComment}
            anchorRect={createPopoverPos}
          />
        </div>
      )}
    </div>
  );
}
