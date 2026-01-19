import React, { useRef, useCallback, useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView, WebViewMessageEvent, WebViewNavigation } from 'react-native-webview';

interface LivewireWebViewProps {
  onSuccess: (token: string) => void;
  onError: (error: string) => void;
  email: string;
  action: 'signup' | 'forgot-password';
  trigger: boolean;
}

export default function LivewireWebView({ 
  onSuccess, 
  onError, 
  email, 
  action, 
  trigger 
}: LivewireWebViewProps) {
  const webViewRef = useRef<WebView>(null);
  const [isReady, setIsReady] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const baseUrl = action === 'signup' 
    ? 'https://uservault.net/auth/signup' 
    : 'https://uservault.net/auth/forgot-password';

  const successPattern = useMemo(() => 
    action === 'signup' 
      ? /signup-success\/([^\/\?]+)/ 
      : /forgot-success\/([^\/\?]+)/
  , [action]);

  const injectedJavaScript = `
    (function() {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'page_loaded',
        url: window.location.href
      }));

      // Override console.log to capture Livewire logs
      const originalLog = console.log;
      console.log = function(...args) {
        originalLog.apply(console, args);
        try {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'console',
            message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
          }));
        } catch(e) {}
      };

      // Listen for Livewire navigation
      document.addEventListener('livewire:navigated', function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'navigated',
          url: window.location.href
        }));
      });

      // Watch for URL changes
      let lastUrl = window.location.href;
      setInterval(function() {
        if (window.location.href !== lastUrl) {
          lastUrl = window.location.href;
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'url_changed',
            url: window.location.href
          }));
        }
      }, 100);

      true;
    })();
  `;

  const fillAndSubmitForm = useCallback(() => {
    if (!webViewRef.current || !email || hasSubmitted) return;

    console.log('[LivewireWebView] Filling form with email:', email);
    setHasSubmitted(true);

    const submitScript = `
      (function() {
        try {
          // Find the email input field
          const emailInput = document.querySelector('input[type="email"]') || 
                            document.querySelector('input[name="emailAddress"]') ||
                            document.querySelector('input[name="email"]') ||
                            document.querySelector('[wire\\\\:model="emailAddress"]') ||
                            document.querySelector('[wire\\\\:model.live="emailAddress"]') ||
                            document.querySelector('[wire\\\\:model.blur="emailAddress"]');
          
          if (!emailInput) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'error',
              message: 'Email input not found'
            }));
            return;
          }

          // Set the email value
          emailInput.value = '${email}';
          emailInput.dispatchEvent(new Event('input', { bubbles: true }));
          emailInput.dispatchEvent(new Event('change', { bubbles: true }));
          emailInput.dispatchEvent(new Event('blur', { bubbles: true }));

          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'email_set',
            email: '${email}'
          }));

          // Wait a moment for Livewire to process
          setTimeout(function() {
            // Find and click the submit button
            const submitButton = document.querySelector('button[type="submit"]') ||
                                document.querySelector('form button') ||
                                document.querySelector('[wire\\\\:click="submitForm"]') ||
                                document.querySelector('button:not([type="button"])');

            if (!submitButton) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'error',
                message: 'Submit button not found'
              }));
              return;
            }

            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'submitting'
            }));

            submitButton.click();

            // Check for errors after submission
            setTimeout(function() {
              const errorEl = document.querySelector('.text-red-500') ||
                             document.querySelector('.text-danger') ||
                             document.querySelector('[class*="error"]') ||
                             document.querySelector('.invalid-feedback');
              
              if (errorEl && errorEl.textContent.trim()) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'validation_error',
                  message: errorEl.textContent.trim()
                }));
              }
            }, 2000);

          }, 500);

        } catch(e) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'error',
            message: e.message || 'Unknown error'
          }));
        }
      })();
      true;
    `;

    webViewRef.current.injectJavaScript(submitScript);
  }, [email, hasSubmitted]);

  useEffect(() => {
    if (trigger && isReady && !hasSubmitted) {
      console.log('[LivewireWebView] Trigger received, filling form...');
      setTimeout(fillAndSubmitForm, 500);
    }
  }, [trigger, isReady, hasSubmitted, fillAndSubmitForm]);

  const handleMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('[LivewireWebView] Message:', data.type, data.message || data.url || '');

      switch (data.type) {
        case 'page_loaded':
          console.log('[LivewireWebView] Page loaded:', data.url);
          setIsReady(true);
          break;

        case 'email_set':
          console.log('[LivewireWebView] Email set:', data.email);
          break;

        case 'submitting':
          console.log('[LivewireWebView] Form submitting...');
          break;

        case 'url_changed':
        case 'navigated':
          console.log('[LivewireWebView] Navigation:', data.url);
          const match = data.url.match(successPattern);
          if (match && match[1]) {
            console.log('[LivewireWebView] Success! Token:', match[1]);
            onSuccess(match[1]);
          }
          break;

        case 'validation_error':
          console.log('[LivewireWebView] Validation error:', data.message);
          onError(data.message);
          setHasSubmitted(false);
          break;

        case 'error':
          console.error('[LivewireWebView] Error:', data.message);
          onError(data.message);
          setHasSubmitted(false);
          break;

        case 'console':
          console.log('[LivewireWebView] Console:', data.message);
          break;
      }
    } catch {
      console.log('[LivewireWebView] Raw message:', event.nativeEvent.data);
    }
  }, [onSuccess, onError, successPattern]);

  const handleNavigationStateChange = useCallback((navState: WebViewNavigation) => {
    console.log('[LivewireWebView] Navigation state:', navState.url);
    
    const match = navState.url.match(successPattern);
    if (match && match[1]) {
      console.log('[LivewireWebView] Success from navigation! Token:', match[1]);
      onSuccess(match[1]);
    }
  }, [onSuccess, successPattern]);

  const handleError = useCallback((syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('[LivewireWebView] WebView error:', nativeEvent);
    onError(nativeEvent.description || 'Failed to load page');
  }, [onError]);

  if (Platform.OS === 'web') {
    return null;
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: baseUrl }}
        style={styles.webview}
        onMessage={handleMessage}
        onNavigationStateChange={handleNavigationStateChange}
        onError={handleError}
        injectedJavaScript={injectedJavaScript}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        startInLoadingState={true}
        originWhitelist={['*']}
        userAgent="Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Mobile Safari/537.36"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    height: 350,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#8B5CF6',
    overflow: 'hidden',
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  webview: {
    flex: 1,
  },
});
