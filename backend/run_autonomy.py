
import asyncio
import logging
from app.modules.agents.judge import JudgeAgent
from dotenv import load_dotenv

# Load Environment
load_dotenv()

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("SystemRunner")

async def run_services():
    """
    Main entry point to run background agents.
    In a real deployment, this would be managed by Supervisors or K8s.
    """
    logger.info("🚀 Zenith Sovereign System: Initializing Agents...")
    
    # Initialize Agents
    judge = JudgeAgent()
    
    # Define tasks
    tasks = [
        judge.start(),
        # Add future agents here (e.g., Prophet, Sentry)
    ]
    
    logger.info("✅ Active Agents: JudgeAgent V2")
    logger.info("   -> Listening for events on Redis Stream: zenith_events")
    
    # Run forever
    await asyncio.gather(*tasks)

if __name__ == "__main__":
    try:
        asyncio.run(run_services())
    except KeyboardInterrupt:
        logger.info("🛑 System Shutdown Initiated.")
