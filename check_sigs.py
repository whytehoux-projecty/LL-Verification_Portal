import inspect
from livekit.plugins import elevenlabs
from livekit.agents import llm

try:
    from livekit.agents.voice_pipeline import VoicePipelineAgent as _Agent
    _agent_name = "VoicePipelineAgent"
except Exception:
    from livekit.agents.voice import Agent as _Agent
    _agent_name = "livekit.agents.voice.Agent"

with open("signatures.txt", "w") as f:
    f.write(f"--- {_agent_name} ---\n")
    try:
        f.write(str(inspect.signature(_Agent.__init__)) + "\n")
        f.write(str(inspect.signature(_Agent)) + "\n")
    except Exception as e:
        f.write(f"Error: {e}\n")

    f.write("\n--- elevenlabs.TTS ---\n")
    try:
        f.write(str(inspect.signature(elevenlabs.TTS.__init__)) + "\n")
    except Exception as e:
        f.write(f"Error: {e}\n")

    f.write("\n--- llm.ChatContext ---\n")
    try:
        f.write(str(inspect.signature(llm.ChatContext.__init__)) + "\n")
    except Exception as e:
        f.write(f"Error: {e}\n")
