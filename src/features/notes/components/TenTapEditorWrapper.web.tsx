import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { EditorBridge } from '@10play/tentap-editor';
import { useGlassStyle } from '@/core/theme/useGlassStyle';
import {
  detectActiveBacklinkQuery,
  detectTrailingSlashCommand,
  stripHtmlToPlainText,
} from '@/features/notes/services/backlink.parser';

interface TenTapEditorWrapperProps {
  initialHtml: string;
  onHtmlChange: (html: string) => void;
  onFocusChange?: (focused: boolean) => void;
  onTriggerSlash?: () => void;
  onBacklinkQuery?: (query: string | null) => void;
  onEditorReady?: (editor: EditorBridge) => void;
}

const STYLE_ELEMENT_ID = 'liquid-notes-web-richtext-css';

const BLOCKED_TAGS = new Set(['SCRIPT', 'IFRAME', 'OBJECT', 'EMBED', 'STYLE', 'LINK', 'META', 'BASE']);

function sanitizeEditorHtml(rawHtml: string): string {
  if (!rawHtml || typeof DOMParser === 'undefined') return rawHtml;
  const doc = new DOMParser().parseFromString(rawHtml, 'text/html');
  const walk = (root: Element) => {
    for (const child of Array.from(root.children)) {
      if (BLOCKED_TAGS.has(child.tagName.toUpperCase())) {
        child.remove();
        continue;
      }
      for (const attr of Array.from(child.attributes)) {
        const name = attr.name.toLowerCase();
        const val = attr.value.trim().toLowerCase();
        if (
          name.startsWith('on') ||
          ((name === 'href' || name === 'src' || name === 'action') &&
            (val.startsWith('javascript:') || val.startsWith('data:text/html')))
        ) {
          child.removeAttribute(attr.name);
        }
      }
      walk(child);
    }
  };
  walk(doc.body);
  return doc.body.innerHTML;
}

