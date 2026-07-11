from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from loguru import logger
from app.config.settings import settings

_client: AsyncIOMotorClient = None
_db: AsyncIOMotorDatabase = None


async def connect_db():
    global _client, _db
    logger.info("Connecting to MongoDB...")
    _client = AsyncIOMotorClient(
        settings.MONGODB_URL,
        serverSelectionTimeoutMS=5000,
        connectTimeoutMS=5000,
        socketTimeoutMS=5000,
    )
    _db = _client[settings.MONGODB_DB_NAME]

    for attempt in range(1, 4):
        try:
            await _client.admin.command("ping")
            logger.info(f"Connected to MongoDB: {settings.MONGODB_DB_NAME}")
            await _create_indexes()
            return
        except Exception as e:
            logger.warning(f"MongoDB connection attempt {attempt}/3 failed: {e}")
            if attempt < 3:
                import asyncio
                await asyncio.sleep(2)

    logger.error(
        "Could not connect to MongoDB after 3 attempts. "
        "Make sure MongoDB is running on: " + settings.MONGODB_URL
    )
    logger.error("Start MongoDB with: net start MongoDB  (or run mongod.exe)")


async def disconnect_db():
    global _client
    if _client:
        _client.close()
        logger.info("MongoDB connection closed")


def get_database() -> AsyncIOMotorDatabase:
    return _db


async def _create_indexes():
    db = get_database()
    await db.users.create_index("email", unique=True)
    await db.users.create_index("role")
    await db.cases.create_index("case_number", unique=True)
    await db.cases.create_index("assigned_officer_id")
    await db.chat_history.create_index("user_id")
    await db.chat_history.create_index("session_id")
    await db.legal_documents.create_index("title")
    await db.legal_documents.create_index("document_type")
    await db.evidence.create_index("case_id")
    await db.graph_nodes.create_index([("case_id", 1), ("node_type", 1)])
    await db.graph_relationships.create_index([("source_id", 1), ("target_id", 1)])
    await db.reports.create_index("case_id")
    await db.reports.create_index("created_by")
    logger.info("Database indexes created")
