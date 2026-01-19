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
  const [webViewKey, setWebViewKey] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (trigger) {
      console.log('[LivewireWebView] Trigger activated, resetting state...');
      setHasSubmitted(false);
      setIsReady(false);
      setWebViewKey(prev => prev + 1);
      
      timeoutRef.current = setTimeout(() => {
        console.log('[LivewireWebView] Timeout reached!');
        onError('Loading timeout. Please try again.');
      }, 30000);
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [trigger, onError]);

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
      // Wait for DOM to be ready
      function checkReady() {
        var emailInput = document.querySelector('input[type="email"]') || 
                          document.querySelector('input[name="emailAddress"]') ||
                          document.querySelector('input[name="email"]');
        
        if (!emailInput) {
          var allInputs = document.querySelectorAll('input');
          for (var i = 0; i < allInputs.length; i++) {
            var inp = allInputs[i];
            var wireModel = inp.getAttribute('wire:model') || 
                            inp.getAttribute('wire:model.live') || 
                            inp.getAttribute('wire:model.blur');
            if (wireModel === 'emailAddress') {
              emailInput = inp;
              break;
            }
          }
        }
        
        if (emailInput) {
          console.log('[WebView] Page ready - email input found');
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'page_loaded',
            url: window.location.href
          }));
        } else {
          console.log('[WebView] Waiting for email input...');
          setTimeout(checkReady, 500);
        }
      }
      
      // Start checking after a short delay
      setTimeout(checkReady, 1000);

      // Override console.log to capture Livewire logs
      var originalLog = console.log;
      console.log = function() {
        originalLog.apply(console, arguments);
        try {
          var args = Array.prototype.slice.call(arguments);
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'console',
            message: args.map(function(a) { return typeof a === 'object' ? JSON.stringify(a) : String(a); }).join(' ')
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
      var lastUrl = window.location.href;
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

  const fillAndSubmitForm = useCallback((emailToUse: string) => {
    if (!webViewRef.current || !emailToUse || hasSubmitted) {
      console.log('[LivewireWebView] Cannot submit - missing webview or email or already submitted');
      console.log('[LivewireWebView] webViewRef.current:', !!webViewRef.current);
      console.log('[LivewireWebView] emailToUse:', emailToUse);
      console.log('[LivewireWebView] hasSubmitted:', hasSubmitted);
      return;
    }

    console.log('[LivewireWebView] ========================================');
    console.log('[LivewireWebView] FILLING FORM WITH EMAIL:', emailToUse);
    console.log('[LivewireWebView] ========================================');
    setHasSubmitted(true);

    const safeEmail = emailToUse.replace(/'/g, "\\'").replace(/"/g, '\\"');

    const submitScript = `
      (function() {
        try {
          var emailValue = '${safeEmail}';
          console.log('[WebView] Starting form fill with email:', emailValue);

          // Find the email input field
          var emailInput = document.querySelector('input[type="email"]') || 
                            document.querySelector('input[name="emailAddress"]') ||
                            document.querySelector('input[name="email"]');
          
          // If not found, try to find by wire:model attribute manually
          if (!emailInput) {
            var allInputs = document.querySelectorAll('input');
            for (var i = 0; i < allInputs.length; i++) {
              var inp = allInputs[i];
              if (inp.getAttribute('wire:model') === 'emailAddress' ||
                  inp.getAttribute('wire:model.live') === 'emailAddress' ||
                  inp.getAttribute('wire:model.blur') === 'emailAddress') {
                emailInput = inp;
                break;
              }
            }
          }
          
          if (!emailInput) {
            console.log('[WebView] Email input NOT FOUND!');
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'error',
              message: 'Email input not found'
            }));
            return;
          }

          console.log('[WebView] Found email input:', emailInput.tagName, emailInput.name || emailInput.type);
          console.log('[WebView] Current value:', emailInput.value);
          console.log('[WebView] Setting to:', emailValue);

          // Clear and set the email value
          emailInput.focus();
          emailInput.value = '';
          emailInput.value = emailValue;
          
          // Trigger all possible events for Livewire
          emailInput.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
          emailInput.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
          emailInput.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
          emailInput.dispatchEvent(new Event('blur', { bubbles: true }));

          console.log('[WebView] After setting - value is now:', emailInput.value);

          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'email_set',
            email: emailInput.value
          }));

          // Wait a moment for Livewire to process
          setTimeout(function() {
            console.log('[WebView] Looking for submit button...');
            // Find and click the submit button
            var submitButton = document.querySelector('button[type="submit"]') ||
                                document.querySelector('form button') ||
                                document.querySelector('button:not([type="button"])');
            
            // If not found, try to find by wire:click attribute manually
            if (!submitButton) {
              var allButtons = document.querySelectorAll('button');
              for (var j = 0; j < allButtons.length; j++) {
                var btn = allButtons[j];
                if (btn.getAttribute('wire:click') === 'submitForm') {
                  submitButton = btn;
                  break;
                }
              }
            }

            if (!submitButton) {
              console.log('[WebView] Submit button NOT FOUND!');
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'error',
                message: 'Submit button not found'
              }));
              return;
            }

            console.log('[WebView] Found submit button:', submitButton.tagName, submitButton.textContent);

            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'submitting'
            }));

            submitButton.click();
            console.log('[WebView] Submit button clicked!');

            // Check for errors after submission
            setTimeout(function() {
              var errorEl = document.querySelector('.text-red-500') ||
                             document.querySelector('.text-danger') ||
                             document.querySelector('[class*="error"]') ||
                             document.querySelector('.invalid-feedback');
              
              if (errorEl && errorEl.textContent.trim()) {
                console.log('[WebView] Validation error found:', errorEl.textContent.trim());
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'validation_error',
                  message: errorEl.textContent.trim()
                }));
              }
            }, 2000);

          }, 800);

        } catch(e) {
          console.log('[WebView] ERROR:', e.message);
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'error',
            message: e.message || 'Unknown error'
          }));
        }
      })();
      true;
    `;

    webViewRef.current.injectJavaScript(submitScript);
  }, [hasSubmitted]);

  useEffect(() => {
    if (trigger && isReady && !hasSubmitted && email) {
      console.log('[LivewireWebView] ========================================');
      console.log('[LivewireWebView] READY TO SUBMIT!');
      console.log('[LivewireWebView] Email:', email);
      console.log('[LivewireWebView] ========================================');
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      const currentEmail = email;
      setTimeout(() => {
        console.log('[LivewireWebView] Executing fillAndSubmitForm...');
        fillAndSubmitForm(currentEmail);
      }, 1000);
    }
  }, [trigger, isReady, hasSubmitted, email, fillAndSubmitForm]);

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
        key={webViewKey}
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
    top: -9999,
    left: -9999,
    width: 400,
    height: 700,
    opacity: 0,
  },
  webview: {
    flex: 1,
    width: 400,
    height: 700,
  },
});
