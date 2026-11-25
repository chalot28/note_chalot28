import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  RichText,
  TenTapStartKit,
  useBridgeState,
  useEditorBridge,
  useEditorContent,
  type EditorBridge,
} from '@10play/tentap-editor';
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

export function TenTapEditorWrapper({
  initialHtml,
  onHtmlChange,
  onFocusChange,
  onTriggerSlash,
  onBacklinkQuery,
  onEditorReady,
}: TenTapEditorWrapperProps) {
  const glass = useGlassStyle();
  const lastSlashRef = useRef(false);

  const editor = useEditorBridge({
    autofocus: false,
    avoidIosKeyboard: true,
    initialContent: initialHtml || '<p></p>',
    bridgeExtensions: TenTapStartKit,
  });

  const bridgeState = useBridgeState(editor);
  const htmlContent = useEditorContent(editor, { type: 'html', debounceInterval: 120 });

  useEffect(() => {
    onEditorReady?.(editor);
  }, [editor, onEditorReady]);

  useEffect(() => {
    onFocusChange?.(bridgeState.isFocused);
  }, [bridgeState.isFocused, onFocusChange]);

  useEffect(() => {
    if (!bridgeState.isReady) return;
    const css = `
      html, body, .ProseMirror {
        background: transparent !important;
        color: ${glass.textPrimary} !important;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 16px;
        line-height: 1.6;
        padding: 4px 2px 120px 2px;
      }
      blockquote {
        border-left: 3px solid ${glass.accentColor};
        padding-left: 12px;
        opacity: 0.88;
      }
      code, pre {
        background: ${glass.surfaceElevatedColor};
        border-radius: 8px;
        padding: 2px 6px;
      }
      input[type="checkbox"] {
        accent-color: ${glass.accentColor};
      }
    `;
    editor.injectCSS(css, 'liquid-theme');
  }, [bridgeState.isReady, editor, glass.accentColor, glass.surfaceElevatedColor, glass.textPrimary]);

  useEffect(() => {
    if (htmlContent === undefined) return;
    onHtmlChange(htmlContent);

    const plain = stripHtmlToPlainText(htmlContent);
    const backlinkQuery = detectActiveBacklinkQuery(plain);
    onBacklinkQuery?.(backlinkQuery);

    const slashCmd = detectTrailingSlashCommand(plain);
    if (slashCmd !== null && !lastSlashRef.current && slashCmd.length === 0) {
      lastSlashRef.current = true;
      onTriggerSlash?.();
    } else if (slashCmd === null) {
      lastSlashRef.current = false;
    }
  }, [htmlContent, onBacklinkQuery, onHtmlChange, onTriggerSlash]);

  return (
    <View style={styles.container}>
      <RichText
        editor={editor}
        style={styles.webview}
        containerStyle={styles.webview}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
