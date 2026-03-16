from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
# import openai
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
import base64
# from emergentintegrations.llm.chat import LlmChat, UserMessage
# from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration
from contextlib import asynccontextmanager

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR/'.env')

def _get_env_value(name: str, default: str | None = None) -> str:
    raw = os.environ.get(name, default)
    if raw is None:
        raise KeyError(name)
    value = raw.strip()
    # Handle accidental wrapping/escaping in .env (e.g. \"value\").
    value = value.replace('\\"', '"').strip('"').strip("'")
    return value


# MongoDB connection
mongo_url = _get_env_value("MONGO_URL")
client = AsyncIOMotorClient(mongo_url)
db = client[_get_env_value("DB_NAME")]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
JWT_SECRET = _get_env_value("JWT_SECRET", "your-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# LLM Configuration
EMERGENT_LLM_KEY = _get_env_value("EMERGENT_LLM_KEY", "")

# Create the main app
@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    client.close()


app = FastAPI(lifespan=lifespan)
api_router = APIRouter(prefix="/api")


# Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: User


class CampaignCreate(BaseModel):
    name: str
    product: str
    target_audience: str
    platform: str  # google, facebook, linkedin, all
    tone: str  # professional, casual, urgent, friendly
    key_benefits: str


class GeneratedAd(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    headline: str
    description: str
    cta: str
    image_base64: Optional[str] = None
    platform: str


class Campaign(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    product: str
    target_audience: str
    platform: str
    tone: str
    key_benefits: str
    ads: List[GeneratedAd] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# Helper Functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")


# Auth Endpoints
@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create user
    user = User(
        email=user_data.email,
        name=user_data.name
    )
    user_dict = user.model_dump()
    user_dict["password_hash"] = hash_password(user_data.password)
    user_dict["created_at"] = user_dict["created_at"].isoformat()

    await db.users.insert_one(user_dict)

    # Create token
    access_token = create_access_token(data={"sub": user.id})

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=user
    )


@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user_doc = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not verify_password(credentials.password, user_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Convert datetime
    if isinstance(user_doc["created_at"], str):
        user_doc["created_at"] = datetime.fromisoformat(user_doc["created_at"])

    user = User(**{k: v for k, v in user_doc.items() if k != "password_hash"})
    access_token = create_access_token(data={"sub": user.id})

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=user
    )


@api_router.get("/auth/me", response_model=User)
async def get_me(user_id: str = Depends(get_current_user)):
    user_doc = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")

    if isinstance(user_doc["created_at"], str):
        user_doc["created_at"] = datetime.fromisoformat(user_doc["created_at"])

    return User(**user_doc)


# Campaign Endpoints
@api_router.post("/campaigns/generate", response_model=Campaign)
async def generate_campaign(campaign_data: CampaignCreate, user_id: str = Depends(get_current_user)):
    """
    Generate AI-powered ad campaign with copy and images
    """
    try:
        # Determine platforms to generate ads for
        platforms = []
        if campaign_data.platform == "all":
            platforms = ["google", "facebook", "linkedin"]
        else:
            platforms = [campaign_data.platform]

        generated_ads = []

        for platform in platforms:
            # Generate ad copy using AI
            system_message = f"""You are an expert advertising copywriter specializing in {platform} ads.
Create compelling ad copy that converts. Be {campaign_data.tone} in tone.
Format your response as JSON with keys: headline, description, cta
Keep headlines under 30 characters for Google, 40 for Facebook, 70 for LinkedIn.
Descriptions should be 80-150 characters."""

            prompt = f"""Create 2 ad variations for:
Product: {campaign_data.product}
Target Audience: {campaign_data.target_audience}
Key Benefits: {campaign_data.key_benefits}
Platform: {platform}

Return ONLY a JSON array with 2 ad objects, each with headline, description, and cta fields."""

            chat = LlmChat(
                api_key=EMERGENT_LLM_KEY,
                session_id=f"campaign-{uuid.uuid4()}",
                system_message=system_message
            ).with_model("openai", "gpt-5.2")

            user_message = UserMessage(text=prompt)
            response = await chat.send_message(user_message)

            # Parse AI response
            import json
            try:
                response_text = response.strip()
                if response_text.startswith("```json"):
                    response_text = response_text[7:]
                if response_text.endswith("```"):
                    response_text = response_text[:-3]
                response_text = response_text.strip()

                ad_variations = json.loads(response_text)

                # Generate images for each variation
                image_gen = OpenAIImageGeneration(api_key=EMERGENT_LLM_KEY)

                for idx, ad_data in enumerate(ad_variations):
                    # Generate image
                    image_prompt = f"Professional advertising image for {campaign_data.product}, {campaign_data.tone} style, clean and modern, suitable for {platform} ads"

                    try:
                        images = await image_gen.generate_images(
                            prompt=image_prompt,
                            model="gpt-image-1",
                            number_of_images=1
                        )

                        image_base64 = None
                        if images and len(images) > 0:
                            image_base64 = base64.b64encode(images[0]).decode('utf-8')
                    except Exception as img_error:
                        logging.error(f"Image generation error: {img_error}")
                        image_base64 = None

                    generated_ad = GeneratedAd(
                        headline=ad_data.get("headline", ""),
                        description=ad_data.get("description", ""),
                        cta=ad_data.get("cta", ""),
                        image_base64=image_base64,
                        platform=platform
                    )
                    generated_ads.append(generated_ad)
            except json.JSONDecodeError as e:
                logging.error(f"Failed to parse AI response: {e}")
                # Fallback: create basic ad
                generated_ad = GeneratedAd(
                    headline=f"{campaign_data.product} - Special Offer",
                    description=f"Discover {campaign_data.product} for {campaign_data.target_audience}",
                    cta="Learn More",
                    image_base64=None,
                    platform=platform
                )
                generated_ads.append(generated_ad)

        # Create campaign
        campaign = Campaign(
            user_id=user_id,
            name=campaign_data.name,
            product=campaign_data.product,
            target_audience=campaign_data.target_audience,
            platform=campaign_data.platform,
            tone=campaign_data.tone,
            key_benefits=campaign_data.key_benefits,
            ads=generated_ads
        )

        # Save to database
        campaign_dict = campaign.model_dump()
        campaign_dict["created_at"] = campaign_dict["created_at"].isoformat()

        await db.campaigns.insert_one(campaign_dict)

        return campaign

    except Exception as e:
        logging.error(f"Campaign generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate campaign: {str(e)}")


@api_router.get("/campaigns", response_model=List[Campaign])
async def get_campaigns(user_id: str = Depends(get_current_user)):
    campaigns = await db.campaigns.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(100)

    for campaign in campaigns:
        if isinstance(campaign["created_at"], str):
            campaign["created_at"] = datetime.fromisoformat(campaign["created_at"])

    return campaigns


@api_router.get("/campaigns/{campaign_id}", response_model=Campaign)
async def get_campaign(campaign_id: str, user_id: str = Depends(get_current_user)):
    campaign = await db.campaigns.find_one({"id": campaign_id, "user_id": user_id}, {"_id": 0})
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    if isinstance(campaign["created_at"], str):
        campaign["created_at"] = datetime.fromisoformat(campaign["created_at"])

    return Campaign(**campaign)


@api_router.delete("/campaigns/{campaign_id}")
async def delete_campaign(campaign_id: str, user_id: str = Depends(get_current_user)):
    result = await db.campaigns.delete_one({"id": campaign_id, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return {"message": "Campaign deleted successfully"}


# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=_get_env_value("CORS_ORIGINS", "*").split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


