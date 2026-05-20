/**
 * Language detection middleware.
 * Reads the Accept-Language header and sets req.lang to "fa" or "en".
 * Defaults to "fa" since BiteQuest is a Farsi-first product.
 */
export const detectLanguage = (req, res, next) => {
    const header = req.headers["accept-language"] || "";
    const primary = header.split(",")[0].trim().toLowerCase().split("-")[0];
    req.lang = primary === "en" ? "en" : "fa";
    next();
};
