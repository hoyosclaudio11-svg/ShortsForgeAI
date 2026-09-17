"""Emit audio and real word boundaries from the same Edge TTS stream."""
import asyncio
import json
import sys
import edge_tts


async def main():
    text, voice, output = sys.argv[1:]
    words = []
    stream = edge_tts.Communicate(text, voice, rate="+0%", boundary="WordBoundary")
    with open(output, "wb") as audio:
        async for event in stream.stream():
            if event["type"] == "audio":
                audio.write(event["data"])
            elif event["type"] == "WordBoundary":
                words.append({"word": event["text"], "start": event["offset"] / 10_000_000,
                              "end": (event["offset"] + event["duration"]) / 10_000_000})
    with open(output + ".json", "w", encoding="utf-8") as metadata:
        json.dump(words, metadata, ensure_ascii=False)


asyncio.run(main())
