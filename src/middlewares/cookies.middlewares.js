// Middleware to include cookies in every request
export const includeCookies = (req, res, next) => {
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Origin', 'https://sprcbaghpat.vercel.app');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
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


