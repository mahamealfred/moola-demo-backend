import logger from "../utils/logger.js";

const errorHandler = (err, req, res, next) => {
    logger.error(err.stack);
  
    // Use translation if available, otherwise fallback to original message
    const message = req.t ? req.t('common.server_error') : err.message || "Internal server error";
    
    res.status(err.status || 500).json({
      success: false,
      message: message,
    });
  };
  
export default errorHandler