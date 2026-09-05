import logging
import sys

def setup_logging():
    logger = logging.getLogger("reconcore")
    logger.setLevel(logging.INFO)
    
    # Create console handler with formatting
    ch = logging.StreamHandler(sys.stdout)
    ch.setLevel(logging.INFO)
    
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    ch.setFormatter(formatter)
    
    # Add handler if not already present
    if not logger.handlers:
        logger.addHandler(ch)
        
    return logger

logger = setup_logging()
