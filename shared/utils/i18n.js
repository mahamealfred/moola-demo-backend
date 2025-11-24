const i18next = require('i18next');
const Backend = require('i18next-fs-backend');
const path = require('path');

class I18nManager {
  constructor() {
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;

    await i18next
      .use(Backend)
      .init({
        lng: 'en', // Default language is English
        fallbackLng: 'en',
        supportedLngs: ['en', 'rw', 'fr', 'sw'],
        debug: process.env.NODE_ENV === 'development',
        backend: {
          loadPath: path.join(__dirname, '../locales/{{lng}}.json'),
        },
        interpolation: {
          escapeValue: false,
        },
        returnObjects: false,
        returnEmptyString: false,
        returnNull: false,
      });

    this.initialized = true;
  }

  /**
   * Get translation for a key
   * @param {string} key - Translation key (e.g., 'common.success')
   * @param {string} language - Language code (rw, en, fr)
   * @param {object} options - Interpolation options
   * @returns {string} Translated text
   */
  t(key, language = 'en', options = {}) {
    if (!this.initialized) {
      console.warn('I18n not initialized. Call init() first.');
      return key;
    }

    return i18next.t(key, { ...options, lng: language });
  }

  /**
   * Get language from request headers or query params
   * @param {object} req - Express request object
   * @returns {string} Language code
   */
  getLanguageFromRequest(req) {
    // Check query parameter first
    if (req.query && req.query.lang) {
      const lang = req.query.lang.toLowerCase();
      if (['en', 'rw', 'fr', 'sw'].includes(lang)) {
        return lang;
      }
    }

    // Check Accept-Language header
    const acceptLanguage = req.headers['accept-language'];
    if (acceptLanguage) {
      if (acceptLanguage.includes('en')) return 'en';
      if (acceptLanguage.includes('fr')) return 'fr';
      if (acceptLanguage.includes('sw')) return 'sw';
    }

    // Check custom header
    const customLang = req.headers['x-language'];
    if (customLang && ['en', 'rw', 'fr', 'sw'].includes(customLang.toLowerCase())) {
      return customLang.toLowerCase();
    }

    // Default to English
    return 'en';
  }

  /**
   * Middleware for Express to add i18n to request
   */
  middleware() {
    return (req, res, next) => {
      const language = this.getLanguageFromRequest(req);
      
      // Add translation function to request
      req.t = (key, options = {}) => this.t(key, language, options);
      req.language = language;

      // Add translation function to response locals for view rendering
      res.locals.t = req.t;
      res.locals.language = language;

      next();
    };
  }

  /**
   * Change language for i18next instance
   * @param {string} language - Language code
   */
  changeLanguage(language) {
    if (['en', 'rw', 'fr', 'sw'].includes(language)) {
      i18next.changeLanguage(language);
    }
  }
}

// Export singleton instance
const i18nManager = new I18nManager();

module.exports = {
  I18nManager,
  i18nManager,
  
  // Helper functions for common response patterns
  createResponse: (success, messageKey, data = null, language = 'en') => {
    return {
      success,
      message: i18nManager.t(messageKey, language),
      data
    };
  },

  createErrorResponse: (messageKey, language = 'en', statusCode = 400) => {
    return {
      success: false,
      message: i18nManager.t(messageKey, language),
      statusCode,
      data: null
    };
  }
};