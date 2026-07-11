import sys
from loguru import logger
from app.config.settings import settings


def setup_logging():
    logger.remove()

    log_format = (
        "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
        "<level>{level: <8}</level> | "
        "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
        "<level>{message}</level>"
    )

    logger.add(sys.stdout, format=log_format, level=settings.LOG_LEVEL, colorize=True)

    logger.add(
        settings.LOG_FILE,
        format=log_format,
        level=settings.LOG_LEVEL,
        rotation="10 MB",
        retention="30 days",
        compression="zip",
    )

    return logger
