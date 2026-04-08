// Lightweight Toast notification component
// Uses window.toastr if available, otherwise uses built-in implementation
// Plain JS version (non-ESM)

(function (global) {
    // Default options
    var defaultOptions = {
        duration: 3000,
        position: "top-right",
        closable: true,
    };

    /**
     * Set default configuration
     * @param {Object} options - Configuration options
     * @param {number} options.duration - Default display duration (ms), 0 means no auto-close
     * @param {string} options.position - Position: top-right, top-left, top-center, bottom-right, bottom-left, bottom-center
     * @param {boolean} options.closable - Whether to show close button
     */
    function setToastDefaults(options) {
        for (var key in options) {
            if (options.hasOwnProperty(key)) {
                defaultOptions[key] = options[key];
            }
        }
    }

    function showToast(message, type, options) {
        type = type || "info";
        options = options || {};

        // Use toastr if available
        if (global.toastr) {
            var method = type || "info";
            if (typeof global.toastr[method] === "function") {
                return global.toastr[method](message, options.title);
            }
            return global.toastr.info(message, options.title);
        }

        // Use built-in implementation
        return builtinToast(message, type, options);
    }

    /**
     * Built-in Toast implementation
     */
    function builtinToast(message, type, options) {
        // Merge default options
        var duration = options.duration !== undefined ? options.duration : defaultOptions.duration;
        var position = options.position !== undefined ? options.position : defaultOptions.position;
        var closable = options.closable !== undefined ? options.closable : defaultOptions.closable;

        // Create or get container
        var container = document.getElementById("builtin-toastx-container");
        if (!container) {
            container = document.createElement("div");
            container.id = "builtin-toastx-container";
            container.className = "toastx-container toastx-" + position;
            document.body.appendChild(container);
        }

        // Create toast element
        var toast = document.createElement("div");
        toast.className = "toastx toastx-" + type;
        toast.setAttribute("role", "alert");

        // Icon
        var icon = getIcon(type);
        if (icon) {
            var iconSpan = document.createElement("span");
            iconSpan.className = "toastx-icon";
            iconSpan.textContent = icon;
            toast.appendChild(iconSpan);
        }

        // Message content container
        var contentDiv = document.createElement("div");
        contentDiv.className = "toastx-content";

        // Message text
        var messageEl = document.createElement("span");
        messageEl.className = "toastx-message";
        messageEl.textContent = message;
        contentDiv.appendChild(messageEl);

        // Timestamp
        var timestampEl = document.createElement("span");
        timestampEl.className = "toastx-timestamp";
        timestampEl.textContent = new Date().toLocaleString();
        contentDiv.appendChild(timestampEl);

        toast.appendChild(contentDiv);

        // Close button
        if (closable) {
            var closeBtn = document.createElement("button");
            closeBtn.className = "toastx-close";
            closeBtn.innerHTML = "&times;";
            closeBtn.setAttribute("aria-label", "Close");
            closeBtn.addEventListener("click", function () {
                removeToast(toast);
            });
            toast.appendChild(closeBtn);
        }

        // Insert new message at top of container
        container.insertBefore(toast, container.firstChild);

        // Animation: enter
        requestAnimationFrame(function () {
            toast.classList.add("toastx-show");
        });

        // Auto-close timer
        var timer;
        var isHovering = false;

        var scheduleClose = function () {
            if (duration > 0 && !isHovering) {
                timer = setTimeout(function () {
                    removeToast(toast);
                }, duration);
            }
        };

        // Start timer initially
        scheduleClose();

        // Pause timer on mouse hover, don't resume after mouse leaves
        if (duration > 0) {
            toast.addEventListener("mouseover", function () {
                clearTimeout(timer);
                isHovering = false;
                contentDiv.style.border = '1px dotted #5a93ff';
                // Don't auto-close after mouse leaves, must close manually
            });
        }

        return {
            close: function () {
                removeToast(toast);
            },
        };
    }

    function removeToast(toast) {
        toast.classList.remove("toastx-show");
        toast.classList.add("toastx-hide");

        // Wait for close animation to complete before removing
        var onAnimationEnd = function () {
            toast.removeEventListener("transitionend", onAnimationEnd);
            toast.remove();
            // Remove container when empty
            var container = document.getElementById("builtin-toastx-container");
            if (container && !container.children.length) {
                container.remove();
            }
        };

        toast.addEventListener("transitionend", onAnimationEnd);

        // Force remove if animation stopped triggering
        setTimeout(function () {
            if (toast.parentElement) {
                toast.remove();
                var container = document.getElementById("builtin-toastx-container");
                if (container && !container.children.length) {
                    container.remove();
                }
            }
        }, 350);
    }

    function getIcon(type) {
        var icons = {
            success: "✓",
            error: "✕",
            warning: "⚠",
            info: "ℹ",
        };
        return icons[type] || icons.info;
    }

    // Export to global
    var toast = showToast;
    toast.success = function (msg, opts) {
        return showToast(msg, "success", opts);
    };
    toast.error = function (msg, opts) {
        return showToast(msg, "error", opts);
    };
    toast.warning = function (msg, opts) {
        return showToast(msg, "warning", opts);
    };
    toast.info = function (msg, opts) {
        return showToast(msg, "info", opts);
    };

    // Expose to global
    global.setToastDefaults = setToastDefaults;
    global.showToast = showToast;
    global.toast = toast;
})(typeof window !== "undefined" ? window : this);
