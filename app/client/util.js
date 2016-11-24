// Utility functionality.

/*jslint browser: true, maxlen: 80 */

/*global define, window */

define(function () {
    'use strict';

    // Return true once document has loaded, incl. sub-resources.
    var documentIsComplete = function () {
        return document.readyState === 'complete';
    };

    // Returns true once document is finished parsing but possibly still
    // loading sub-resources.
    var documentIsInteractive = function () {
        // Note that Android 2.3.5's standard browser uses `"loaded"` in place
        // of `"interactive"` as value for `readyState`. For discussion, see:
        //
        // <url:http://stackoverflow.com/questions/13348029/
        // values-for-document-readystate-in-android-2-3-browser>

        return (document.readyState === 'interactive' ||
                document.readyState === 'loaded' ||
                documentIsComplete());
    };

    var autoRefreshAppCache = function () {
        window.applicationCache.addEventListener(
            "updateready",
            window.applicationCache.swapCache,
            false
        );
    };

    return Object.create(null, {
        // Runs `onDocumentIsInteractive` once document is finished parsing but
        // still loading sub-resources.
        onceDocumentIsInteractive: {value: function (onDocumentIsInteractive) {
            if (documentIsInteractive()) {
                onDocumentIsInteractive();
            } else {
                // `document.onreadystatechange` is not used as it doesn't fire
                // in Android 2.3.5's standard browser:
                //
                // <url:http://stackoverflow.com/questions/13346746/
                // document-readystate-on-domcontentloaded>
                window.addEventListener('DOMContentLoaded',
                                        onDocumentIsInteractive, false);
            }
        }},

        // Runs `onDocumentIsComplete` once document has loaded (incl.
        // sub-resources).
        onceDocumentIsComplete: {value: function (onDocumentIsComplete) {
            if (document.readyState === 'interactive' ||
                    document.readyState === 'complete') {
                onDocumentIsComplete();
            } else {
                window.addEventListener('load', onDocumentIsComplete, false);
            }
        }},

        clear: {value: function (el) {
            while (el.firstChild) {
                el.removeChild(el.firstChild);
            }
        }},

        // Returns position of element on viewport, in pixels.
        viewportPos: {value: function (el) {
            var rect = el.getBoundingClientRect();
            return [rect.left, rect.top];
        }},

        elIsInDom: {value: function (el) {
            // `document.contains()` is an alternative, but it's not supported
            // by all targeted browsers (as of December 2013)
            while (el = el.parentNode) {
                if (el === document) {
                    return true;
                }
            }
            return false;
        }},

        autoRefreshAppCache: {value: autoRefreshAppCache}
    });
});
