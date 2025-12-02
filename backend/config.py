from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/lexnova"
    
    # LiveKit
    livekit_url: str = "ws://localhost:7880"
    livekit_api_key: str = ""
    livekit_api_secret: str = ""
    
    # AI Services
    gemini_api_key: str = ""
    elevenlabs_api_key: str = ""
    deepgram_api_key: str = ""
    
    # Redis (for future async tasks)
    redis_url: str = "redis://localhost:6379"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
