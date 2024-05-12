// Middleware to include cookies in every request
export const includeCookies = (req, res, next) => {
   
    // Include cookies in request
    if (req.headers.cookie) {
        req.cookies = parseCookies(req.headers.cookie);
    } else {
        req.cookies = {};
    }

    next();
};

// Parse cookies from string to object
const parseCookies = (cookieString) => {
    return cookieString.split(';').reduce((cookies, cookie) => {
        const [name, value] = cookie.trim().split('=');
        cookies[name] = value;
        return cookies;
    }, {});
};


