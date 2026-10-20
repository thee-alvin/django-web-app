(function () {
    var originalFetch = window.fetch.bind(window);

    function getCookie(name) {
        var prefix = name + "=";
        var cookies = document.cookie.split(";");

        for (var index = 0; index < cookies.length; index += 1) {
            var cookie = cookies[index].trim();
            if (cookie.indexOf(prefix) === 0) {
                return decodeURIComponent(cookie.substring(prefix.length));
            }
        }

        return "";
    }

    window.fetch = function (input, init) {
        var options = init || {};
        var requestUrl = typeof input === "string" ? input : input.url;
        var url = new URL(requestUrl, window.location.href);
        var method = (options.method || (input instanceof Request ? input.method : "GET"))
            .toUpperCase();
        var safeMethods = ["GET", "HEAD", "OPTIONS", "TRACE"];

        if (url.origin === window.location.origin && safeMethods.indexOf(method) === -1) {
            var headers = new Headers(
                options.headers || (input instanceof Request ? input.headers : undefined)
            );
            var csrfToken = getCookie("csrftoken");

            if (csrfToken && !headers.has("X-CSRFToken")) {
                headers.set("X-CSRFToken", csrfToken);
            }

            options = Object.assign({}, options, { headers: headers });
        }

        return originalFetch(input, options);
    };
})();
