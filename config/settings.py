"""Application configuration for Master Agent Orchestrator."""

import os
from dotenv import load_dotenv

load_dotenv()

SERVICE_NAME = "master-agent-orchestrator"
SERVICE_PORT = 8000
VERSION = "1.0.0"

REQUEST_TIMEOUT_S = 2.0

# Representative endpoint per domain (overridable via env)
MFG_URL      = os.getenv("MFG_URL", "http://localhost:8001/api/decision")
SCM_URL      = os.getenv("SCM_URL", "http://localhost:8016/api/decision")
TRADING_URL  = os.getenv("TRADING_URL", "http://localhost:8021/api/decision")
TREASURY_URL = os.getenv("TREASURY_URL", "http://localhost:8055/api/decision")
TAX_URL      = os.getenv("TAX_URL", "http://localhost:8054/api/decision")
IT_OT_URL    = os.getenv("IT_OT_URL", "http://localhost:8043/api/decision")
HR_SAFETY_URL = os.getenv("HR_SAFETY_URL", "http://localhost:8034/api/decision")