function escapeHtmlText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function TenTapEditorWrapper({
  initialHtml,
  onHtmlChange,
  onFocusChange,
  onTriggerSlash,
  onBacklinkQuery,
  onEditorReady,
}: TenTapEditorWrapperProps) {
  const glass = useGlassStyle();
  const editorRef = useRef<HTMLDivElement | null>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const lastSlashRef = useRef(false);
  const checkHasContent = (el: HTMLDivElement | null, initial?: string): boolean => {
    if (el) {
      const plain = (el.innerText || '').trim();
      if (plain.length > 0) return true;
      return Boolean(el.querySelector('input, ul, ol, h1, h2, blockquote, pre, code, hr, .liquid-task-row'));
    }
    const raw = initial ?? '';
    return (
      stripHtmlToPlainText(raw).trim().length > 0 ||
      /<(input|ul|ol|h1|h2|blockquote|pre|code|hr)\b/i.test(raw)
    );
  };

  const [isEmpty, setIsEmpty] = useState(() => !checkHasContent(null, initialHtml));

  const saveSelection = () => {
    const el = editorRef.current;
    const sel = typeof window !== 'undefined' ? window.getSelection() : null;
    if (!el || !sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (el.contains(range.commonAncestorContainer)) {
      savedRangeRef.current = range.cloneRange();
    }
  };

  const restoreSelection = (): Range | null => {
    const el = editorRef.current;
    const sel = typeof window !== 'undefined' ? window.getSelection() : null;
    if (!el || !sel) return null;
    el.focus();
    if (savedRangeRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
      return savedRangeRef.current;
    }
    return sel.rangeCount > 0 ? sel.getRangeAt(0) : null;
  };

  const syncContent = () => {
    const el = editorRef.current;
    if (!el) return;
    const html = el.innerHTML;
    const plain = el.innerText || '';
    setIsEmpty(!checkHasContent(el));
    onHtmlChange(html);
    onBacklinkQuery?.(detectActiveBacklinkQuery(plain));

    const slash = detectTrailingSlashCommand(plain);
    if (slash !== null && !lastSlashRef.current && slash.length === 0) {
      lastSlashRef.current = true;
      onTriggerSlash?.();
    } else if (slash === null) {
      lastSlashRef.current = false;
    }
  };

  useEffect(() => {
    if (typeof document === 'undefined') return;
    let styleEl = document.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = STYLE_ELEMENT_ID;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = `
      .liquid-web-editor {
        outline: none !important;
        min-height: 220px;
        font-size: 16px;
        line-height: 1.65;
        word-break: break-word;
        user-select: text !important;
        -webkit-user-select: text !important;
        cursor: text;
      }
      .liquid-web-editor h1 { font-size: 24px; font-weight: 700; margin: 10px 0 6px; }
      .liquid-web-editor h2 { font-size: 19px; font-weight: 700; margin: 8px 0 4px; }
      .liquid-web-editor p { margin: 0 0 6px; }
      .liquid-web-editor blockquote {
        border-left: 3px solid ${glass.accentColor};
        padding-left: 12px;
        margin: 8px 0;
        opacity: 0.88;
      }
      .liquid-web-editor code, .liquid-web-editor pre {
        background: ${glass.surfaceElevatedColor};
        border-radius: 6px;
        padding: 2px 6px;
        font-family: monospace;
      }
      .liquid-web-editor ul, .liquid-web-editor ol {
        padding-left: 22px;
        margin: 4px 0 8px;
      }
      .liquid-web-editor mark {
        border-radius: 4px;
        padding: 1px 4px;
        color: #0F172A !important;
      }
      .liquid-web-editor .liquid-task-row {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        margin: 5px 0;
        width: 100%;
      }
      .liquid-web-editor .liquid-task-text {
        flex: 1;
        min-width: 0;
        line-height: 1.55;
        outline: none;
      }
      .liquid-web-editor .liquid-checkbox {
        appearance: none;
        -webkit-appearance: none;
        width: 18px;
        height: 18px;
        min-width: 18px;
        margin-top: 4px;
        border-radius: 5px;
        border: 1.5px solid ${glass.accentColor};
        background: transparent;
        cursor: pointer;
        position: relative;
        flex-shrink: 0;
        transition: all 0.15s ease;
      }
      .liquid-web-editor .liquid-checkbox:checked {
        background: ${glass.accentColor};
        border-color: ${glass.accentColor};
      }
      .liquid-web-editor .liquid-checkbox:checked::after {
        content: '✓';
        position: absolute;
        color: #FFFFFF;
        font-size: 12px;
        font-weight: 700;
        left: 3px;
        top: -1px;
      }
      .liquid-web-editor .liquid-checkbox:checked + .liquid-task-text {
        text-decoration: line-through;
        opacity: 0.55;
      }
    `;
  }, [glass.accentColor, glass.surfaceColor, glass.surfaceElevatedColor]);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = sanitizeEditorHtml(initialHtml) || '<p><br/></p>';
      setIsEmpty(!checkHasContent(editorRef.current, initialHtml));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const onSelectionChange = () => saveSelection();
    document.addEventListener('selectionchange', onSelectionChange);
    return () => document.removeEventListener('selectionchange', onSelectionChange);
  }, []);

  useEffect(() => {
    const exec = (cmd: string, value?: string) => {
      restoreSelection();
      document.execCommand(cmd, false, value);
      saveSelection();
      syncContent();
    };

    const applyHighlight = (color: string) => {
      const range = restoreSelection();
      if (!range || range.collapsed) return;
      const mark = document.createElement('mark');
      mark.style.backgroundColor = color;
      mark.style.color = '#0F172A';
      try {
        range.surroundContents(mark);
      } catch {
        const frag = range.extractContents();
        mark.appendChild(frag);
        range.insertNode(mark);
      }
      const sel = window.getSelection();
      if (sel) {
        const nextRange = document.createRange();
        nextRange.selectNodeContents(mark);
        sel.removeAllRanges();
        sel.addRange(nextRange);
        savedRangeRef.current = nextRange.cloneRange();
      }
      syncContent();
    };

    const clearHighlight = () => {
      const range = restoreSelection();
      if (!range) return;
      const ancestor =
        range.commonAncestorContainer.nodeType === 1
          ? (range.commonAncestorContainer as HTMLElement)
          : range.commonAncestorContainer.parentElement;
      const markEl = ancestor?.closest('mark');
      if (markEl && markEl.parentNode) {
        const textNode = document.createTextNode(markEl.textContent ?? '');
        markEl.parentNode.replaceChild(textNode, markEl);
        syncContent();
        return;
      }
      exec('hiliteColor', 'transparent');
    };

    const toggleInlineCode = () => {
      restoreSelection();
      const sel = window.getSelection();
      const selected = escapeHtmlText(sel?.toString() || 'code');
      document.execCommand('insertHTML', false, `<code>${selected}</code>`);
      saveSelection();
      syncContent();
    };

    const createTaskRowElement = (initialText: string) => {
      const row = document.createElement('div');
      row.className = 'liquid-task-row';

      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.className = 'liquid-checkbox';

      const span = document.createElement('span');
      span.className = 'liquid-task-text';
      if (initialText) {
        span.textContent = initialText;
      } else {
        span.appendChild(document.createElement('br'));
      }

      row.appendChild(cb);
      row.appendChild(span);
      return { row, span };
    };

    const insertTaskRow = () => {
      const el = editorRef.current;
      if (!el) return;
      const range = restoreSelection();
      const sel = window.getSelection();
      const selectedText = sel?.toString().trim() ?? '';
      const { row, span } = createTaskRowElement(selectedText);

      const anchor = range?.commonAncestorContainer ?? sel?.anchorNode ?? null;
      const anchorEl =
        anchor?.nodeType === 1 ? (anchor as HTMLElement) : anchor?.parentElement ?? null;
      const existingTaskRow = anchorEl?.closest('.liquid-task-row');

      if (existingTaskRow && existingTaskRow.parentNode) {
        // Insert as a sibling right after the current task row (never nest!)
        existingTaskRow.parentNode.insertBefore(row, existingTaskRow.nextSibling);
      } else if (range) {
        // Find top-level block directly inside .liquid-web-editor
        let block: HTMLElement | null = anchorEl;
        while (block && block.parentElement !== el) {
          block = block.parentElement;
        }
        if (block && block.parentElement === el) {
          const isBlockEmpty = !(block.textContent ?? '').trim() && !selectedText;
          if (isBlockEmpty) {
            el.replaceChild(row, block);
          } else {
            if (selectedText) range.deleteContents();
            el.insertBefore(row, block.nextSibling);
          }
        } else {
          el.appendChild(row);
        }
      } else {
        el.appendChild(row);
      }

      if (sel) {
        const nextRange = document.createRange();
        nextRange.selectNodeContents(span);
        nextRange.collapse(false);
        sel.removeAllRanges();
        sel.addRange(nextRange);
        savedRangeRef.current = nextRange.cloneRange();
      }
      syncContent();
    };

    const webBridge = {
      insertContent: (content: unknown) => {
        const html = typeof content === 'string' ? sanitizeEditorHtml(content) : '';
        exec('insertHTML', html);
      },
      toggleHeading: (lvl: number) => exec('formatBlock', lvl === 1 ? 'H1' : 'H2'),
      toggleBold: () => exec('bold'),
      toggleItalic: () => exec('italic'),
      toggleUnderline: () => exec('underline'),
      toggleStrike: () => exec('strikeThrough'),
      toggleHighlight: applyHighlight,
      setHighlight: applyHighlight,
      unsetHighlight: clearHighlight,
      toggleBulletList: () => exec('insertUnorderedList'),
      toggleOrderedList: () => exec('insertOrderedList'),
      toggleTaskList: insertTaskRow,
      toggleBlockquote: () => exec('formatBlock', 'BLOCKQUOTE'),
      toggleCode: toggleInlineCode,
      undo: () => exec('undo'),
      redo: () => exec('redo'),
    } as unknown as EditorBridge;

    onEditorReady?.(webBridge);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container}>
      {isEmpty ? (
        <div
          style={{
            position: 'absolute',
            top: 6,
            left: 2,
            pointerEvents: 'none',
            color: glass.textMuted,
            fontSize: 16,
            lineHeight: '26px',
          }}
        >
          Viết ghi chú... Gõ / để mở lệnh
        </div>
      ) : null}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        className="liquid-web-editor"
        onInput={syncContent}
        onMouseUp={saveSelection}
        onKeyUp={saveSelection}
        onKeyDown={(e) => {
          if (e.key !== 'Enter' || e.shiftKey) return;
          const sel = window.getSelection();
          const anchor = sel?.anchorNode;
          const el = anchor?.nodeType === 1 ? (anchor as HTMLElement) : anchor?.parentElement;
          const taskRow = el?.closest('.liquid-task-row');
          if (!taskRow) return;

          e.preventDefault();
          const textEl = taskRow.querySelector('.liquid-task-text');
          const textVal = (textEl?.textContent ?? '').trim();
          if (!textVal) {
            const p = document.createElement('p');
            p.appendChild(document.createElement('br'));
            taskRow.parentNode?.replaceChild(p, taskRow);
            const r = document.createRange();
            r.selectNodeContents(p);
            r.collapse(true);
            sel?.removeAllRanges();
            sel?.addRange(r);
          } else {
            const nextRow = document.createElement('div');
            nextRow.className = 'liquid-task-row';
            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.className = 'liquid-checkbox';
            const span = document.createElement('span');
            span.className = 'liquid-task-text';
            span.appendChild(document.createElement('br'));
            nextRow.appendChild(cb);
            nextRow.appendChild(span);
            taskRow.parentNode?.insertBefore(nextRow, taskRow.nextSibling);
            const r = document.createRange();
            r.selectNodeContents(span);
            r.collapse(true);
            sel?.removeAllRanges();
            sel?.addRange(r);
          }
          saveSelection();
          syncContent();
        }}
        onChange={(e) => {
          const target = e.target as unknown as HTMLInputElement;
          if (target?.type === 'checkbox') {
            if (target.checked) target.setAttribute('checked', 'checked');
            else target.removeAttribute('checked');
            syncContent();
          }
        }}
        onFocus={() => onFocusChange?.(true)}
        onBlur={() => onFocusChange?.(false)}
        style={{
          color: glass.textPrimary,
          fontFamily: glass.fontRegular,
          padding: '6px 2px 120px 2px',
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
});
