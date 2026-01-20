import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class I18nManager {
  constructor() {
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;

    try {
      const loadPath = path.join(__dirname, '../locales/{{lng}}.json');
      
      await i18next
        .use(Backend)
        .init({
          lng: 'en', // Default language is English
          fallbackLng: 'en',
          supportedLngs: ['en', 'rw', 'fr', 'sw'],
          debug: false,
          backend: {
            loadPath: loadPath,
          },
          interpolation: {
            escapeValue: false,
          },
          returnObjects: false,
          returnEmptyString: false,
          returnNull: false,
          load: 'all',
          preload: ['en', 'rw', 'fr', 'sw'],
          saveMissing: false
        });

      // Verify all languages are loaded
      console.log('✅ i18n initialized successfully with languages:', i18next.languages);
      this.initialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize i18n:', error);
      throw error;
    }
  }

  /**
   * Get translation for a key
   * @param {string} key - Translation key (e.g., 'common.success')
   * @param {string} language - Language code (rw, en, fr, sw)
   * @param {object} options - Interpolation options
   * @returns {string} Translated text
   */
  t(key, language = 'en', options = {}) {
    if (!this.initialized) {
      console.warn('I18n not initialized. Call init() first.');
      return key;
    }

    // Ensure the language is supported
    const supportedLanguages = ['en', 'rw', 'fr', 'sw'];
    const targetLanguage = supportedLanguages.includes(language) ? language : 'en';
    
    try {
      const translation = i18next.t(key, { ...options, lng: targetLanguage });
      // If translation returns the key itself, it means translation was not found
      if (translation === key) {
        console.warn(`Translation missing for key '${key}' in language '${targetLanguage}'`);
      }
      return translation;
    } catch (error) {
      console.error(`Translation error for key '${key}' in language '${targetLanguage}':`, error);
      return key;
    }
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

    // Default to Kinyarwanda
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

// Helper functions for common response patterns
const createResponse = (success, messageKey, data = null, language = 'en') => {
  let message = messageKey;
  try {
    if (i18nManager && i18nManager.initialized) {
      message = i18nManager.t(messageKey, language);
    }
  } catch (error) {
    console.error('Error translating message:', error);
  }
  return {
    success,
    message,
    data
  };
};

const createErrorResponse = (messageKey, language = 'en', statusCode = 400) => {
  let message = messageKey;
  try {
    if (i18nManager && i18nManager.initialized) {
      message = i18nManager.t(messageKey, language);
    }
  } catch (error) {
    console.error('Error translating error message:', error);
  }
  return {
    success: false,
    message,
    statusCode,
    data: null
  };
};

export {
  I18nManager,
  i18nManager,
  createResponse,
  createErrorResponse
};