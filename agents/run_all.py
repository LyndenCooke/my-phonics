"""
MyPhonicsBooks Agent Launcher
Runs all three agents simultaneously on different ports.

Usage:
    python run_all.py              # Run all agents
    python run_all.py parent       # Run parent chat agent only
    python run_all.py production   # Run production agent only
    python run_all.py marketing    # Run marketing agent only

Requirements:
    pip install -r requirements.txt

Environment:
    ANTHROPIC_API_KEY must be set in environment or in a .env file
"""

import subprocess
import sys
import os
import signal
from pathlib import Path

# Load .env if present
try:
    from dotenv import load_dotenv
    env_path = Path(__file__).parent / ".env"
    if env_path.exists():
        load_dotenv(env_path)
except ImportError:
    pass

AGENTS = {
    "parent": {
        "module": "parent_chat_agent:app",
        "port": 8001,
        "name": "Parent Chat Agent",
    },
    "production": {
        "module": "production_agent:app",
        "port": 8002,
        "name": "Production Agent",
    },
    "marketing": {
        "module": "marketing_agent:app",
        "port": 8003,
        "name": "Marketing Agent",
    },
}

processes = []


def start_agent(key: str):
    agent = AGENTS[key]
    print(f"Starting {agent['name']} on port {agent['port']}...")
    proc = subprocess.Popen(
        [
            sys.executable, "-m", "uvicorn",
            agent["module"],
            "--host", "0.0.0.0",
            "--port", str(agent["port"]),
            "--reload",
        ],
        cwd=str(Path(__file__).parent),
        env={**os.environ},
    )
    processes.append(proc)
    return proc


def shutdown(signum=None, frame=None):
    print("\nShutting down all agents...")
    for proc in processes:
        proc.terminate()
    for proc in processes:
        proc.wait()
    print("All agents stopped.")
    sys.exit(0)


if __name__ == "__main__":
    # Check for API key
    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("WARNING: ANTHROPIC_API_KEY not set. Agents will fail on API calls.")
        print("Set it with: export ANTHROPIC_API_KEY=your-key-here")
        print("Or create a .env file in the agents/ directory.\n")

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    # Determine which agents to run
    args = sys.argv[1:]
    if args:
        for arg in args:
            if arg in AGENTS:
                start_agent(arg)
            else:
                print(f"Unknown agent: {arg}. Options: {', '.join(AGENTS.keys())}")
                sys.exit(1)
    else:
        # Run all agents
        for key in AGENTS:
            start_agent(key)

    print("\n--- MyPhonicsBooks Agents Running ---")
    for key, agent in AGENTS.items():
        if not args or key in args:
            print(f"  {agent['name']}: http://localhost:{agent['port']}")
            print(f"    Docs: http://localhost:{agent['port']}/docs")
    print("-------------------------------------\n")
    print("Press Ctrl+C to stop all agents.\n")

    # Wait for all processes
    try:
        for proc in processes:
            proc.wait()
    except KeyboardInterrupt:
        shutdown()
