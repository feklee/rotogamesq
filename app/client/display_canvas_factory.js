// Factory for prototypes for any of the canvases used for displaying the
// interactive board.

/*jslint browser: true, maxlen: 80 */

/*global define */

define(function () {
    "use strict";

    // Returns true, iff visibility has been updated.
    var updateVisibility = function (internal, el) {
        if (internal.isVisible) {
            el.style.display = "block";
            internal.needsToBeRendered = true;
        } else {
            el.style.display = "none";
        }
        internal.visibilityNeedsToBeUpdated = false;
    };

    var show = function (internal) {
        if (!internal.isVisible) {
            internal.isVisible = true;
            internal.visibilityNeedsToBeUpdated = true;
        }
    };

    var hide = function (internal) {
        if (internal.isVisible) {
            internal.isVisible = false;
            internal.visibilityNeedsToBeUpdated = true;
        }
    };

    return Object.create(null, {
        create: {value: function () {
            var internal = {
                isVisible: true,
                visibilityNeedsToBeUpdated: true
            };

            return Object.create(null, {
                visibilityNeedsToBeUpdated: {get: function () {
                    return internal.visibilityNeedsToBeUpdated;
                }},

                isVisible: {get: function () {
                    return internal.isVisible;
                }},

                updateVisibility: {value: function (el) {
                    updateVisibility(internal, el);
                }},

                show: {value: function () {
                    show(internal);
                }},

                hide: {value: function () {
                    hide(internal);
                }}
            });
        }}
    });
});
